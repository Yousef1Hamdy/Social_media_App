import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { IPost } from "./post.interface";

export interface IReaction {
  userId: Types.ObjectId | IUser;
  emoji: string;
}

export interface IComment {
  content?: string;
  attachments?: string[];
  
  tags?: Types.ObjectId[] | IUser[];
  commentId?: Types.ObjectId | IComment;
  postId: Types.ObjectId | IPost;
  reactions?: IReaction;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  createdAt: Date;
  deletedAt?: Date;
  restoredAt?: Date;
  updatedAt?: Date;
}
