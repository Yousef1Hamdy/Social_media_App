import { NextFunction, Request, Response, Router } from "express";
import userService from "./user.service";
import {
  cloudFileUpload,
  fileFieldValidation,
  StorageApproachEnum,
  successResponse,
  TokenTypeEnum,
} from "../../common";
import { authentication, authorization } from "../../middleware";
import { endPoint } from "./user.authorization";

const router = Router();

// router.patch(
//   "/profile-Image",
//   authentication(),
//   authorization(endPoint.profile),
//   cloudFileUpload({
//     storageApproach: StorageApproachEnum.DISK,
//     validation: fileFieldValidation.image,
//     maxSize: 2,
//   }).single("attachment"),
//   async (req: Request, res: Response, next: NextFunction) => {
//     const data = await userService.profileImage(
//       req.file as Express.Multer.File,
//       req.user,
//     );
//     return successResponse({
//       res,
//       data
//     });
//   },
// );

router.patch(
  "/profile-Image",
  authentication(),
  authorization(endPoint.profile),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.profileImage(
      req.body,
      req.user,
    );
    return successResponse({
      res,
      data,
    });
  },
);

router.patch(
  "/profile-Cover-Image",
  authentication(),
  authorization(endPoint.profile),
  cloudFileUpload({
    storageApproach: StorageApproachEnum.DISK,
    validation: fileFieldValidation.image,
    maxSize: 2,
  }).array("attachments", 2),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await userService.profileCoverImages(
      req.files as Express.Multer.File[],
      req.user,
    );
    return successResponse({
      res,
      data,
    });
  },
);

router.get(
  "/profile",
  authentication(),
  authorization(endPoint.profile),
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await userService.profile(req.user);

    return successResponse({
      res,
      data: user,
    });
  },
);

router.post(
  "/logout",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const status = await userService.logout(
      req.body,
      req.user,
      req.decode as { jti: string; iat: number; sub: string },
    );

    return successResponse({ res, status });
  },
);

router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.refresh),
  async (req, res, next) => {
    const credentials = await userService.rotateToken(
      req.user,
      req.decode as { jti: string; iat: number; sub: string },
      `${req.protocol}://${req.host}`,
    );
    return successResponse({
      res,
      status: 201,
      message: "",
      data: { ...credentials },
    });
  },
);

export default router;
