export enum ApiErrorCode {
  NetworkError = 'NETWORK_ERROR',
  InvalidResponse = 'INVALID_RESPONSE',
  HttpError = 'HTTP_ERROR',
  Unprocessable = 'UNPROCESSABLE',
  Unknown = 'UNKNOWN',
}

const RETRYABLE_CLIENT_STATUSES: ReadonlySet<number> = new Set([408, 429]);
const FIRST_SERVER_ERROR_STATUS = 500;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isRetryable(): boolean {
    return (
      this.code === ApiErrorCode.NetworkError ||
      RETRYABLE_CLIENT_STATUSES.has(this.status) ||
      this.status >= FIRST_SERVER_ERROR_STATUS
    );
  }
}

export const toApiError = (error: unknown): ApiError =>
  error instanceof ApiError ? error : new ApiError(0, ApiErrorCode.Unknown, 'Something went wrong');
