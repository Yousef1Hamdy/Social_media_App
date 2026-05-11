import { z } from "zod";
import { Types } from "mongoose";
import { AvailabilityEnum, generalValidationFields } from "../../common";

export const createPost = {
  body: z
    .strictObject({
      content: z.string().optional(),
      files: z.array(z.any()).optional(),
      tags: z.array(z.string()).optional(),
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

        for (const tag of args.tags) {
          if (!Types.ObjectId.isValid(tag)) {
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

export const updatePost = {
  params: z.strictObject({
    postId: generalValidationFields.id,
  }),
  body: z
    .strictObject({
      content: z.string().optional(),
      files: z.array(z.any()).optional(),
      removeFiles: z.array(z.string()).optional(),
      removeTags: z.array(generalValidationFields.id).optional(),
      tags: z.array(generalValidationFields.id).optional(),
      availability: z.coerce.number().optional(),
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
          if (!Types.ObjectId.isValid(tag)) {
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
export const reactOnPost = {
  params: z.strictObject({
    postId: generalValidationFields.id,
  }),
  query: z.strictObject({
    emoji: generalValidationFields.emoji,
  }),
};

export const deletePost = {
  params: z.strictObject({
    postId: generalValidationFields.id,
  }),
  body: z.strictObject({
    force: z.boolean().optional(),
  }),
};

export const restorePost = {
  params: z.strictObject({
    postId: generalValidationFields.id,
  }),
}