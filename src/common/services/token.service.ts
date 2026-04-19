import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { UserModel } from "../../DB/models/user.model";
import { UserRepository } from "./../../DB/repository/user.repository";
import { redisService, RedisService } from "./redis.service";
import {
  ACCESS_EXPIRE_IN,
  REFRESH_EXPIRE_IN,
  SYSTEM_REFRESH_TOKEN_SECRET_KEY,
  SYSTEM_TOKEN_SECRET_KEY,
  USER_REFRESH_TOKEN_SECRET_KEY,
  USER_TOKEN_SECRET_KEY,
} from "../../config/config";
import { AudienceEnum, RoleEnum, TokenTypeEnum } from "../enums";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../exceptions";
import { randomUUID } from "node:crypto";
import { HydratedDocument } from "mongoose";
import { IUser } from "../interfaces";
import { LoginResponse } from "../../modules/auth/auth.entity";

type TokenSignature = {
  accessSignature: string;
  refreshSignature: string;
  audience: AudienceEnum;
};

export class TokenService {
  private readonly userRepository: UserRepository;
  private readonly redis: RedisService;
  constructor() {
    this.userRepository = new UserRepository(UserModel);
    this.redis = redisService;
  }

  generateToken = ({
    payload,
    security = USER_TOKEN_SECRET_KEY,
    options = {},
  }: {
    payload: object;
    security?: string;
    options?: SignOptions;
  }): string => {
    if (!security) {
      throw new Error("JWT secret key is missing");
    }
    const token = jwt.sign(payload, security, options);
    return token;
  };

  verifyToken = ({
    token,
    security = process.env.USER_TOKEN_SECRET_KEY!,
  }: {
    token: string;
    security?: string;
  }): JwtPayload => {
    try {
      return jwt.verify(token, security) as JwtPayload;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedException("Token expired");
      }
      throw new UnauthorizedException("Invalid token");
    }
  };

  getTokenSignature = async (role: RoleEnum): Promise<TokenSignature> => {
    switch (role) {
      case RoleEnum.ADMIN:
        return {
          accessSignature: SYSTEM_TOKEN_SECRET_KEY as string,
          refreshSignature: SYSTEM_REFRESH_TOKEN_SECRET_KEY as string,
          audience: AudienceEnum.System,
        };

      default:
        return {
          accessSignature: USER_TOKEN_SECRET_KEY as string,
          refreshSignature: USER_REFRESH_TOKEN_SECRET_KEY as string,
          audience: AudienceEnum.User,
        };
    }
  };

  getSignatureLevel = async (audienceType: AudienceEnum): Promise<RoleEnum> => {
    switch (audienceType) {
      case AudienceEnum.System:
        return RoleEnum.ADMIN;

      default:
        return RoleEnum.USER;
    }
  };

  createLoginCredentials = async (
    user: HydratedDocument<IUser>,
    issuer: string,
  ): Promise<LoginResponse> => {
    const { accessSignature, refreshSignature, audience } =
      await this.getTokenSignature(user.role);

    const jwtid = randomUUID();

    const access_token = await this.generateToken({
      payload: { sub: user?._id.toString() },
      security: accessSignature,
      options: {
        issuer,
        expiresIn: ACCESS_EXPIRE_IN,
        audience: [
          TokenTypeEnum.access as unknown as string,
          audience as unknown as string,
        ],
        jwtid,
      },
    });

    const refresh_token = await this.generateToken({
      payload: { sub: user?._id.toString() },
      security: refreshSignature,
      options: {
        issuer,
        expiresIn: REFRESH_EXPIRE_IN,
        audience: [
          TokenTypeEnum.refresh as unknown as string,
          audience as unknown as string,
        ],
        jwtid,
      },
    });

    return {
      access_token,
      refresh_token,
    };
  };

  decodeToken = async ({
    token,
    tokenType = TokenTypeEnum.access,
  }: {
    token: string;
    tokenType: TokenTypeEnum;
  }): Promise<{
    user: HydratedDocument<IUser>;
    decode: JwtPayload;
  }> => {
    if (!token) {
      throw new BadRequestException("missing token");
    }
    const decode = jwt.decode(token) as JwtPayload | null;

    if (!decode || typeof decode === "string") {
      throw new BadRequestException("Failed to decode token");
    }

    if (!decode?.aud?.length) {
      throw new BadRequestException(
        "Fail to decode this token and is required ",
      );
    }

    const [decodeTokenType, audienceType] = decode.aud;
    if (decodeTokenType == undefined || audienceType == undefined) {
      throw new BadRequestException("Missing token audience");
    }
    if ((decodeTokenType as unknown as TokenTypeEnum) !== tokenType) {
      throw new BadRequestException(
        `Invalid token type token of type ${decodeTokenType} can't access this api while we expected token of type ${tokenType}`,
      );
    }
    //
    if (
      decode.jti &&
      (await this.redis.get(
        this.redis.revokeTokenKey({
          userId: decode.sub as string,
          jti: decode.jti,
        }),
      ))
    ) {
      throw new UnauthorizedException("Invalid login session -");
    }
    //

    const signatureLevel = await this.getSignatureLevel(
      audienceType as unknown as AudienceEnum,
    );

    const { accessSignature, refreshSignature } =
      await this.getTokenSignature(signatureLevel);
    const verifyData = await this.verifyToken({
      token,
      security:
        tokenType == TokenTypeEnum.access ? accessSignature : refreshSignature,
    });

    const user = await this.userRepository.findOne({
      filter: { _id: verifyData.sub },
      projection: "+password",
    });

    if (!user) {
      throw new NotFoundException("not Register account");
    }

    if (
      user.changeCredentialTime &&
      user.changeCredentialTime.getTime() > ((decode.iat as number) || 0) * 1000
    ) {
      throw new UnauthorizedException("Invalid login session.");
    }

    return { user, decode };
  };
}
