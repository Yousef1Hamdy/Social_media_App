import { UserRepository } from './../../DB/repository/user.repository';
import { HydratedDocument } from "mongoose";
import {
  ConflictException,
  IUser,
  LogoutEnum,
  redisService,
  RedisService,
  S3Service,
  TokenService,
  s3Service,
  StorageApproachEnum,
  NotFoundException,
} from "../../common";
import { ACCESS_EXPIRE_IN, REFRESH_EXPIRE_IN } from "../../config/config";
import { LoginResponse } from "../auth/auth.entity";
import { UserModel } from '../../DB/models/user.model';

export class UserService {
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  private readonly userRepository: UserRepository;
  private readonly s3: S3Service;
  constructor() {
    this.redis = redisService;
    this.tokenService = new TokenService();
    this.userRepository = new UserRepository(UserModel);
    this.s3 = s3Service;
  }

  // async profileImage(file: Express.Multer.File, user: HydratedDocument<IUser>) {
  //   const { Key } = await this.s3.uploadLargeAsset({
  //     file,
  //     path: `Users/${user._id.toString()}/profile`,
  //     storageApproach: StorageApproachEnum.DISK,
  //   });
  //   user.profileImage = Key as string;
  //   await user.save();

  //   return user.toJSON();
  // }

  async profileImage(
    {
      ContentType,
      Originalname,
    }: { ContentType: string; Originalname: string },
    user: HydratedDocument<IUser>,
  ) {
    // const oldPic = user.profileImage;
    const { url } = await this.s3.createPreSignedUploadLink({
      path: `Users/${user._id.toString()}/profile`,
      ContentType,
      Originalname,
    });
    // user.profileImage = key as string;
    // await user.save();
    // if (oldPic) {
    //   await s3Service.deleteAsset({ Key: oldPic });
    // }
    return { user, url };
  }

  async profileCoverImages(
    files: Express.Multer.File[],
    user: HydratedDocument<IUser>,
  ) {
    const oldUrls = user.coverImage;
    const urls = await this.s3.uploadAssets({
      files,
      path: `Users/${user._id.toString()}/profile/cover`,
      storageApproach: StorageApproachEnum.DISK,
    });
    user.coverImage = urls;
    await user.save();
    if (oldUrls?.length) {
      await s3Service.deleteAssets({
        Keys: oldUrls.map((Key) => {
          return { Key };
        }),
      });
    }
    return user.toJSON();
  }

  async profile(user: HydratedDocument<IUser>) {
    return user.toJSON();
  }

  logout = async (
    { flag }: { flag: LogoutEnum },
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string },
  ): Promise<number> => {
    let status = 200;
    switch (flag) {
      case LogoutEnum.All:
        user.changeCredentialTime = new Date();
        await user.save();
        await this.redis.deleteKey(
          await this.redis.keys(this.redis.baseRevokeTokenKey(sub)),
        );
        break;

      default:
        await this.tokenService.createRevokeToken({
          userId: sub,
          jti,
          ttl: iat + REFRESH_EXPIRE_IN,
        });

        status = 201;
        break;
    }
    return status;
  };

  rotateToken = async (
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string },
    issuer: string,
  ): Promise<LoginResponse> => {
    if ((iat + ACCESS_EXPIRE_IN) * 1000 > Date.now() + 30000) {
      throw new ConflictException("Current access token stile valid");
    }
    await this.tokenService.createRevokeToken({
      userId: sub,
      jti,
      ttl: iat + REFRESH_EXPIRE_IN,
    });
    return this.tokenService.createLoginCredentials(user, issuer);
  };

  deleteProfile = async (
    user: HydratedDocument<IUser>,
  
  )=> {
    const account = await this.userRepository.deleteOne({filter : {_id : user._id , force : true}})
    if(!account.deletedCount){
      throw new NotFoundException("Invalid account")
    }

    await this.s3.deleteFolderByPrefix({prefix : `Users/${user._id.toString()}`})

    return account
  }
}

export default new UserService();
