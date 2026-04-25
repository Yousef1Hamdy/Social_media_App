import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";

import authService from "./auth.service";
import { successResponse } from "../../common";
import { LoginResponse } from "./auth.entity";
import { validation } from "../../middleware";
import * as validators from "./auth.validation";
const router = Router();

router.post(
  "/login",
  validation(validators.loginSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await authService.login(
      req.body,
      `${req.protocol}://${req.host}`,
    );
    return successResponse<LoginResponse>({
      res,
      message: "LOGIN",
      data,
    });
  },
);

router.post(
  "/signup",
  validation(validators.signupSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const message = await authService.signup(req.body);
    return successResponse({
      res,
      status: 201,
      message,
    });
  },
);

router.patch(
  "/confirm-email",
  validation(validators.confirmEmail),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const { message } = await authService.confirmEmail(req.body);
    return successResponse({
      res,
      message,
    });
  },
);

router.patch(
  "/resend-confirm-email",
  validation(validators.resendConfirmEmail),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    await authService.resendConfirmEmail(req.body);
    return successResponse({
      res,
    });
  },
);

router.post("/signup/gmail", async (req, res, next) => {
  const protocol = req.protocol; // http أو https
  const host = req.get("host");
  const issuer = `${protocol}://${host}`;

  const { account, status = 201 } = await authService.signupWithGmail(req.body, issuer);
  return successResponse({
    res,
    status,
    message: "Done ",
    data: { account },
  });
});

router.post("/login/gmail", async (req, res, next) => {
  const protocol = req.protocol; // http أو https
  const host = req.get("host");
  const issuer = `${protocol}://${host}`;

  const account = await authService.loginWithGmail(req.body, issuer);
  return successResponse({
    res,
    message: "Done ",
    data: { account },
  });
});

export default router;
