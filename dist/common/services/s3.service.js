"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../../config/config");
const node_crypto_1 = require("node:crypto");
const enums_1 = require("../enums");
const node_fs_1 = require("node:fs");
const exceptions_1 = require("../exceptions");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3Service {
    client;
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: config_1.AWS_REGION,
            credentials: {
                accessKeyId: config_1.AWS_ACCESS_KEY_ID,
                secretAccessKey: config_1.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    async uploadAsset({ storageApproach = enums_1.StorageApproachEnum.MEMORY, Bucket = config_1.AWS_BUCKET_NAME, path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, contentType, }) {
        const commend = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
            ACL,
            Body: storageApproach === enums_1.StorageApproachEnum.MEMORY
                ? file.buffer
                : (0, node_fs_1.createReadStream)(file.path),
            ContentType: file.mimetype || contentType,
        });
        if (!commend.input?.Key) {
            throw new exceptions_1.BadRequestException("Fail to upload this asset");
        }
        await this.client.send(commend);
        return commend.input?.Key;
    }
    async uploadAssets({ storageApproach = enums_1.StorageApproachEnum.MEMORY, uploadApproach = enums_1.UploadApproachEnum.SMALL, Bucket = config_1.AWS_BUCKET_NAME, path = "general", files, ACL = client_s3_1.ObjectCannedACL.private, contentType, }) {
        let urls = [];
        if (uploadApproach === enums_1.UploadApproachEnum.LARGE) {
            const data = await Promise.all(files.map((file) => this.uploadLargeAsset({
                storageApproach,
                Bucket,
                path,
                file,
                ACL,
                contentType,
            })));
            urls = data.map((ele) => ele.Key);
        }
        else {
            urls = await Promise.all(files.map((file) => this.uploadAsset({
                storageApproach,
                Bucket,
                path,
                file,
                ACL,
                contentType,
            })));
        }
        return urls;
    }
    async uploadLargeAsset({ storageApproach = enums_1.StorageApproachEnum.DISK, Bucket = config_1.AWS_BUCKET_NAME, path = "general", file, ACL = client_s3_1.ObjectCannedACL.private, contentType, partSize = 5, }) {
        const uploadFile = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket,
                Key: `${config_1.APPLICATION_NAME}/${path}/${(0, node_crypto_1.randomUUID)()}__${file.originalname}`,
                ACL,
                Body: storageApproach === enums_1.StorageApproachEnum.MEMORY
                    ? file.buffer
                    : (0, node_fs_1.createReadStream)(file.path),
                ContentType: file.mimetype || contentType,
            },
            partSize: partSize * 1024 * 1024,
        });
        uploadFile.on("httpUploadProgress", (progress) => {
            console.log(`File Upload is ${(progress.loaded / progress.total) * 100}%`);
        });
        return await uploadFile.done();
    }
    async createPreSignedUploadLink({ Bucket = config_1.AWS_BUCKET_NAME, path = "general", expiresIn = config_1.AWS_EXPIRES_IN, ContentType, Originalname, }) {
        const commend = new client_s3_1.PutObjectCommand({
            Bucket,
            Key: `${config_1.APPLICATION_NAME}/${path}/${(0, node_crypto_1.randomUUID)()}__${Originalname}`,
            ContentType,
        });
        if (!commend.input?.Key) {
            throw new exceptions_1.BadRequestException("Fail to upload this asset");
        }
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, commend, { expiresIn });
        return { url, key: commend.input?.Key };
    }
    async createPreSignedFetchLink({ Bucket = config_1.AWS_BUCKET_NAME, Key, expiresIn = config_1.AWS_EXPIRES_IN, fileName, download, }) {
        const commend = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
            ResponseContentDisposition: download === "true"
                ? `attachment; filename="${fileName || Key.split("/").pop()}"`
                : undefined,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, commend, { expiresIn });
        return url;
    }
    async getAsset({ Bucket = config_1.AWS_BUCKET_NAME, Key, }) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
        });
        const response = await this.client.send(command);
        return response;
    }
    async deleteAsset({ Bucket = config_1.AWS_BUCKET_NAME, Key, }) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket,
            Key,
        });
        const response = await this.client.send(command);
        return response;
    }
    async deleteAssets({ Bucket = config_1.AWS_BUCKET_NAME, Keys, }) {
        const command = new client_s3_1.DeleteObjectsCommand({
            Bucket,
            Delete: {
                Objects: Keys,
                Quiet: false,
            },
        });
        const response = await this.client.send(command);
        return response;
    }
    async listFolderDir({ Bucket = config_1.AWS_BUCKET_NAME, prefix, }) {
        const command = new client_s3_1.ListObjectsV2Command({
            Bucket,
            Prefix: `${config_1.APPLICATION_NAME}/${prefix}`,
        });
        const response = await this.client.send(command);
        return response;
    }
    async deleteFolderByPrefix({ Bucket = config_1.AWS_BUCKET_NAME, prefix, }) {
        const result = await this.listFolderDir({ Bucket, prefix });
        const Keys = result.Contents?.map((ele) => {
            return { Key: ele.Key };
        });
        return await this.deleteAssets({ Bucket, Keys });
    }
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
