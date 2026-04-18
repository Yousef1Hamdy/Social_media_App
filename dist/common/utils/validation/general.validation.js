"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalValidationFields = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../enums");
exports.generalValidationFields = {
    email: zod_1.z.email({ error: "Invalid email address" }),
    password: zod_1.z
        .string({ error: "Password is required" })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/, {
        message: "Password must contain at least one uppercase, one lowercase, one number, and one special character",
    }),
    username: zod_1.z
        .string({ error: "Username is required" })
        .min(2, { error: "min is 2" })
        .max(20),
    confirmPassword: zod_1.z.string({
        error: "Confirm Password is required",
    }),
    gender: zod_1.z
        .number({
        error: "Gender is required",
    })
        .refine((val) => Object.values(enums_1.GenderEnum)
        .filter((v) => typeof v === "number")
        .includes(val), {
        message: "Invalid gender",
    }),
    phone: zod_1.z.string().regex(new RegExp(/^(20|2|\+2)?01[0-25]\d{8}$/)),
    otp: zod_1.z.string().regex(new RegExp(/^\d{6}$/)),
};
