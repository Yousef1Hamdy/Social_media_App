import { z } from "zod";
import { paginationValidationSchema } from "../utils";
import { HydratedDocument } from "mongoose";

export type PaginationDto = z.infer<typeof paginationValidationSchema.query>;

export interface IPaginate<TRawDoc> {
  docs: HydratedDocument<TRawDoc>[];
  currentPage?: number | undefined;
  pageSize?: number | undefined;
  pages?: number | undefined;
}
