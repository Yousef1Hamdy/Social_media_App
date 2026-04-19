import { HydratedDocument } from "mongoose";
import { IUser } from "../interfaces";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user: HydratedDocument<IUser>;
      decode: JwtPayload;
    }
  }
}

export {};
