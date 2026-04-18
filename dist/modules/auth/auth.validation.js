"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupSchema = exports.loginSchema = exports.confirmEmail = exports.resendConfirmEmail = void 0;
const zod_1 = require("zod");
const common_1 = require("../../common");
exports.resendConfirmEmail = {
    body: zod_1.z
        .object({
        email: common_1.generalValidationFields.email,
    })
        .strict(),
};
exports.confirmEmail = {
    body: exports.resendConfirmEmail.body.safeExtend({
        otp: common_1.generalValidationFields.otp,
    }),
};
exports.loginSchema = {
    body: exports.resendConfirmEmail.body
        .safeExtend({
        password: common_1.generalValidationFields.password,
    })
        .strict(),
};
exports.signupSchema = {
    body: exports.loginSchema.body
        .safeExtend({
        username: common_1.generalValidationFields.username,
        confirmPassword: common_1.generalValidationFields.confirmPassword,
        gender: common_1.generalValidationFields.gender,
        phone: common_1.generalValidationFields.phone.optional(),
    })
        .strict()
        .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    }),
};
