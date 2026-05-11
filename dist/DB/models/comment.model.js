"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("mongoose");
const mongoose_3 = require("mongoose");
const commentSchema = new mongoose_2.Schema({
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: { type: [String] },
    commentId: { type: mongoose_1.Types.ObjectId, ref: "Comment" },
    postId: { type: mongoose_1.Types.ObjectId, ref: "Post", required: true },
    reactions: [
        {
            userId: { type: mongoose_1.Types.ObjectId, ref: "User" },
            emoji: String,
        },
    ],
    tags: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    updatedBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_COMMENT",
});
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
    }
    else {
        this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: false },
        });
    }
});
commentSchema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function () {
    const update = this.getUpdate();
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
    }
    else {
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
    }
    else {
        this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: true },
        });
    }
});
exports.CommentModel = mongoose_1.models.Comment || (0, mongoose_3.model)("Comment", commentSchema);
