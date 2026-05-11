"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComments = exports.createReplayComment = exports.getComments = exports.createComment = void 0;
const zod_1 = require("zod");
const common_1 = require("../../common");
exports.createComment = {
    params: zod_1.z.strictObject({
        postId: common_1.generalValidationFields.id,
    }),
    body: zod_1.z
        .strictObject({
        content: zod_1.z.string().optional(),
        files: zod_1.z.array(zod_1.z.any()).optional(),
        tags: zod_1.z.array(common_1.generalValidationFields.id).optional(),
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
        }
    }),
};
exports.getComments = {
    params: zod_1.z.strictObject({
        postId: common_1.generalValidationFields.id,
    }),
};
exports.createReplayComment = {
    params: zod_1.z.strictObject({
        postId: common_1.generalValidationFields.id,
        commentId: common_1.generalValidationFields.id,
    }),
    body: exports.createComment.body,
};
exports.deleteComments = {
    params: exports.createReplayComment.params,
};
