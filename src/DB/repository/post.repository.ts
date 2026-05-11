import { Model } from "mongoose";
import { BaseRepository } from "./base.repository";
import { IPost } from "../../common/interfaces";

export class PostRepository extends BaseRepository<IPost> {
  constructor(protected override model: Model<IPost>) {
    super(model);
  }
}

