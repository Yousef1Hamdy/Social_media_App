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
    changeCredentialTime: Date,
    deletedAt: {
        type: Date,
    },
    restoredAt: {
        type: Date,
    },
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
userSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await (0, common_1.generateHash)({ plaintext: this.password });
    }
    if (this.phone && this.isModified("phone")) {
        this.phone = await (0, common_1.encrypt)(this.phone);
    }
});
userSchema.pre("findOne", function () {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: false }, ...query });
    }
});
userSchema.pre(["updateOne", "findOneAndUpdate"], function () {
    const update = this.getUpdate();
    if (update.deletedAt) {
        this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
    }
    if (update.restoredAt) {
        this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
        this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
    }
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: false }, ...query });
    }
});
userSchema.pre(["deleteOne", "findOneAndDelete"], function () {
    const query = this.getQuery();
    if (query.force === true) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ deletedAt: { $exists: true }, ...query });
    }
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)("User", userSchema);
