import { HydratedDocument, models, Types } from "mongoose";
import { AvailabilityEnum, IPost } from "../../common";
import { Schema } from "mongoose";
import { model } from "mongoose";

const postSchema = new Schema<IPost>(
  {
    folderId: { type: String, required: true },
    content: {
      type: String,
      required: function (this) {
        return !this.attachments?.length;
      },
    },
    attachments: { type: [String] },

    availability: {
      type: Number,
      enum: AvailabilityEnum,
      default: AvailabilityEnum.PUBLIC,
    },
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
    collection: "SOCIAL_APP_POST",
  },
);

postSchema.virtual("comments", {
  localField: "_id",
  foreignField: "postId",
  ref: "Comment",
  justOne: true,
});

postSchema.pre(["find", "findOne", "countDocuments"], function () {
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

postSchema.pre(["updateOne", "findOneAndUpdate"], function () {
  const update = this.getUpdate() as HydratedDocument<IPost>;

  if (update.deletedAt) {
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

postSchema.pre(["deleteOne", "findOneAndDelete"], function () {
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

export const PostModel = models.Post || model<IPost>("Post", postSchema);
