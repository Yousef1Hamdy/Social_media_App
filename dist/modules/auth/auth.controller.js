"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("./auth.service"));
const common_1 = require("../../common");
const middleware_1 = require("../../middleware");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
router.post("/login", (0, middleware_1.validation)(auth_validation_1.loginSchema), (req, res, next) => {
    const data = auth_service_1.default.login(req.body);
    return (0, common_1.successResponse)({
        res,
        message: "LOGIN",
        data,
    });
});
router.post("/signup", async (req, res, next) => {
    const message = await auth_service_1.default.signup(req.body);
    return (0, common_1.successResponse)({
        res,
        status: 201,
        message
    });
});
router.patch("/confirm-email", async (req, res, next) => {
    const { message } = await auth_service_1.default.confirmEmail(req.body);
    return (0, common_1.successResponse)({
        res,
        message,
    });
});
router.patch("/resend-confirm-email", async (req, res, next) => {
    const message = await auth_service_1.default.resendConfirmEmail(req.body);
    return (0, common_1.successResponse)({
        res,
    });
});
exports.default = router;
