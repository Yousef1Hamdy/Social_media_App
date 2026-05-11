import {
  CompleteMultipartUploadCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  APPLICATION_NAME,
  AWS_ACCESS_KEY_ID,
  AWS_BUCKET_NAME,
  AWS_EXPIRES_IN,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from "../../config/config";
import { randomUUID } from "node:crypto";
import { StorageApproachEnum, UploadApproachEnum } from "../enums";
import { createReadStream } from "node:fs";
import { BadRequestException } from "../exceptions";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service {
  private client: S3Client;
  constructor() {
    this.client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadAsset({
    storageApproach = StorageApproachEnum.MEMORY,
    Bucket = AWS_BUCKET_NAME,
    path = "general",
    file,
    ACL = ObjectCannedACL.private,
    contentType,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    contentType?: string | undefined;
  }) {
    const commend = new PutObjectCommand({
      Bucket,
      Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
      ACL,
      Body:
        storageApproach === StorageApproachEnum.MEMORY
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype || contentType,
    });

    if (!commend.input?.Key) {
      throw new BadRequestException("Fail to upload this asset");
    }

    await this.client.send(commend);
    return commend.input?.Key;
  }

  async uploadAssets({
    storageApproach = StorageApproachEnum.MEMORY,
    uploadApproach = UploadApproachEnum.SMALL,
    Bucket = AWS_BUCKET_NAME,
    path = "general",
    files,
    ACL = ObjectCannedACL.private,
    contentType,
  }: {
    storageApproach?: StorageApproachEnum;
    uploadApproach?: UploadApproachEnum;
    Bucket?: string;
    path?: string;
    files: Express.Multer.File[];
    ACL?: ObjectCannedACL;
    contentType?: string | undefined;
  }) {
    let urls: string[] = [];
    if (uploadApproach === UploadApproachEnum.LARGE) {
      const data = await Promise.all(
        files.map((file) =>
          this.uploadLargeAsset({
            storageApproach,
            Bucket,
            path,
            file,
            ACL,
            contentType,
          }),
        ),
      );

      urls = data.map((ele) => ele.Key as string);
    } else {
      urls = await Promise.all(
        files.map((file) =>
          this.uploadAsset({
            storageApproach,
            Bucket,
            path,
            file,
            ACL,
            contentType,
          }),
        ),
      );
    }

    return urls;
  }

  async uploadLargeAsset({
    storageApproach = StorageApproachEnum.DISK,
    Bucket = AWS_BUCKET_NAME,
    path = "general",
    file,
    ACL = ObjectCannedACL.private,
    contentType,
    partSize = 5,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    contentType?: string | undefined;
    partSize?: number;
  }): Promise<CompleteMultipartUploadCommandOutput> {
    const uploadFile = new Upload({
      client: this.client,
      params: {
        Bucket,
        Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
        ACL,
        Body:
          storageApproach === StorageApproachEnum.MEMORY
            ? file.buffer
            : createReadStream(file.path),
        ContentType: file.mimetype || contentType,
      },
      partSize: partSize * 1024 * 1024,
    });

    uploadFile.on("httpUploadProgress", (progress) => {
      //   console.log(progress);
      console.log(
        `File Upload is ${((progress.loaded as number) / (progress.total as number)) * 100}%`,
      );
    });

    return await uploadFile.done();
  }

  async createPreSignedUploadLink({
    Bucket = AWS_BUCKET_NAME,
    path = "general",
    expiresIn = AWS_EXPIRES_IN,
    ContentType,
    Originalname,
  }: {
    Bucket?: string;
    path?: string;
    expiresIn?: number;
    ContentType: string;
    Originalname: string;
  }): Promise<{ url: string; key: string }> {
    const commend = new PutObjectCommand({
      Bucket,
      Key: `${APPLICATION_NAME}/${path}/${randomUUID()}__${Originalname}`,
      ContentType,
    });

    if (!commend.input?.Key) {
      throw new BadRequestException("Fail to upload this asset");
    }
    const url = await getSignedUrl(this.client, commend, { expiresIn });
    return { url, key: commend.input?.Key };
  }

  async createPreSignedFetchLink({
    Bucket = AWS_BUCKET_NAME,
    Key,
    expiresIn = AWS_EXPIRES_IN,
    fileName,
    download,
  }: {
    Bucket?: string;
    Key: string;
    expiresIn?: number;
    fileName?: string;
    download?: string;
  }): Promise<string> {
    const commend = new GetObjectCommand({
      Bucket,
      Key,
      ResponseContentDisposition:
        download === "true"
          ? `attachment; filename="${fileName || Key.split("/").pop()}"`
          : undefined,
    });

    const url = await getSignedUrl(this.client, commend, { expiresIn });
    return url;
  }

  async getAsset({
    Bucket = AWS_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }) {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });

    const response = await this.client.send(command);

    return response;
  }
  // Delete
  async deleteAsset({
    Bucket = AWS_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<DeleteObjectCommandOutput> {
    const command = new DeleteObjectCommand({
      Bucket,
      Key,
    });

    const response = await this.client.send(command);

    return response;
  }

  async deleteAssets({
    Bucket = AWS_BUCKET_NAME,
    Keys,
  }: {
    Bucket?: string;
    Keys: { Key: string }[];
  }): Promise<DeleteObjectsCommandOutput> {
    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects: Keys,
        Quiet: false,
      },
    });

    const response = await this.client.send(command);

    return response;
  }

  async listFolderDir({
    Bucket = AWS_BUCKET_NAME,
    prefix,
  }: {
    Bucket?: string;
    prefix: string;
  }): Promise<ListObjectsV2CommandOutput> {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: `${APPLICATION_NAME}/${prefix}`,
    });

    const response = await this.client.send(command);

    return response;
  }

  async deleteFolderByPrefix({
    Bucket = AWS_BUCKET_NAME,
    prefix,
  }: {
    Bucket?: string;
    prefix: string;
  }): Promise<DeleteObjectsCommandOutput> {
    const result = await this.listFolderDir({ Bucket, prefix });
    const Keys = result.Contents?.map((ele) => {
      return { Key: ele.Key };
    }) as { Key: string }[];
    return await this.deleteAssets({ Bucket, Keys });
  }
}

export const s3Service = new S3Service();
