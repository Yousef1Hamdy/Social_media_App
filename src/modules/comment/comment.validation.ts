import { z } from "zod";
// import { Types } from "mongoose";
import { AvailabilityEnum, generalValidationFields } from "../../common";

export const createComment = {
  params: z.strictObject({
    postId: generalValidationFields.id,
  }),
  body: z
    .strictObject({
      content: z.string().optional(),
      files: z.array(z.any()).optional(),
      tags: z.array(generalValidationFields.id).optional(),
      availability: z.coerce.number().default(AvailabilityEnum.PUBLIC),
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

        // for (const tag of args.tags) {
        //   if (!Types.ObjectId.isValid(tag)) {
        //     ctx.addIssue({
        //       code: "custom",
        //       path: ["tags"],
        //       message: `Invalid tagged objectId ${tag}`,
        //     });
        //   }
        // }
      }
    }),
};
export const getComments = {
  params: z.strictObject({
    postId: generalValidationFields.id,
  }),
};

export const createReplayComment = {
  params: z.strictObject({
    postId: generalValidationFields.id,
    commentId: generalValidationFields.id,
  }),
  body: createComment.body,
};

export const deleteComments = {
  params: createReplayComment.params,
};
