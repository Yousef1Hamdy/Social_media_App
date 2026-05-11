"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentService = exports.CommentService = void 0;
const comment_repository_1 = require("./../../DB/repository/comment.repository");
const mongoose_1 = require("mongoose");
const common_1 = require("../../common");
const DB_1 = require("../../DB");
const post_1 = require("../../common/utils/post");
class CommentService {
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
        this.postRepository = new DB_1.PostRepository(DB_1.PostModel);
        this.commentRepository = new comment_repository_1.CommentRepository(DB_1.CommentModel);
    }
    async createComment({ postId }, { content, files = [], tags }, user) {
        const post = await this.postRepository.findOne({
            filter: { _id: postId, $or: (0, post_1.getAvailability)(user) },
        });
        if (!post) {
            throw new common_1.NotFoundException("Fail to find matching post");
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
        const folderId = post._id;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const comment = await this.commentRepository.createOne({
            data: {
                createdBy: user._id,
                content: content,
                attachments,
                tags: mentions,
                postId: post._id,
            },
        });
        if (!comment) {
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
                        commentId: comment._id,
                    }),
                },
            });
        }
        return comment.toJSON();
    }
    async createReplayComment({ postId, commentId }, { content, files = [], tags }, user) {
        const comment = await this.commentRepository.findOne({
            filter: { _id: commentId, postId: postId },
            options: {
                populate: [
                    {
                        path: "postId",
                        match: {
                            $or: (0, post_1.getAvailability)(user),
                        },
                    },
                ],
            },
        });
        if (!comment?.postId) {
            throw new common_1.NotFoundException("Fail to find matching post");
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
        const post = comment.postId;
        const folderId = post.folderId;
        let attachments = [];
        if (files?.length) {
            attachments = await this.s3.uploadAssets({
                files: files,
                path: `Post/${folderId}`,
            });
        }
        const reply = await this.commentRepository.createOne({
            data: {
                createdBy: user._id,
                content: content,
                attachments,
                tags: mentions,
                postId: post._id,
                commentId: comment._id,
            },
        });
        if (!reply) {
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
                        commentId: comment._id,
                    }),
                },
            });
        }
        return comment.toJSON();
    }
    async getComments({ postId }, user) {
        const post = await this.postRepository.findOne({
            filter: { _id: postId, $or: (0, post_1.getAvailability)(user) },
        });
        if (!post) {
            throw new common_1.NotFoundException("Fail to find matching post");
        }
        const comments = await this.commentRepository.find({
            filter: { postId: postId },
        });
        return comments.map((comment) => comment.toJSON());
    }
    async deleteComment({ postId, commentId }, user) {
        const comment = await this.commentRepository.findOne({
            filter: { _id: commentId, postId: postId, createdBy: user._id },
        });
        if (!comment) {
            throw new common_1.NotFoundException("Fail to find matching comment");
        }
        const deletedComment = await this.commentRepository.hardDelete({
            filter: { _id: commentId },
        });
        if (!deletedComment) {
            throw new common_1.BadRequestException("Fail to delete comment");
        }
        if (comment.attachments?.length) {
            await this.s3.deleteAssets({
                Keys: comment.attachments.map((ele) => {
                    return { Key: ele };
                }),
            });
        }
        return deletedComment;
    }
}
exports.CommentService = CommentService;
exports.commentService = new CommentService();
