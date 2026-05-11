
import { z } from "zod";
import { createComment, createReplayComment } from "./comment.validation";


export type createCommentParamsDto = z.infer<typeof createComment.params>
export type createCommentBodyDto = z.infer<typeof createComment.body>

export type createReplayCommentParamsDto = z.infer<typeof createReplayComment.params>
export type createReplayCommentBodyDto = z.infer<typeof createReplayComment.body>
