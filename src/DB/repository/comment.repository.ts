import { Model } from "mongoose";
import { BaseRepository } from "./base.repository";
import { IComment } from "../../common/interfaces";

export class CommentRepository extends BaseRepository<IComment> {
  constructor(protected override model: Model<IComment>) {
    super(model);
  }
}
