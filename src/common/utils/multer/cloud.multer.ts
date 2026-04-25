import multer from "multer";
import { StorageApproachEnum } from "../../enums";
import { Request } from "express";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { fileFilter } from "./validation.multer";

export const cloudFileUpload = ({
  storageApproach = StorageApproachEnum.MEMORY,
  validation = [],
  maxSize = 2,
}: {
  storageApproach?: StorageApproachEnum;
  validation?: string[];
  maxSize?: number;
}) => {
  const storage =
    storageApproach === StorageApproachEnum.MEMORY
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: function (
            req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, destination: string) => void,
          ) {
            callback(null, tmpdir());
          },
          filename: function (
            req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, destination: string) => void,
          ) {
            callback(null, `${randomUUID()}__${file.originalname}`);
          },
        });
  return multer({
    fileFilter: fileFilter(validation),
    storage,
    limits: { fileSize: maxSize * 1024 * 1024 },
  });
};
