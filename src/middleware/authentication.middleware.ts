import { TokenService } from '../common/services/token.service';
import { NextFunction, Request, Response } from "express";
import { TokenTypeEnum, UnauthorizedException } from "../common";


export const authentication = (
  tokenType: TokenTypeEnum = TokenTypeEnum.access,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tokenService = new TokenService()
      const authHeader = req.headers.authorization;
      // console.log({authHeader});
      if (!authHeader) {
        throw new UnauthorizedException("Unauthorized");
      }

      const [flag, credential] = authHeader.split(" ");

      if (!flag || !credential || flag !== "Bearer") {
        throw new UnauthorizedException("Invalid token format");
      }
      const { user, decode } = await tokenService.decodeToken({
        token: credential,
        tokenType,
      });
      req.user = user;
      req.decode = decode;
      next();
    } catch (error) {
      throw error;
    }
  };
};
