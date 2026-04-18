import { z } from "zod";
import { GenderEnum } from "../../enums";

export const generalValidationFields = {
  email: z.email({ error: "Invalid email address" }),

  password: z
    .string({ error: "Password is required" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/, {
      message:
        "Password must contain at least one uppercase, one lowercase, one number, and one special character",
    }),

  username: z
    .string({ error: "Username is required" })
    .min(2, { error: "min is 2" })
    .max(20),

  confirmPassword: z.string({
    error: "Confirm Password is required",
  }),

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

  phone: z.string().regex(new RegExp(/^(20|2|\+2)?01[0-25]\d{8}$/)),
  otp: z.string().regex(new RegExp(/^\d{6}$/)),
};
