"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restorePost = exports.deletePost = exports.reactOnPost = exports.updatePost = exports.createPost = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
const common_1 = require("../../common");
exports.createPost = {
    body: zod_1.z
        .strictObject({
        content: zod_1.z.string().optional(),
        files: zod_1.z.array(zod_1.z.any()).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        availability: zod_1.z.coerce.number().default(common_1.AvailabilityEnum.PUBLIC),
    })
        .superRefine((args, ctx) => {
        if (!args.files?.length && !args.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "Content is required",
            });
        }
        if (args.tags?.length) {
            const uniqueTags = [...new Set(args.tags)];
            if (uniqueTags.length != args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicated tag",
                });
            }
            for (const tag of args.tags) {
                if (!mongoose_1.Types.ObjectId.isValid(tag)) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["tags"],
                        message: `Invalid tagged objectId ${tag}`,
                    });
                }
            }
        }
    }),
};
exports.updatePost = {
    params: zod_1.z.strictObject({
        postId: common_1.generalValidationFields.id,
    }),
    body: zod_1.z
        .strictObject({
        content: zod_1.z.string().optional(),
        files: zod_1.z.array(zod_1.z.any()).optional(),
        removeFiles: zod_1.z.array(zod_1.z.string()).optional(),
        removeTags: zod_1.z.array(common_1.generalValidationFields.id).optional(),
        tags: zod_1.z.array(common_1.generalValidationFields.id).optional(),
        availability: zod_1.z.coerce.number().optional(),
    })
        .superRefine((args, ctx) => {
        if (!Object.values(args).length) {
            ctx.addIssue({
                code: "custom",
                message: "Cannot accept all fields to be empty ",
            });
        }
        if (args.tags?.length) {
            const uniqueTags = [...new Set(args.tags)];
            if (uniqueTags.length != args.tags.length) {
                ctx.addIssue({
                    code: "custom",
                    path: ["tags"],
                    message: "Duplicated tag",
                });
            }
            for (const tag of args.tags) {
                if (!mongoose_1.Types.ObjectId.isValid(tag)) {
                    ctx.addIssue({
                        code: "custom",
                        path: ["tags"],
                        message: `Invalid tagged objectId ${tag}`,
                    });
                }
            }
        }
    }),
};
exports.reactOnPost = {
    params: zod_1.z.strictObject({
        postId: common_1.generalValidationFields.id,
    }),
    query: zod_1.z.strictObject({
        emoji: common_1.generalValidationFields.emoji,
    }),
};
exports.deletePost = {
    params: zod_1.z.strictObject({
        postId: common_1.generalValidationFields.id,
    }),
    body: zod_1.z.strictObject({
        force: zod_1.z.boolean().optional(),
    }),
};
exports.restorePost = {
    params: zod_1.z.strictObject({
        postId: common_1.generalValidationFields.id,
    }),
};
