import type { ApiErrorBody, ApiFieldError } from './types';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly details: ApiFieldError[];

  constructor(message: string, status: number, details: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }

  /** Field level messages keyed by dot path, ready for form components. */
  get fieldErrors(): Record<string, string> {
    return this.details.reduce<Record<string, string>>((acc, detail) => {
      if (!acc[detail.path]) acc[detail.path] = detail.message;
      return acc;
    }, {});
  }
}

/** Small `fetch` wrapper used by every client component. */
export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  const text = await response.text();
  const body = text.length > 0 ? (JSON.parse(text) as T | ApiErrorBody) : null;

  if (!response.ok) {
    const errorBody = (body ?? {}) as ApiErrorBody;
    throw new ApiRequestError(
      errorBody.error ?? `Request failed with status ${response.status}`,
      response.status,
      errorBody.details ?? [],
    );
  }

  return body as T;
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}
