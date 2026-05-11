"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const common_1 = require("../common");
const validation = (schema) => {
    return (req, res, next) => {
        const validationError = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req.file) {
                req.body.file = req.file;
            }
            if (req.files) {
                req.body.files = req.files;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const error = validationResult.error;
                validationError.push({
                    key,
                    issues: error.issues.map((issue) => {
                        return { message: issue.message, path: issue.path };
                    }),
                });
            }
        }
        if (validationError.length) {
            throw new common_1.BadRequestException("Validation Failed", validationError);
        }
        next();
    };
};
exports.validation = validation;
