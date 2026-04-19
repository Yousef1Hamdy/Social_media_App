"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
class UserService {
    constructor() { }
    async profile(user) {
        return user.toJSON();
    }
}
exports.UserService = UserService;
exports.default = new UserService();
