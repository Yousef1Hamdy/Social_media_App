"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const common_1 = require("../common");
const authorization = (accessRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new common_1.UnauthorizedException("Unauthorized");
            }
            if (!accessRoles.includes(req.user.role)) {
                throw new common_1.ForbiddenRequestException("Not allow account");
            }
            next();
        }
        catch (error) {
            throw error;
        }
    };
};
exports.authorization = authorization;
