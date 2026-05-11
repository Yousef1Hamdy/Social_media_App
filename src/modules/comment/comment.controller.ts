import { createCommentParamsDto, createReplayCommentParamsDto } from './comment.dto';
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { authentication, validation } from "../../middleware";
import {
  cloudFileUpload,
  fileFieldValidation,
} from "../../common/utils/multer";
import * as validators from "./comment.validation";
import { commentService } from "./comment.service";
import { successResponse } from "../../common";

const router = Router({mergeParams : true});

router.post(
  "/",
  authentication(),
  cloudFileUpload({ validation: fileFieldValidation.image }).array(
    "attachments",
    2,
  ),
  validation(validators.createComment),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await commentService.createComment(
      req.params as createCommentParamsDto ,
      { ...req.body, files: req.files },
      req.user,
    );
    return successResponse({ res, status: 201, data });
  },
);
router.delete(
  "/:commentId",
  authentication(),
  validation(validators.deleteComments),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await commentService.deleteComment(
      req.params as createReplayCommentParamsDto,
      req.user,
    );
    return successResponse({ res, status: 200, data });
  },
);

router.get(
  "/get-comments",
  authentication(),
  validation(validators.getComments),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await commentService.getComments(
      req.params as createCommentParamsDto,
      req.user,
    );
    return successResponse({ res, status: 200, data });
  },
);

router.post(
  "/:commentId/replay",
  authentication(),
  cloudFileUpload({ validation: fileFieldValidation.image }).array(
    "attachments",
    2,
  ),
  validation(validators.createReplayComment),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await commentService.createReplayComment(
      req.params as createReplayCommentParamsDto,
      { ...req.body, files: req.files },
      req.user,
    );
    return successResponse({ res, status: 201, data });
  },
);

export default router;
