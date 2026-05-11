import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { AvailabilityEnum } from "../enums";
import { IReaction } from "./comment.interface";

export interface IPost {
  folderId: string;
  content?: string;
  attachments?: string[];
  reactions?: IReaction[];
  tags?: Types.ObjectId[] | IUser[];
  availability: AvailabilityEnum;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  createdAt: Date;
  deletedAt?: Date;
  restoredAt?: Date;
  updatedAt?: Date;
}
