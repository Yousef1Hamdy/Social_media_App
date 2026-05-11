import { z } from "zod";
import { generalValidationFields } from "../../common";

export const resendConfirmEmail = {
  body: z
    .object({
      email: generalValidationFields.email,
    })
    .strict(),
};

export const confirmEmail = {
  body: resendConfirmEmail.body.safeExtend({
    otp: generalValidationFields.otp,
  }),
};

export const loginSchema = {
  body: resendConfirmEmail.body
    .safeExtend({
      password: generalValidationFields.password,
      FCM: z.string().optional(),
    })
    .strict(),
};

export const signupSchema = {
  body: loginSchema.body
    .safeExtend({
      username: generalValidationFields.username,
      confirmPassword: generalValidationFields.confirmPassword,
      gender: generalValidationFields.gender,
      phone: generalValidationFields.phone.optional(),
    })
    .strict()
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
};
