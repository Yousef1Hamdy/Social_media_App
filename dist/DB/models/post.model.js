"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("../../common");
const mongoose_2 = require("mongoose");
const mongoose_3 = require("mongoose");
const postSchema = new mongoose_2.Schema({
    folderId: { type: String, required: true },
    content: {
        type: String,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: { type: [String] },
    availability: {
        type: Number,
        enum: common_1.AvailabilityEnum,
        default: common_1.AvailabilityEnum.PUBLIC,
    },
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
    collection: "SOCIAL_APP_POST",
});
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
    }
    else {
        this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: false },
        });
    }
});
postSchema.pre(["updateOne", "findOneAndUpdate"], function () {
    const update = this.getUpdate();
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
    }
    else {
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
    }
    else {
        this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: true },
        });
    }
});
exports.PostModel = mongoose_1.models.Post || (0, mongoose_3.model)("Post", postSchema);
