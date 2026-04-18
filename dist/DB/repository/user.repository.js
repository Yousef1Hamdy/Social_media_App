"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const base_repository_1 = require("./base.repository");
class UserRepository extends base_repository_1.BaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
}
exports.UserRepository = UserRepository;
