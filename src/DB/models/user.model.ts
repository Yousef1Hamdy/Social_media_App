import { Schema, model, models } from "mongoose";
import { GenderEnum, IUser, ProviderEnum, RoleEnum } from "../../common";

const userSchema: Schema<IUser> = new Schema(
  {
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
      enum: Object.values(GenderEnum).filter((v) => typeof v === "number"),
      required: true,
    },

    role: {
      type: Number,
      enum: Object.values(RoleEnum).filter((v) => typeof v === "number"),
      default: RoleEnum.USER,
    },
    provider: {
      type: Number,
      enum: Object.values(ProviderEnum).filter((v) => typeof v === "number"),
      default: ProviderEnum.System,
    },
    confirmEmail: Date,
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    collection: "User",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

userSchema
  .virtual("username")
  .get(function (this: IUser) {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (this: IUser, value: string) {
    const [firstName, lastName] = value.split(" ");
    this.firstName = firstName as string;
    this.lastName = lastName as string;
  });

export const UserModel = models.User || model<IUser>("User", userSchema);
