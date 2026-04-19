"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const common_1 = require("../../common");
const middleware_1 = require("../../middleware");
const user_autharization_1 = require("./user.autharization");
const router = (0, express_1.Router)();
router.get("/profile", (0, middleware_1.authentication)(), (0, middleware_1.authorization)(user_autharization_1.endPoint.profile), async (req, res, next) => {
    const user = await user_service_1.default.profile(req.user);
    return (0, common_1.successResponse)({
        res,
        data: user,
    });
});
exports.default = router;
