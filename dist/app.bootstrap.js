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
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    await (0, connected_db_1.connectDB)();
    await redis_service_1.redisService.connect();
    app.get("/", (req, res, next) => {
        res.status(200).json({ message: "Landing Page" });
    });
    app.use("/auth", modules_1.authRouter);
    app.use(middleware_1.globalErrorHandler);
    app.use("/*dummy", (req, res, next) => {
        res.status(404).json({ message: "Invalid Application Routing" });
    });
    app.listen(config_1.PORT, () => {
        console.log("Server is running successfully on port 3000 !");
    });
};
exports.default = bootstrap;
