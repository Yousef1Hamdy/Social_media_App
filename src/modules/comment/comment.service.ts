import { CommentRepository } from "./../../DB/repository/comment.repository";
import { HydratedDocument, Types } from "mongoose";
import { IPost, IUser } from "../../common/interfaces";
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
  PostModel,
  PostRepository,
  UserModel,
  UserRepository,
} from "../../DB";
import {
  createCommentBodyDto,
  createCommentParamsDto,
  createReplayCommentBodyDto,
  createReplayCommentParamsDto,
} from "./comment.dto";
import { getAvailability } from "../../common/utils/post";
export class CommentService {
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
    this.postRepository = new PostRepository(PostModel);
    this.commentRepository = new CommentRepository(CommentModel);
  }

  async createComment(
    { postId }: createCommentParamsDto,
    { content, files = [], tags }: createCommentBodyDto,
    user: HydratedDocument<IUser>,
  ) {
    const post = await this.postRepository.findOne({
      filter: { _id: postId, $or: getAvailability(user) },
    });

    if (!post) {
      throw new NotFoundException("Fail to find matching post");
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

    const folderId = post._id;
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await this.s3.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Post/${folderId}`,
      });
    }
    const comment = await this.commentRepository.createOne({
      data: {
        createdBy: user._id,
        content: content as string,
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
            commentId: comment._id,
          }),
        },
      });
    }

    return comment.toJSON();
  }
  async createReplayComment(
    { postId, commentId }: createReplayCommentParamsDto,
    { content, files = [], tags }: createReplayCommentBodyDto,
    user: HydratedDocument<IUser>,
  ) {
    const comment = await this.commentRepository.findOne({
      filter: { _id: commentId, postId: postId },
      options: {
        populate: [
          {
            path: "postId",
            match: {
              $or: getAvailability(user),
            },
          },
        ],
      },
    });

    if (!comment?.postId) {
      throw new NotFoundException("Fail to find matching post");
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
    const post = comment.postId as HydratedDocument<IPost>;
    const folderId = post.folderId;
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await this.s3.uploadAssets({
        files: files as Express.Multer.File[],
        path: `Post/${folderId}`,
      });
    }
    const reply = await this.commentRepository.createOne({
      data: {
        createdBy: user._id,
        content: content as string,
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
            commentId: comment._id,
          }),
        },
      });
    }

    return comment.toJSON();
  }

  async getComments(
    { postId }: createCommentParamsDto,
    user: HydratedDocument<IUser>,
  ) {
    const post = await this.postRepository.findOne({
      filter: { _id: postId, $or: getAvailability(user) },
    });

    if (!post) {
      throw new NotFoundException("Fail to find matching post");
    }
    const comments = await this.commentRepository.find({
      filter: { postId: postId },
    });
    return comments.map((comment: any) => comment.toJSON());
  }
  async deleteComment(
    { postId, commentId }: createReplayCommentParamsDto,
    user: HydratedDocument<IUser>,
  ) {
    const comment = await this.commentRepository.findOne({
      filter: { _id: commentId, postId: postId, createdBy: user._id },
    });

    if (!comment) {
      throw new NotFoundException("Fail to find matching comment");
    }
    const deletedComment = await this.commentRepository.hardDelete({
      filter: { _id: commentId },
    });
    if (!deletedComment) {
      throw new BadRequestException("Fail to delete comment");
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

export const commentService = new CommentService();
