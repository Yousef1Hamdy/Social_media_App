"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const token_service_1 = require("../common/services/token.service");
const common_1 = require("../common");
const authentication = (tokenType = common_1.TokenTypeEnum.access) => {
    return async (req, res, next) => {
        try {
            const tokenService = new token_service_1.TokenService();
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                throw new common_1.UnauthorizedException("Unauthorized");
            }
            const [flag, credential] = authHeader.split(" ");
            if (!flag || !credential || flag !== "Bearer") {
                throw new common_1.UnauthorizedException("Invalid token format");
            }
            const { user, decode } = await tokenService.decodeToken({
                token: credential,
                tokenType,
            });
            req.user = user;
            req.decode = decode;
            next();
        }
        catch (error) {
            throw error;
        }
    };
};
exports.authentication = authentication;
