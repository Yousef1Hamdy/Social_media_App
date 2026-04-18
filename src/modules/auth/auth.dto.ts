import z from "zod";
import { confirmEmail, loginSchema, resendConfirmEmail, signupSchema } from "./auth.validation";

export type LoginDto = z.infer<typeof loginSchema.body>;
export type SignupDto = z.infer<typeof signupSchema.body>;
export type ConfirmEmailDto = z.infer<typeof confirmEmail.body>;
export type ResendConfirmEmailDto = z.infer<typeof resendConfirmEmail.body>;
