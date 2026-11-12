import { connection } from 'next/server';
import type { NextRequest } from 'next/server';
import { errorResponse, jsonResponse, readJsonBody } from '@/lib/http';
import {
  DuplicateStudentError,
  createStudent,
  listStudents,
} from '@/lib/students';
import {
  fieldErrors,
  studentInputSchema,
  studentListQuerySchema,
} from '@/lib/validation';

/**
 * GET /api/students
 *
 * Supports free text search, field filters, server side sorting and
 * pagination: `?q=&status=&major=&grade=&sort=&order=&page=&pageSize=`
 */
export async function GET(request: NextRequest) {
  // Cache Components would otherwise prerender this handler at build time and
  // bake the seed data into a static response — student data is live.
  await connection();

  const raw: Record<string, string> = {};
  for (const [key, value] of request.nextUrl.searchParams) {
    if (value !== '') raw[key] = value;
  }

  const parsed = studentListQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse('Invalid query parameters', 400, fieldErrors(parsed.error));
  }

  return jsonResponse(listStudents(parsed.data));
}

/** POST /api/students — create a student. */
export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = studentInputSchema.safeParse(body.value);
  if (!parsed.success) {
    return errorResponse('Validation failed', 422, fieldErrors(parsed.error));
  }

  try {
    return jsonResponse(createStudent(parsed.data), { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateStudentError) {
      return errorResponse(error.message, 409, [
        { path: error.field, message: error.message },
      ]);
    }
    throw error;
  }
}
