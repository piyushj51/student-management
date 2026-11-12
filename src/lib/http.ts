import type { ApiErrorBody, ApiFieldError } from './types';

/** JSON response that browsers should never cache (student data is live). */
export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', 'no-store');

  return Response.json(data, { ...init, headers });
}

export function errorResponse(
  error: string,
  status: number,
  details?: ApiFieldError[],
): Response {
  const body: ApiErrorBody = details && details.length > 0 ? { error, details } : { error };
  return jsonResponse(body, { status });
}

/** Read a JSON request body without throwing on malformed input. */
export async function readJsonBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return {
      ok: false,
      response: errorResponse('Request body must be valid JSON', 400),
    };
  }
}

/** Parse a positive integer route parameter. */
export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
