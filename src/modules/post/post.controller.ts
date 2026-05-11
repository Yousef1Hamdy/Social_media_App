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
import * as validators from "./post.validation";
import { postService } from "./post.service";
import { paginationValidationSchema, successResponse } from "../../common";
import { ReactPostParamsDto, ReactPostQueryDto, UpdatePostParamsDto } from "./post.dto";
import { PaginationDto } from "../../common/types/paginate.types";
import { commentRouter } from "../comment";
const router = Router();
router.use("/:postId/comment" , commentRouter)
router.get(
  "/",
  authentication(),
  validation(paginationValidationSchema),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.listPost(
      req.query as PaginationDto,
      req.user,
    );
    return successResponse({ res, status: 200, data });
  },
);
router.post(
  "/",
  authentication(),
  cloudFileUpload({ validation: fileFieldValidation.image }).array(
    "attachments",
    2,
  ),
  validation(validators.createPost),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.createPost(
      { ...req.body, files: req.files },
      req.user,
    );
    return successResponse({ res, status: 201, data });
  },
);
router.patch(
  "/:postId",
  authentication(),
  cloudFileUpload({ validation: fileFieldValidation.image }).array(
    "attachments",
    2,
  ),
  validation(validators.updatePost),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.updatePost(
      req.params as UpdatePostParamsDto,
      { ...req.body, files: req.files },
      req.user,
    );
    return successResponse({ res, status: 200, data });
  },
);

router.patch(
  "/:postId/react",
  authentication(),
  validation(validators.reactOnPost),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.reactOnPost(
      req.params as ReactPostParamsDto,
      req.query as unknown as ReactPostQueryDto,
      req.user,
    );
    return successResponse({ res, status: 200, data });
  },
);

router.delete(
  "/:postId",
  authentication(),
  validation(validators.deletePost),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.deletePost(
      req.params as ReactPostParamsDto,
      req.user,
      req.body.force,
    );
    return successResponse({ res, status: 200, data });
  },
);

router.put(
  "/:postId/restore",
  authentication(),
  validation(validators.restorePost),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.restorePost(
      req.params as ReactPostParamsDto,
      req.user,
    );
    return successResponse({ res, status: 200, data });
  },
);

export default router;
