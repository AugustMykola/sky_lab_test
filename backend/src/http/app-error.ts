export enum ErrorCode {
  BadRequest = 'BAD_REQUEST',
  ValidationError = 'VALIDATION_ERROR',
  NotFound = 'NOT_FOUND',
  PayloadTooLarge = 'PAYLOAD_TOO_LARGE',
  UnsupportedMediaType = 'UNSUPPORTED_MEDIA_TYPE',
  Unprocessable = 'UNPROCESSABLE',
  InternalError = 'INTERNAL_ERROR',
}

export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: FieldError[],
  ) {
    super(message);
  }
}

export const notFound = (message: string) => new AppError(404, ErrorCode.NotFound, message);

export const unprocessable = (message: string) => new AppError(422, ErrorCode.Unprocessable, message);
