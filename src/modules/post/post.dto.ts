
import { z } from "zod";
import { createPost, reactOnPost, updatePost } from "./post.validation";

export type CreatePostBodyDto = z.infer<typeof createPost.body>;

export type UpdatePostBodyDto = z.infer<typeof updatePost.body>;
export type UpdatePostParamsDto = z.infer<typeof updatePost.params>;

export type ReactPostQueryDto = z.infer<typeof reactOnPost.query>;
export type ReactPostParamsDto = z.infer<typeof reactOnPost.params>;