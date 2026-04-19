import { HydratedDocument } from "mongoose";
import { IUser } from "../../common";

export class UserService {
  constructor() {}

  async profile(user: HydratedDocument<IUser>) {
    return user.toJSON();
  }
}

export default new UserService();
