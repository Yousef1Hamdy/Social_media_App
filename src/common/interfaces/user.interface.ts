import { Types } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../enums";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  bio?: string;
  friends?:Types.ObjectId[] | IUser[];
  phone?: string;
  profileImage?: string;
  coverImage?: string[];
  DOB?: Date;
  changeCredentialTime?: Date;
  confirmEmail?: Date;
  confirmedAt?: string;
  gender: GenderEnum;
  role: RoleEnum;
  username?: string;
  provider: ProviderEnum;

  deletedAt?: Date;
  restoredAt?: Date;
}
