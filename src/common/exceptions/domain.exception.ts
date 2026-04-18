import { ApplicationException } from "./application.exception";

export class NotFoundException extends ApplicationException {
  constructor(message: string = "NotFoundException", cause?: unknown) {
    super(message, 404, cause);
  }
}

export class ConflictException extends ApplicationException {
  constructor(message: string = "ConflictException", cause?: unknown) {
    super(message, 409, cause);
  }
}

export class UnauthorizedException extends ApplicationException {
  constructor(message: string = "UnauthorizedException", cause?: unknown) {
    super(message, 401, cause);
  }
}

export class BadRequestException extends ApplicationException {
  constructor(message: string = "BadRequestException", cause?: unknown) {
    super(message, 400, cause);
  }
}

export class ForbiddenRequestException extends ApplicationException {
  constructor(message: string = "ForbiddenRequestException", cause?: unknown) {
    super(message, 403, cause);
  }
}
