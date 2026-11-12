import { connection } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  errorResponse,
  jsonResponse,
  parseId,
  readJsonBody,
} from '@/lib/http';
import {
  DuplicateStudentError,
  deleteStudent,
  getStudentById,
  updateStudent,
} from '@/lib/students';
import { fieldErrors, studentInputSchema } from '@/lib/validation';

/** GET /api/students/:id */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await connection();

  const { id } = await context.params;
  const studentId = parseId(id);
  if (studentId === null) {
    return errorResponse('Student id must be a positive integer', 400);
  }

  const student = getStudentById(studentId);
  if (!student) return errorResponse('Student not found', 404);

  return jsonResponse(student);
}

/** PUT /api/students/:id — full replace of the student record. */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const studentId = parseId(id);
  if (studentId === null) {
    return errorResponse('Student id must be a positive integer', 400);
  }

  const body = await readJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = studentInputSchema.safeParse(body.value);
  if (!parsed.success) {
    return errorResponse('Validation failed', 422, fieldErrors(parsed.error));
  }

  try {
    const student = updateStudent(studentId, parsed.data);
    if (!student) return errorResponse('Student not found', 404);
    return jsonResponse(student);
  } catch (error) {
    if (error instanceof DuplicateStudentError) {
      return errorResponse(error.message, 409, [
        { path: error.field, message: error.message },
      ]);
    }
    throw error;
  }
}

/** DELETE /api/students/:id */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const studentId = parseId(id);
  if (studentId === null) {
    return errorResponse('Student id must be a positive integer', 400);
  }

  if (!deleteStudent(studentId)) {
    return errorResponse('Student not found', 404);
  }

  return jsonResponse({ id: studentId, deleted: true });
}
