"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("../../common");
const userSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    bio: {
        type: String,
        default: "",
    },
    phone: {
        type: String,
    },
    profileImage: {
        type: String,
    },
    coverImage: [
        {
            type: String,
        },
    ],
    DOB: {
        type: Date,
    },
    confirmedAt: {
        type: String,
    },
    gender: {
        type: Number,
        enum: Object.values(common_1.GenderEnum).filter((v) => typeof v === "number"),
        required: true,
    },
    role: {
        type: Number,
        enum: Object.values(common_1.RoleEnum).filter((v) => typeof v === "number"),
        default: common_1.RoleEnum.USER,
    },
    provider: {
        type: Number,
        enum: Object.values(common_1.ProviderEnum).filter((v) => typeof v === "number"),
        default: common_1.ProviderEnum.System,
    },
    confirmEmail: Date,
}, {
    timestamps: true,
    strict: true,
    strictQuery: true,
    collection: "User",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
});
userSchema
    .virtual("username")
    .get(function () {
    return `${this.firstName} ${this.lastName}`;
})
    .set(function (value) {
    const [firstName, lastName] = value.split(" ");
    this.firstName = firstName;
    this.lastName = lastName;
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
