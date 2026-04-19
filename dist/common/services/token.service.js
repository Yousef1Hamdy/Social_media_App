"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../../DB/models/user.model");
const user_repository_1 = require("./../../DB/repository/user.repository");
const redis_service_1 = require("./redis.service");
const config_1 = require("../../config/config");
const enums_1 = require("../enums");
const exceptions_1 = require("../exceptions");
const node_crypto_1 = require("node:crypto");
class TokenService {
    userRepository;
    redis;
    constructor() {
        this.userRepository = new user_repository_1.UserRepository(user_model_1.UserModel);
        this.redis = redis_service_1.redisService;
    }
    generateToken = ({ payload, security = config_1.USER_TOKEN_SECRET_KEY, options = {}, }) => {
        if (!security) {
            throw new Error("JWT secret key is missing");
        }
        const token = jsonwebtoken_1.default.sign(payload, security, options);
        return token;
    };
    verifyToken = ({ token, security = process.env.USER_TOKEN_SECRET_KEY, }) => {
        try {
            return jsonwebtoken_1.default.verify(token, security);
        }
        catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new exceptions_1.UnauthorizedException("Token expired");
            }
            throw new exceptions_1.UnauthorizedException("Invalid token");
        }
    };
    getTokenSignature = async (role) => {
        switch (role) {
            case enums_1.RoleEnum.ADMIN:
                return {
                    accessSignature: config_1.SYSTEM_TOKEN_SECRET_KEY,
                    refreshSignature: config_1.SYSTEM_REFRESH_TOKEN_SECRET_KEY,
                    audience: enums_1.AudienceEnum.System,
                };
            default:
                return {
                    accessSignature: config_1.USER_TOKEN_SECRET_KEY,
                    refreshSignature: config_1.USER_REFRESH_TOKEN_SECRET_KEY,
                    audience: enums_1.AudienceEnum.User,
                };
        }
    };
    getSignatureLevel = async (audienceType) => {
        switch (audienceType) {
            case enums_1.AudienceEnum.System:
                return enums_1.RoleEnum.ADMIN;
            default:
                return enums_1.RoleEnum.USER;
        }
    };
    createLoginCredentials = async (user, issuer) => {
        const { accessSignature, refreshSignature, audience } = await this.getTokenSignature(user.role);
        const jwtid = (0, node_crypto_1.randomUUID)();
        const access_token = await this.generateToken({
            payload: { sub: user?._id.toString() },
            security: accessSignature,
            options: {
                issuer,
                expiresIn: config_1.ACCESS_EXPIRE_IN,
                audience: [
                    enums_1.TokenTypeEnum.access,
                    audience,
                ],
                jwtid,
            },
        });
        const refresh_token = await this.generateToken({
            payload: { sub: user?._id.toString() },
            security: refreshSignature,
            options: {
                issuer,
                expiresIn: config_1.REFRESH_EXPIRE_IN,
                audience: [
                    enums_1.TokenTypeEnum.refresh,
                    audience,
                ],
                jwtid,
            },
        });
        return {
            access_token,
            refresh_token,
        };
    };
    decodeToken = async ({ token, tokenType = enums_1.TokenTypeEnum.access, }) => {
        if (!token) {
            throw new exceptions_1.BadRequestException("missing token");
        }
        const decode = jsonwebtoken_1.default.decode(token);
        if (!decode || typeof decode === "string") {
            throw new exceptions_1.BadRequestException("Failed to decode token");
        }
        if (!decode?.aud?.length) {
            throw new exceptions_1.BadRequestException("Fail to decode this token and is required ");
        }
        const [decodeTokenType, audienceType] = decode.aud;
        if (decodeTokenType == undefined || audienceType == undefined) {
            throw new exceptions_1.BadRequestException("Missing token audience");
        }
        if (decodeTokenType !== tokenType) {
            throw new exceptions_1.BadRequestException(`Invalid token type token of type ${decodeTokenType} can't access this api while we expected token of type ${tokenType}`);
        }
        if (decode.jti &&
            (await this.redis.get(this.redis.revokeTokenKey({
                userId: decode.sub,
                jti: decode.jti,
            })))) {
            throw new exceptions_1.UnauthorizedException("Invalid login session -");
        }
        const signatureLevel = await this.getSignatureLevel(audienceType);
        const { accessSignature, refreshSignature } = await this.getTokenSignature(signatureLevel);
        const verifyData = await this.verifyToken({
            token,
            security: tokenType == enums_1.TokenTypeEnum.access ? accessSignature : refreshSignature,
        });
        const user = await this.userRepository.findOne({
            filter: { _id: verifyData.sub },
            projection: "+password",
        });
        if (!user) {
            throw new exceptions_1.NotFoundException("not Register account");
        }
        if (user.changeCredentialTime &&
            user.changeCredentialTime.getTime() > (decode.iat || 0) * 1000) {
            throw new exceptions_1.UnauthorizedException("Invalid login session.");
        }
        return { user, decode };
    };
}
exports.TokenService = TokenService;
