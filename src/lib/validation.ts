import { z } from 'zod';
import { GRADES, MAJORS, STUDENT_SORT_FIELDS, STUDENT_STATUSES } from './types';

/** Payload accepted by `POST /api/students` and `PUT /api/students/:id`. */
export const studentInputSchema = z.object({
  rollNumber: z
    .string()
    .trim()
    .min(3, 'Roll number must be at least 3 characters long')
    .max(20, 'Roll number must be 20 characters or fewer')
    .regex(/^[A-Za-z0-9-]+$/, 'Use letters, numbers and dashes only'),
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email: z.email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-.\s]{7,25}$/, 'Enter a valid phone number'),
  dateOfBirth: z.iso.date({ error: 'Use the YYYY-MM-DD format' }),
  grade: z.enum(GRADES, { error: 'Select a grade' }),
  major: z.enum(MAJORS, { error: 'Select a major' }),
  gpa: z.coerce
    .number({ error: 'GPA must be a number' })
    .min(0, 'GPA cannot be negative')
    .max(4, 'GPA cannot be greater than 4'),
  status: z.enum(STUDENT_STATUSES, { error: 'Select a status' }),
  enrolledOn: z.iso.date({ error: 'Use the YYYY-MM-DD format' }),
  address: z.string().trim().max(200, 'Address is too long').default(''),
  notes: z.string().trim().max(500, 'Notes are too long').default(''),
});

export type StudentInput = z.infer<typeof studentInputSchema>;

/** Query string accepted by `GET /api/students`. */
export const studentListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(STUDENT_STATUSES).optional(),
  major: z.enum(MAJORS).optional(),
  grade: z.enum(GRADES).optional(),
  sort: z.enum(STUDENT_SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type StudentListQuery = z.infer<typeof studentListQuerySchema>;

/** Turn a Zod error into the flat `{ path, message }` list the API returns. */
export function fieldErrors(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

/** Turn a Zod error into a `{ path: message }` map for form components. */
export function fieldErrorMap(error: z.ZodError): Record<string, string> {
  return fieldErrors(error).reduce<Record<string, string>>((acc, issue) => {
    if (!acc[issue.path]) acc[issue.path] = issue.message;
    return acc;
  }, {});
}
