"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRepository = void 0;
const base_repository_1 = require("./base.repository");
class CommentRepository extends base_repository_1.BaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
}
exports.CommentRepository = CommentRepository;
