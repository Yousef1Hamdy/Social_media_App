"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("../../common");
const config_1 = require("../../config/config");
class UserService {
    redis;
    tokenService;
    s3;
    constructor() {
        this.redis = common_1.redisService;
        this.tokenService = new common_1.TokenService();
        this.s3 = common_1.s3Service;
    }
    async profileImage({ ContentType, Originalname, }, user) {
        const oldPic = user.profileImage;
        const { url, key } = await this.s3.createPreSignedUploadLink({
            path: `Users/${user._id.toString()}/profile`,
            ContentType,
            Originalname,
        });
        user.profileImage = key;
        await user.save();
        if (oldPic) {
            await common_1.s3Service.deleteAsset({ Key: oldPic });
        }
        return { user, url };
    }
    async profileCoverImages(files, user) {
        const oldUrls = user.coverImage;
        const urls = await this.s3.uploadAssets({
            files,
            path: `Users/${user._id.toString()}/profile`,
            storageApproach: common_1.StorageApproachEnum.DISK,
        });
        user.coverImage = urls;
        await user.save();
        if (oldUrls?.length) {
            await common_1.s3Service.deleteAssets({
                Keys: oldUrls.map((Key) => {
                    return { Key };
                }),
            });
        }
        return user.toJSON();
    }
    async profile(user) {
        return user.toJSON();
    }
    logout = async ({ flag }, user, { jti, iat, sub }) => {
        let status = 200;
        switch (flag) {
            case common_1.LogoutEnum.All:
                user.changeCredentialTime = new Date();
                await user.save();
                await this.redis.deleteKey(await this.redis.keys(this.redis.baseRevokeTokenKey(sub)));
                break;
            default:
                await this.tokenService.createRevokeToken({
                    userId: sub,
                    jti,
                    ttl: iat + config_1.REFRESH_EXPIRE_IN,
                });
                status = 201;
                break;
        }
        return status;
    };
    rotateToken = async (user, { jti, iat, sub }, issuer) => {
        if ((iat + config_1.ACCESS_EXPIRE_IN) * 1000 > Date.now() + 30000) {
            throw new common_1.ConflictException("Current access token stile valid");
        }
        await this.tokenService.createRevokeToken({
            userId: sub,
            jti,
            ttl: iat + config_1.REFRESH_EXPIRE_IN,
        });
        return this.tokenService.createLoginCredentials(user, issuer);
    };
}
exports.UserService = UserService;
exports.default = new UserService();
