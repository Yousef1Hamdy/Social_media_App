"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenRequestException = exports.BadRequestException = exports.UnauthorizedException = exports.ConflictException = exports.NotFoundException = void 0;
const application_exception_1 = require("./application.exception");
class NotFoundException extends application_exception_1.ApplicationException {
    constructor(message = "NotFoundException", cause) {
        super(message, 404, cause);
    }
}
exports.NotFoundException = NotFoundException;
class ConflictException extends application_exception_1.ApplicationException {
    constructor(message = "ConflictException", cause) {
        super(message, 409, cause);
    }
}
exports.ConflictException = ConflictException;
class UnauthorizedException extends application_exception_1.ApplicationException {
    constructor(message = "UnauthorizedException", cause) {
        super(message, 401, cause);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class BadRequestException extends application_exception_1.ApplicationException {
    constructor(message = "BadRequestException", cause) {
        super(message, 400, cause);
    }
}
exports.BadRequestException = BadRequestException;
class ForbiddenRequestException extends application_exception_1.ApplicationException {
    constructor(message = "ForbiddenRequestException", cause) {
        super(message, 403, cause);
    }
}
exports.ForbiddenRequestException = ForbiddenRequestException;
