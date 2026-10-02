import * as zod from 'zod';
import { ApiError, ApiErrorCode } from './ApiError';

type QueryValue = string | number | undefined;

type QueryParameters = Record<string, QueryValue>;

interface RequestOptions {
  query?: QueryParameters;
  signal?: AbortSignal;
}

const errorBodySchema = zod.object({
  error: zod.object({
    code: zod.string(),
    message: zod.string(),
  }),
});

const isAbortError = (error: unknown): boolean => error instanceof DOMException && error.name === 'AbortError';

const toQueryString = (query: QueryParameters = {}): string => {
  const search = new URLSearchParams(
    Object.entries(query).flatMap(([key, value]) =>
      value === undefined || value === '' ? [] : [[key, String(value)]],
    ),
  ).toString();
  return search ? `?${search}` : '';
};

export abstract class BaseApiClient {
  protected constructor(private readonly baseUrl: string) {}

  protected async get<T>(path: string, schema: zod.ZodType<T>, options: RequestOptions = {}): Promise<T> {
    const response = await this.send(path, { method: 'GET' }, options);
    return this.parse(response, schema);
  }

  protected async post<T>(path: string, body: unknown, schema: zod.ZodType<T>): Promise<T> {
    const response = await this.send(path, { method: 'POST', body: JSON.stringify(body) });
    return this.parse(response, schema);
  }

  protected async delete(path: string): Promise<void> {
    await this.send(path, { method: 'DELETE' });
  }

  private async send(path: string, init: RequestInit, { query, signal }: RequestOptions = {}): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${path}${toQueryString(query)}`, {
      ...init,
      signal,
      headers: { 'Content-Type': 'application/json' },
    }).catch((error: unknown) => {
      if (isAbortError(error)) throw error;
      throw new ApiError(0, ApiErrorCode.NetworkError, 'Cannot reach the server. Check your connection and try again.');
    });

    if (!response.ok) throw await this.toError(response);
    return response;
  }

  private async parse<T>(response: Response, schema: zod.ZodType<T>): Promise<T> {
    const result = schema.safeParse(await this.readJson(response));
    if (!result.success) {
      throw new ApiError(response.status, ApiErrorCode.InvalidResponse, 'Unexpected response from the server');
    }
    return result.data;
  }

  private async toError(response: Response): Promise<ApiError> {
    const body = errorBodySchema.safeParse(await this.readJson(response));
    return body.success
      ? new ApiError(response.status, body.data.error.code, body.data.error.message)
      : new ApiError(response.status, ApiErrorCode.HttpError, `Request failed with status ${response.status}`);
  }

  private readJson(response: Response): Promise<unknown> {
    return response.json().catch(() => undefined);
  }
}
