"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("./auth.service"));
const common_1 = require("../../common");
const middleware_1 = require("../../middleware");
const validators = __importStar(require("./auth.validation"));
const router = (0, express_1.Router)();
router.post("/login", (0, middleware_1.validation)(validators.loginSchema), async (req, res, next) => {
    const data = await auth_service_1.default.login(req.body, `${req.protocol}://${req.host}`);
    return (0, common_1.successResponse)({
        res,
        message: "LOGIN",
        data,
    });
});
router.post("/signup", (0, middleware_1.validation)(validators.signupSchema), async (req, res, next) => {
    const message = await auth_service_1.default.signup(req.body);
    return (0, common_1.successResponse)({
        res,
        status: 201,
        message,
    });
});
router.patch("/confirm-email", (0, middleware_1.validation)(validators.confirmEmail), async (req, res, next) => {
    const { message } = await auth_service_1.default.confirmEmail(req.body);
    return (0, common_1.successResponse)({
        res,
        message,
    });
});
router.patch("/resend-confirm-email", (0, middleware_1.validation)(validators.resendConfirmEmail), async (req, res, next) => {
    await auth_service_1.default.resendConfirmEmail(req.body);
    return (0, common_1.successResponse)({
        res,
    });
});
router.post("/signup/gmail", async (req, res, next) => {
    const protocol = req.protocol;
    const host = req.get("host");
    const issuer = `${protocol}://${host}`;
    const { account, status = 201 } = await auth_service_1.default.signupWithGmail(req.body, issuer);
    return (0, common_1.successResponse)({
        res,
        status,
        message: "Done ",
        data: { account },
    });
});
router.post("/login/gmail", async (req, res, next) => {
    const protocol = req.protocol;
    const host = req.get("host");
    const issuer = `${protocol}://${host}`;
    const account = await auth_service_1.default.loginWithGmail(req.body, issuer);
    return (0, common_1.successResponse)({
        res,
        message: "Done ",
        data: { account },
    });
});
exports.default = router;
