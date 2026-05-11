import { Schema, model, models, Types } from "mongoose";

const storySchema = new Schema(
  {
    media: {
      type: String,
      required: true,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_STORY",
  },
);

export const StoryModel = models.Story || model("Story", storySchema);
