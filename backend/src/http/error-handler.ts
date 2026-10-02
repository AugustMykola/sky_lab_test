import type { ErrorRequestHandler, RequestHandler } from 'express';
import * as zod from 'zod';
import { AppError, ErrorCode, notFound } from './app-error';
import { logger } from './logger';

const PAYLOAD_TOO_LARGE_STATUS = 413;
const UNSUPPORTED_MEDIA_TYPE_STATUS = 415;

const bodyParserErrorSchema = zod.object({ status: zod.number().int().min(400).max(499) });

const fromZodError = (error: zod.ZodError) =>
  new AppError(
    400,
    ErrorCode.ValidationError,
    'Invalid request data',
    error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
  );

const fromBodyParserError = (error: unknown): AppError | undefined => {
  const parsed = bodyParserErrorSchema.safeParse(error);
  if (!parsed.success) return undefined;

  const { status } = parsed.data;
  if (status === PAYLOAD_TOO_LARGE_STATUS) {
    return new AppError(status, ErrorCode.PayloadTooLarge, 'Request body is too large');
  }
  if (status === UNSUPPORTED_MEDIA_TYPE_STATUS) {
    return new AppError(status, ErrorCode.UnsupportedMediaType, 'Unsupported request body encoding');
  }
  return new AppError(status, ErrorCode.BadRequest, 'Malformed request body');
};

const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;
  if (error instanceof zod.ZodError) return fromZodError(error);
  return fromBodyParserError(error) ?? new AppError(500, ErrorCode.InternalError, 'Internal server error');
};

export const notFoundHandler: RequestHandler = (request, _response, next) =>
  next(notFound(`Route ${request.method} ${request.path} not found`));

export const errorHandler: ErrorRequestHandler = (error, request, response, _nextMiddleware) => {
  const { status, code, message, details } = toAppError(error);
  if (status >= 500) logger.error(`${request.method} ${request.originalUrl}`, error);

  response.status(status).json({ error: { code, message, details } });
};
