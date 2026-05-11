"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryModel = void 0;
const mongoose_1 = require("mongoose");
const storySchema = new mongoose_1.Schema({
    media: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_STORY",
});
exports.StoryModel = mongoose_1.models.Story || (0, mongoose_1.model)("Story", storySchema);
