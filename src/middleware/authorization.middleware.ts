import { NextFunction, Request, Response } from "express";
import { ForbiddenRequestException, RoleEnum, UnauthorizedException } from "../common";

export const authorization = (accessRoles:RoleEnum[]) => {
  return async (req :Request, res : Response, next : NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedException( "Unauthorized" );
      }

      if (!accessRoles.includes(req.user.role)) {
        throw new ForbiddenRequestException( "Not allow account" );
      }

      next();
    } catch (error) {
      throw error;
    }
  };
};
