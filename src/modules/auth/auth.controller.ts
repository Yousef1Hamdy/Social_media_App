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
import { loginSchema } from "./auth.validation";
const router = Router();

router.post(
  "/login",
  validation(loginSchema),
  (req: Request, res: Response, next: NextFunction): Response => {
    const data = authService.login(req.body);
    return successResponse<LoginResponse>({
      res,
      message: "LOGIN",
      data,
    });
  },
);


  router.post(
  "/signup",
  // validation(validators.signup),
  async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const message = await authService.signup(req.body);
    return successResponse({
      res,
      status: 201,
      message
    });
  },
);

router.patch(
  "/confirm-email",
  // validation(validators.confirmEmail),
    async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const { message } = await authService.confirmEmail(req.body);
    return successResponse({
      res,
      message,
    });
  },
);

router.patch(
  "/resend-confirm-email",
  // validation(validators.resendConfirmEmail),
    async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const message = await authService.resendConfirmEmail(req.body);
    return successResponse({
      res,
    });
  },
);


export default router;
