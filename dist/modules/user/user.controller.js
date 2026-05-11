"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const common_1 = require("../../common");
const middleware_1 = require("../../middleware");
const user_authorization_1 = require("./user.authorization");
const router = (0, express_1.Router)();
router.patch("/profile-Image", (0, middleware_1.authentication)(), (0, middleware_1.authorization)(user_authorization_1.endPoint.profile), async (req, res, next) => {
    const data = await user_service_1.default.profileImage(req.body, req.user);
    return (0, common_1.successResponse)({
        res,
        data,
    });
});
router.patch("/profile-Cover-Image", (0, middleware_1.authentication)(), (0, middleware_1.authorization)(user_authorization_1.endPoint.profile), (0, common_1.cloudFileUpload)({
    storageApproach: common_1.StorageApproachEnum.DISK,
    validation: common_1.fileFieldValidation.image,
    maxSize: 2,
}).array("attachments", 2), async (req, res, next) => {
    const data = await user_service_1.default.profileCoverImages(req.files, req.user);
    return (0, common_1.successResponse)({
        res,
        data,
    });
});
router.get("/profile", (0, middleware_1.authentication)(), (0, middleware_1.authorization)(user_authorization_1.endPoint.profile), async (req, res, next) => {
    const user = await user_service_1.default.profile(req.user);
    return (0, common_1.successResponse)({
        res,
        data: user,
    });
});
router.post("/logout", (0, middleware_1.authentication)(), async (req, res, next) => {
    const status = await user_service_1.default.logout(req.body, req.user, req.decode);
    return (0, common_1.successResponse)({ res, status });
});
router.post("/rotate-token", (0, middleware_1.authentication)(common_1.TokenTypeEnum.refresh), async (req, res, next) => {
    const credentials = await user_service_1.default.rotateToken(req.user, req.decode, `${req.protocol}://${req.host}`);
    return (0, common_1.successResponse)({
        res,
        status: 201,
        message: "",
        data: { ...credentials },
    });
});
router.delete("/", (0, middleware_1.authentication)(), async (req, res, next) => {
    const account = await user_service_1.default.deleteProfile(req.user);
    return (0, common_1.successResponse)({
        res,
        data: { account },
    });
});
exports.default = router;
