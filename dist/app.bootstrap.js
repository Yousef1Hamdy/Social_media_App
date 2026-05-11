"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modules_1 = require("./modules");
const middleware_1 = require("./middleware");
const connected_db_1 = require("./DB/connected.db");
const config_1 = require("./config/config");
const redis_service_1 = require("./common/services/redis.service");
const user_1 = require("./modules/user");
const cors_1 = __importDefault(require("cors"));
const common_1 = require("./common");
const node_stream_1 = require("node:stream");
const node_util_1 = require("node:util");
const post_1 = require("./modules/post");
const s3WriteStream = (0, node_util_1.promisify)(node_stream_1.pipeline);
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json(), (0, cors_1.default)());
    await (0, connected_db_1.connectDB)();
    await redis_service_1.redisService.connect();
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "Landing Page" });
    });
    app.post("/send-notification", async (req, res, next) => {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                message: "FCM token is required",
            });
        }
        const message = await common_1.notificationService.sendNotification({
            token,
            data: {
                title: "First notification",
                body: "Hello world",
            },
        });
        return res.status(200).json({ message });
    });
    app.use("/auth", modules_1.authRouter);
    app.use("/user", user_1.userRouter);
    app.use("/post", post_1.postRouter);
    app.get("/uploads/*path", async (req, res, next) => {
        const { download, fileName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const { Body, ContentType } = await common_1.s3Service.getAsset({ Key });
        res.setHeader("Content-Type", ContentType || "application/octet-stream");
        res.set("Cross-Origin-Resource-policy", "cross-origin");
        if (download === "true") {
            res.setHeader("Content-Disposition", `attachment; filename="${fileName || Key.split("/").pop()}"`);
        }
        return await s3WriteStream(Body, res);
    });
    app.get("/pre-signed/*path", async (req, res, next) => {
        const { download, fileName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await common_1.s3Service.createPreSignedFetchLink({
            Key,
            download,
            fileName,
        });
        return (0, common_1.successResponse)({ res, data: { url } });
    });
    app.use(middleware_1.globalErrorHandler);
    app.use("/*dummy", (req, res, next) => {
        res.status(404).json({ message: "Invalid Application Routing" });
    });
    app.listen(config_1.PORT, () => {
        console.log("Server is running successfully on port 3000 !");
    });
};
exports.default = bootstrap;
