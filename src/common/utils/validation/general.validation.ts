import { z } from "zod";
import { GenderEnum, ReactionEnum } from "../../enums";
import { Types } from "mongoose";

export const generalValidationFields = {
  id: z.string().refine((value) => {
    return Types.ObjectId.isValid(value);
  }, "Invalid objectId"),
  email: z.email(),
  otp: z.string({ error: "otp is required" }).regex(/^\d{6}$/),
  phone: z
    .string({ error: "Phone is required" })
    .regex(/^(00201|\+201|01)(0|1|2|5)\d{8}$/),
  password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/),
  username: z
    .string({ error: "username is mandatory" })
    .min(2, { error: "min is 2 char" })
    .max(25, { error: "max is 25 char" }),
  confirmPassword: z.string(),
  gender: z
    .number({
      error: "Gender is required",
    })
    .refine(
      (val) =>
        Object.values(GenderEnum)
          .filter((v) => typeof v === "number")
          .includes(val),
      {
        message: "Invalid gender",
      },
    ),
  emoji: z.enum(ReactionEnum, {
    message: "Invalid emoji",
  }),
  file: function (mimetype: string[]) {
    return z
      .strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.enum(mimetype),
        buffer: z.any().optional(),
        path: z.string().optional(),
        size: z.number(),
      })
      .superRefine((args, ctx) => {
        if (!args.path && !args.buffer) {
          ctx.addIssue({
            code: "custom",
            message: "buffer is required",
            path: ["buffer"],
          });
        }
      });
  },
};

export const paginationValidationSchema = {
  query: z.strictObject({
    page: z.coerce.number().optional(),
    size: z.coerce.number().optional(),
    search: z.string().optional(),
  }),
};
