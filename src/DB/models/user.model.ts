import { HydratedDocument, Schema, model, models } from "mongoose";
import {
  encrypt,
  GenderEnum,
  generateHash,
  IUser,
  ProviderEnum,
  RoleEnum,
} from "../../common";
import { Types } from "mongoose";

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
    friends :[{type : Types.ObjectId , ref : "User"}],

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
    changeCredentialTime: Date,
    deletedAt: {
      type: Date,
    },
    restoredAt: {
      type: Date,
    },
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

userSchema.pre(
  "save",
  async function (this: HydratedDocument<IUser> & { wasNew: boolean }) {
    if (this.isModified("password")) {
      this.password = await generateHash({ plaintext: this.password });
    }
    if (this.phone && this.isModified("phone")) {
      this.phone = await encrypt(this.phone);
    }
  },
);

// userSchema.post("save", async function () {
//   const that = this as HydratedDocument<IUser> & { wasNew: boolean };
//   if (that.wasNew) {
//   }
// });

userSchema.pre("findOne" , function(){
  const query = this.getQuery()
  if(query.paranoid === false){
    this.setQuery({...query})
  }else{
    this.setQuery({deletedAt : { $exists : false} , ...query})
  }
})

userSchema.pre(["updateOne" , "findOneAndUpdate"] , function(){
  const update = this.getUpdate() as HydratedDocument<IUser>;
  if(update.deletedAt){
    this.setUpdate({...update , $unset :{restoredAt : 1}})
  }
  if(update.restoredAt){
    this.setUpdate({...update , $unset :{deletedAt : 1}})
    this.setQuery({...this.getQuery() , deletedAt : {$exists : true}})
  }
  const query = this.getQuery()
  if(query.paranoid === false){
    this.setQuery({...query})
  }else{
    this.setQuery({deletedAt : { $exists : false} , ...query})
  }
})

userSchema.pre(["deleteOne" , "findOneAndDelete"] , function(){

  const query = this.getQuery()
  if(query.force === true){
    this.setQuery({...query})
  }else{
    this.setQuery({deletedAt : { $exists : true} , ...query})
  }
})

export const UserModel = models.User || model<IUser>("User", userSchema);
