import { NextFunction, Request, Response, Router } from "express";
import userService from "./user.service";
import { successResponse } from "../../common";
import { authentication, authorization } from "../../middleware";
import { endPoint } from "./user.autharization";

const router = Router();

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
export default router;
