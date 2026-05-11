"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationValidationSchema = exports.generalValidationFields = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../enums");
const mongoose_1 = require("mongoose");
exports.generalValidationFields = {
    id: zod_1.z.string().refine((value) => {
        return mongoose_1.Types.ObjectId.isValid(value);
    }, "Invalid objectId"),
    email: zod_1.z.email(),
    otp: zod_1.z.string({ error: "otp is required" }).regex(/^\d{6}$/),
    phone: zod_1.z
        .string({ error: "Phone is required" })
        .regex(/^(00201|\+201|01)(0|1|2|5)\d{8}$/),
    password: zod_1.z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/),
    username: zod_1.z
        .string({ error: "username is mandatory" })
        .min(2, { error: "min is 2 char" })
        .max(25, { error: "max is 25 char" }),
    confirmPassword: zod_1.z.string(),
    gender: zod_1.z
        .number({
        error: "Gender is required",
    })
        .refine((val) => Object.values(enums_1.GenderEnum)
        .filter((v) => typeof v === "number")
        .includes(val), {
        message: "Invalid gender",
    }),
    emoji: zod_1.z.enum(enums_1.ReactionEnum, {
        message: "Invalid emoji",
    }),
    file: function (mimetype) {
        return zod_1.z
            .strictObject({
            fieldname: zod_1.z.string(),
            originalname: zod_1.z.string(),
            encoding: zod_1.z.string(),
            mimetype: zod_1.z.enum(mimetype),
            buffer: zod_1.z.any().optional(),
            path: zod_1.z.string().optional(),
            size: zod_1.z.number(),
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
exports.paginationValidationSchema = {
    query: zod_1.z.strictObject({
        page: zod_1.z.coerce.number().optional(),
        size: zod_1.z.coerce.number().optional(),
        search: zod_1.z.string().optional(),
    }),
};
