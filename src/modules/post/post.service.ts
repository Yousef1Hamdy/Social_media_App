import { HydratedDocument, Types } from "mongoose";
import { IPost, IUser } from "../../common/interfaces";
import {
  CreatePostBodyDto,
  UpdatePostBodyDto,
  UpdatePostParamsDto,
} from "./post.dto";
import {
  BadRequestException,
  NotFoundException,
  notificationService,
  NotificationService,
  redisService,
  RedisService,
  s3Service,
  S3Service,
} from "../../common";
import {
  CommentModel,
  CommentRepository,
  PostRepository,
  UserModel,
  UserRepository,
} from "../../DB";
import { randomUUID } from "node:crypto";
import { createObjectId } from "../../common/utils/mongoose";
import { getAvailability } from "../../common/utils/post";
import { IPaginate, PaginationDto } from "../../common/types/paginate.types";
import { PostModel } from "../../DB/models/post.model";

export class PostService {
  private readonly redis: RedisService;
  private readonly notification: NotificationService;
  private readonly postRepository: PostRepository;
  private readonly userRepository: UserRepository;
  private readonly commentRepository: CommentRepository;
  private readonly s3: S3Service;

  constructor() {
    this.redis = redisService;
    this.notification = notificationService;
    this.s3 = s3Service;
    this.userRepository = new UserRepository(UserModel);
    this.commentRepository = new CommentRepository(CommentModel);
    this.postRepository = new PostRepository(PostModel);
  }

  async listPost(
    { size, page, search }: PaginationDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPaginate<IPost>> {
    const posts = this.postRepository.paginate({
      filter: {
        $or: getAvailability(user),
      },
      page,
      size,
      options: {
        populate: [{ path: "comments", populate: [{ path: "replay" }] }],
      },
    });
    return posts;
  }

  async createPost(
    { availability, content, files, tags }: CreatePostBodyDto,
    user: HydratedDocument<IUser>,
  ) {
    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];
    if (tags?.length) {
      const mentionedAccount = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (mentionedAccount.length != tags.length) {
        throw new NotFoundException(
          "Fail to find some or all mentioned accounts ",
        );
      }

      for (const tag of tags) {
        mentions.push(Types.ObjectId.createFromHexString(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) =>
          FCM_Tokens.push(token),
        );
      }
    }

    const folderId = randomUUID();
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await this.s3.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Post/${folderId}`,
      });
    }
    const post = await this.postRepository.createOne({
      data: {
        createdBy: user._id,
        content: content as string,
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
      throw new BadRequestException("Fail");
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

  async updatePost(
    { postId }: UpdatePostParamsDto,
    {
      availability,
      content,
      files = [],
      tags = [],
      removeFiles = [],
      removeTags = [],
    }: UpdatePostBodyDto,
    user: HydratedDocument<IUser>,
  ) {
    const post = await this.postRepository.findOne({
      filter: { _id: postId, createdBy: user._id },
    });

    if (!post) {
      throw new NotFoundException("Fail to find matching post");
    }

    if (
      !content &&
      !post.content &&
      !files?.length &&
      removeFiles.length == post?.attachments?.length
    ) {
      throw new BadRequestException("we cannot leave empty post");
    }

    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];
    if (tags?.length) {
      const mentionedAccount = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (mentionedAccount.length != tags.length) {
        throw new NotFoundException(
          "Fail to find some or all mentioned accounts ",
        );
      }

      for (const tag of tags) {
        mentions.push(Types.ObjectId.createFromHexString(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) =>
          FCM_Tokens.push(token),
        );
      }
    }

    const folderId = post.folderId;
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await this.s3.uploadAssets({
        files: files as Express.Multer.File[],
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
                    removeTags.map((ele) => createObjectId(ele)),
                  ],
                },
                tags.map((ele) => createObjectId(ele)),
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
      throw new BadRequestException("Fail");
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

  async reactOnPost(
    { postId }: UpdatePostParamsDto,
    { emoji }: { emoji: string },
    user: HydratedDocument<IUser>,
  ): Promise<IPost> {
    const FCM_Tokens: string[] = [];

    const post = await this.postRepository.findOne({
      filter: { _id: postId, $or: getAvailability(user) },
    });

    if (!post) {
      throw new NotFoundException("Fail to find matching post");
    }

    const oldReaction = post.reactions?.find(
      (r: any) => r.userId.toString() === user._id.toString(),
    );

    let updatedPost;

    /* ===============================
      CASE 1 → SAME REACTION (REMOVE)
  =============================== */

    if (oldReaction && oldReaction.emoji === emoji) {
      updatedPost = await this.postRepository.findOneAndUpdate({
        filter: { _id: postId },
        update: {
          $pull: { reactions: { userId: user._id } },
        },
      });

      return updatedPost!.toJSON();
    }

    /* ===============================
      CASE 2 → CHANGE REACTION
  =============================== */

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

      return updatedPost!.toJSON();
    }

    /* ===============================
      CASE 3 → ADD NEW REACTION
  =============================== */

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
    return updatedPost!.toJSON();
  }

  async deletePost(
    { postId }: UpdatePostParamsDto,
    user: HydratedDocument<IUser>,
    force = false,
  ) {
    const post = await this.postRepository.findOne({
      filter: { _id: postId, $or: getAvailability(user) },
    });

    if (!post) {
      throw new NotFoundException("Fail to find matching post");
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

  async restorePost(
    { postId }: UpdatePostParamsDto,
    user: HydratedDocument<IUser>,
  ) {
    const post = await this.postRepository.findOne({
      filter: {
        _id: postId,
        paranoid: false,
        deletedAt: { $exists: true },
        $or: getAvailability(user),
      },
    });

    if (!post) {
      throw new NotFoundException("Post not found or already active");
    }

    const restoredPost = await this.postRepository.findOneAndUpdate({
      filter: { _id: postId , paranoid: false , deletedAt: { $exists: true } },
      update: {
        restoredAt: new Date(),
      },
      options: { new: true },
    });

    await this.commentRepository.updateMany({
      filter: { postId , paranoid: false , deletedAt: { $exists: true } },
      update: {
        restoredAt: new Date(),
      },
    });

    return restoredPost;
  }
}

export const postService = new PostService();
