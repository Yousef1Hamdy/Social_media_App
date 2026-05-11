import { HydratedDocument, models, Types } from "mongoose";
import { IComment } from "../../common";
import { Schema } from "mongoose";
import { model } from "mongoose";

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: function (this) {
        return !this.attachments?.length;
      },
    },
    attachments: { type: [String] },

    commentId: { type: Types.ObjectId, ref: "Comment" },
    postId: { type: Types.ObjectId, ref: "Post", required: true },
    reactions: [
      {
        userId: { type: Types.ObjectId, ref: "User" },
        emoji: String,
      },
    ],

    tags: [{ type: Types.ObjectId, ref: "User" }],
    updatedBy: { type: Types.ObjectId, ref: "User" },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_COMMENT",
  },
);

commentSchema.virtual("replay", {
  localField: "_id",
  foreignField: "commentId",
  ref: "Comment",
  justOne: true,
});

commentSchema.pre(["find", "findOne", "countDocuments"], function () {
  if (this.getQuery().paranoid == false) {
    this.setQuery({
      ...this.getQuery(),
    });
  } else {
    this.setQuery({
      ...this.getQuery(),
      deletedAt: { $exists: false },
    });
  }
});

commentSchema.pre(["updateOne", "findOneAndUpdate" , "updateMany"], function () {
  const update = this.getUpdate() as HydratedDocument<IComment>;

  if (update?.deletedAt) {
    this.getQuery().paranoid = true;
    this.setUpdate({
      ...this.getUpdate(),
      $unset: { restoredAt: 1 },
    });
  }

  if (update.restoredAt) {
    this.setQuery({
      ...this.getQuery(),
      paranoid: false,
      deletedAt: { $exists: true },
    });
    this.setUpdate({
      ...this.getUpdate(),
      $unset: { deletedAt: 1 },
    });
  }

  if (this.getQuery().paranoid == false) {
    this.setQuery({
      ...this.getQuery(),
    });
  } else {
    this.setQuery({
      ...this.getQuery(),
      deletedAt: { $exists: false },
    });
  }

  console.log(this.getQuery());
});


commentSchema.pre(["deleteOne", "findOneAndDelete"], function () {
  if (this.getQuery().force == true) {
    this.setQuery({
      ...this.getQuery(),
    });
  } else {
    this.setQuery({
      ...this.getQuery(),
      deletedAt: { $exists: true },
    });
  }
});

export const CommentModel = models.Comment || model<IComment>("Comment", commentSchema);
