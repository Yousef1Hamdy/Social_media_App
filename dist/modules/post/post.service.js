"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postService = exports.PostService = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("../../common");
const DB_1 = require("../../DB");
const node_crypto_1 = require("node:crypto");
const mongoose_2 = require("../../common/utils/mongoose");
const post_1 = require("../../common/utils/post");
const post_model_1 = require("../../DB/models/post.model");
class PostService {
    redis;
    notification;
    postRepository;
    userRepository;
    commentRepository;
    s3;
    constructor() {
        this.redis = common_1.redisService;
        this.notification = common_1.notificationService;
        this.s3 = common_1.s3Service;
        this.userRepository = new DB_1.UserRepository(DB_1.UserModel);
        this.commentRepository = new DB_1.CommentRepository(DB_1.CommentModel);
        this.postRepository = new DB_1.PostRepository(post_model_1.PostModel);
    }
    async listPost({ size, page, search }, user) {
        const posts = this.postRepository.paginate({
            filter: {
                $or: (0, post_1.getAvailability)(user),
            },
            page,
            size,
            options: {
                populate: [{ path: "comments", populate: [{ path: "replay" }] }],
            },
        });
        return posts;
    }
    async createPost({ availability, content, files, tags }, user) {
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccount = await this.userRepository.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (mentionedAccount.length != tags.length) {
                throw new common_1.NotFoundException("Fail to find some or all mentioned accounts ");
            }
            for (const tag of tags) {
                mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
                ((await this.redis.getFCMs(tag)) || []).map((token) => FCM_Tokens.push(token));
            }
        }
        const folderId = (0, node_crypto_1.randomUUID)();
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const post = await this.postRepository.createOne({
            data: {
                createdBy: user._id,
                content: content,
                attachments,
                availability,
                tags: mentions,
                folderId,
            },
        });
        if (!post) {
            if (attachments.length) {
                await this.s3.deleteAssets({
                    Keys: attachments.map((ele) => {
                        return { Key: ele };
                    }),
                });
            }
            throw new common_1.BadRequestException("Fail");
        }
        if (FCM_Tokens.length) {
            await this.notification.sendNotifications({
                tokens: FCM_Tokens,
                data: {
                    title: "Post mention",
                    body: JSON.stringify({
                        message: `${user.username} mentioned you in his post`,
                        postId: post._id,
                    }),
                },
            });
        }
        return post.toJSON();
    }
    async updatePost({ postId }, { availability, content, files = [], tags = [], removeFiles = [], removeTags = [], }, user) {
        const post = await this.postRepository.findOne({
            filter: { _id: postId, createdBy: user._id },
        });
        if (!post) {
            throw new common_1.NotFoundException("Fail to find matching post");
        }
        if (!content &&
            !post.content &&
            !files?.length &&
            removeFiles.length == post?.attachments?.length) {
            throw new common_1.BadRequestException("we cannot leave empty post");
        }
        const mentions = [];
        const FCM_Tokens = [];
        if (tags?.length) {
            const mentionedAccount = await this.userRepository.find({
                filter: {
                    _id: { $in: tags },
                },
            });
            if (mentionedAccount.length != tags.length) {
                throw new common_1.NotFoundException("Fail to find some or all mentioned accounts ");
            }
            for (const tag of tags) {
                mentions.push(mongoose_1.Types.ObjectId.createFromHexString(tag));
                ((await this.redis.getFCMs(tag)) || []).map((token) => FCM_Tokens.push(token));
            }
        }
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const updatePost = await this.postRepository.findOneAndUpdate({
            filter: { _id: post._id, createBy: user._id },
            update: [
                {
                    $set: {
                        availability: availability || post.availability,
                        content: content || post.content,
                        attachments: {
                            $setUnion: [
                                {
                                    $setDifference: ["$attachments", removeFiles],
                                },
                                attachments,
                            ],
                        },
                        tags: {
                            $setUnion: [
                                {
                                    $setDifference: [
                                        "$tags",
                                        removeTags.map((ele) => (0, mongoose_2.createObjectId)(ele)),
                                    ],
                                },
                                tags.map((ele) => (0, mongoose_2.createObjectId)(ele)),
                            ],
                        },
                    },
                },
            ],
        });
        if (!updatePost) {
            if (attachments.length) {
                await this.s3.deleteAssets({
                    Keys: attachments.map((ele) => {
                        return { Key: ele };
                    }),
                });
            }
            throw new common_1.BadRequestException("Fail");
        }
        if (removeFiles.length) {
            await this.s3.deleteAssets({
                Keys: removeFiles.map((ele) => {
                    return { Key: ele };
                }),
            });
        }
        if (FCM_Tokens.length) {
            await this.notification.sendNotifications({
                tokens: FCM_Tokens,
                data: {
                    title: "Post mention",
                    body: JSON.stringify({
                        message: `${user.username} mentioned you in his post`,
                        postId: post._id,
                    }),
                },
            });
        }
        return updatePost.toJSON();
    }
    async reactOnPost({ postId }, { emoji }, user) {
        const FCM_Tokens = [];
        const post = await this.postRepository.findOne({
            filter: { _id: postId, $or: (0, post_1.getAvailability)(user) },
        });
        if (!post) {
            throw new common_1.NotFoundException("Fail to find matching post");
        }
        const oldReaction = post.reactions?.find((r) => r.userId.toString() === user._id.toString());
        let updatedPost;
        if (oldReaction && oldReaction.emoji === emoji) {
            updatedPost = await this.postRepository.findOneAndUpdate({
                filter: { _id: postId },
                update: {
                    $pull: { reactions: { userId: user._id } },
                },
            });
            return updatedPost.toJSON();
        }
        if (oldReaction) {
            updatedPost = await this.postRepository.findOneAndUpdate({
                filter: { _id: postId },
                update: {
                    $set: {
                        "reactions.$[elem].emoji": emoji,
                    },
                },
                options: {
                    new: true,
                    arrayFilters: [{ "elem.userId": user._id }],
                },
            });
            return updatedPost.toJSON();
        }
        updatedPost = await this.postRepository.findOneAndUpdate({
            filter: { _id: postId },
            update: {
                $push: {
                    reactions: {
                        userId: user._id,
                        emoji,
                    },
                },
            },
        });
        if (FCM_Tokens.length) {
            await this.notification.sendNotifications({
                tokens: FCM_Tokens,
                data: {
                    title: "Post mention",
                    body: JSON.stringify({
                        message: `${user.username} mentioned you in his post`,
                        postId: post._id,
                    }),
                },
            });
        }
        return updatedPost.toJSON();
    }
    async deletePost({ postId }, user, force = false) {
        const post = await this.postRepository.findOne({
            filter: { _id: postId, $or: (0, post_1.getAvailability)(user) },
        });
        if (!post) {
            throw new common_1.NotFoundException("Fail to find matching post");
        }
        if (force) {
            await this.postRepository.hardDelete({ _id: postId });
            await this.commentRepository.deleteMany({ filter: { postId } });
            return;
        }
        await this.postRepository.softDelete({ _id: postId });
        await this.commentRepository.updateMany({
            filter: { postId },
            update: { deletedAt: new Date() },
        });
    }
    async restorePost({ postId }, user) {
        const post = await this.postRepository.findOne({
            filter: {
                _id: postId,
                paranoid: false,
                deletedAt: { $exists: true },
                $or: (0, post_1.getAvailability)(user),
            },
        });
        if (!post) {
            throw new common_1.NotFoundException("Post not found or already active");
        }
        const restoredPost = await this.postRepository.findOneAndUpdate({
            filter: { _id: postId, paranoid: false, deletedAt: { $exists: true } },
            update: {
                restoredAt: new Date(),
            },
            options: { new: true },
        });
        await this.commentRepository.updateMany({
            filter: { postId, paranoid: false, deletedAt: { $exists: true } },
            update: {
                restoredAt: new Date(),
            },
        });
        return restoredPost;
    }
}
exports.PostService = PostService;
exports.postService = new PostService();
