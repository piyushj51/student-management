import { getDb } from './db';
import {
  GRADES,
  MAJORS,
  STUDENT_STATUSES,
  type DashboardStats,
  type Major,
  type MajorCount,
  type StatusCount,
  type Student,
  type StudentListParams,
  type StudentListResult,
  type StudentSortField,
  type StudentStatus,
} from './types';
import type { StudentInput } from './validation';

interface StudentRow {
  id: number;
  roll_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  grade: string;
  major: string;
  gpa: number;
  status: string;
  enrolled_on: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** Raised when the unique index on `email` or `roll_number` is violated. */
export class DuplicateStudentError extends Error {
  readonly field: 'rollNumber' | 'email';

  constructor(field: 'rollNumber' | 'email') {
    super(
      field === 'email'
        ? 'That email address is already registered to another student'
        : 'That roll number is already assigned to another student',
    );
    this.name = 'DuplicateStudentError';
    this.field = field;
  }
}

const SORT_COLUMNS: Record<StudentSortField, string> = {
  name: 'last_name',
  rollNumber: 'roll_number',
  grade: 'grade',
  major: 'major',
  gpa: 'gpa',
  status: 'status',
  enrolledOn: 'enrolled_on',
  createdAt: 'created_at',
};

function mapRow(row: StudentRow): Student {
  return {
    id: row.id,
    rollNumber: row.roll_number,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    grade: row.grade as Student['grade'],
    major: row.major as Student['major'],
    gpa: Number(row.gpa),
    status: row.status as StudentStatus,
    enrolledOn: row.enrolled_on,
    address: row.address,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Re-throw SQLite constraint failures as a typed, user-friendly error. */
function rethrowConstraint(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('students.email')) throw new DuplicateStudentError('email');
  if (message.includes('students.roll_number')) throw new DuplicateStudentError('rollNumber');
  throw error;
}

export function listStudents(params: StudentListParams): StudentListResult {
  const db = getDb();
  const conditions: string[] = [];
  const args: Record<string, unknown> = {};

  if (params.q) {
    conditions.push(
      `(first_name LIKE @q OR last_name LIKE @q OR (first_name || ' ' || last_name) LIKE @q
        OR roll_number LIKE @q OR email LIKE @q OR major LIKE @q)`,
    );
    args.q = `%${params.q}%`;
  }
  if (params.status) {
    conditions.push('status = @status');
    args.status = params.status;
  }
  if (params.major) {
    conditions.push('major = @major');
    args.major = params.major;
  }
  if (params.grade) {
    conditions.push('grade = @grade');
    args.grade = params.grade;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const column = SORT_COLUMNS[params.sort];
  const direction = params.order === 'asc' ? 'ASC' : 'DESC';
  const secondary = params.sort === 'name' ? `, first_name ${direction}` : '';

  const { count: total } = db
    .prepare(`SELECT COUNT(*) AS count FROM students ${where}`)
    .get(args) as { count: number };

  const rows = db
    .prepare(
      `SELECT * FROM students ${where}
       ORDER BY ${column} ${direction}${secondary}, id ${direction}
       LIMIT @limit OFFSET @offset`,
    )
    .all({
      ...args,
      limit: params.pageSize,
      offset: (params.page - 1) * params.pageSize,
    }) as StudentRow[];

  return {
    rows: rows.map(mapRow),
    total,
    page: params.page,
    pageSize: params.pageSize,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export function getStudentById(id: number): Student | null {
  const row = getDb()
    .prepare('SELECT * FROM students WHERE id = ?')
    .get(id) as StudentRow | undefined;

  return row ? mapRow(row) : null;
}

export function getStudentByEmail(email: string): Student | null {
  const row = getDb()
    .prepare('SELECT * FROM students WHERE lower(email) = lower(?)')
    .get(email) as StudentRow | undefined;

  return row ? mapRow(row) : null;
}

export function createStudent(input: StudentInput): Student {
  const now = new Date().toISOString();
  try {
    const result = getDb()
      .prepare(
        `INSERT INTO students (
           roll_number, first_name, last_name, email, phone, date_of_birth,
           grade, major, gpa, status, enrolled_on, address, notes,
           created_at, updated_at
         ) VALUES (
           @rollNumber, @firstName, @lastName, @email, @phone, @dateOfBirth,
           @grade, @major, @gpa, @status, @enrolledOn, @address, @notes,
           @createdAt, @updatedAt
         )`,
      )
      .run({ ...input, createdAt: now, updatedAt: now });

    const created = getStudentById(Number(result.lastInsertRowid));
    if (!created) throw new Error('Failed to load the newly created student');
    return created;
  } catch (error) {
    rethrowConstraint(error);
  }
}

export function updateStudent(id: number, input: StudentInput): Student | null {
  try {
    const result = getDb()
      .prepare(
        `UPDATE students SET
           roll_number = @rollNumber,
           first_name = @firstName,
           last_name = @lastName,
           email = @email,
           phone = @phone,
           date_of_birth = @dateOfBirth,
           grade = @grade,
           major = @major,
           gpa = @gpa,
           status = @status,
           enrolled_on = @enrolledOn,
           address = @address,
           notes = @notes,
           updated_at = @updatedAt
         WHERE id = @id`,
      )
      .run({ ...input, id, updatedAt: new Date().toISOString() });

    return result.changes === 0 ? null : getStudentById(id);
  } catch (error) {
    rethrowConstraint(error);
  }
}

export function deleteStudent(id: number): boolean {
  const result = getDb().prepare('DELETE FROM students WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getDashboardStats(): DashboardStats {
  const db = getDb();

  const totals = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) AS active,
         COALESCE(SUM(CASE WHEN status = 'graduated' THEN 1 ELSE 0 END), 0) AS graduated,
         COALESCE(SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END), 0) AS suspended,
         COALESCE(SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END), 0) AS withdrawn,
         COALESCE(ROUND(AVG(gpa), 2), 0) AS averageGpa
       FROM students`,
    )
    .get() as {
    total: number;
    active: number;
    graduated: number;
    suspended: number;
    withdrawn: number;
    averageGpa: number;
  };

  const statusRows = db
    .prepare('SELECT status, COUNT(*) AS count FROM students GROUP BY status')
    .all() as { status: StudentStatus; count: number }[];

  const byStatus: StatusCount[] = STUDENT_STATUSES.map((status) => ({
    status,
    count: statusRows.find((row) => row.status === status)?.count ?? 0,
  }));

  const majorRows = db
    .prepare('SELECT major, COUNT(*) AS count FROM students GROUP BY major')
    .all() as { major: Major; count: number }[];

  const byMajor: MajorCount[] = MAJORS.map((major) => ({
    major,
    count: majorRows.find((row) => row.major === major)?.count ?? 0,
  })).sort((a, b) => b.count - a.count);

  const topPerformers = db
    .prepare(
      `SELECT * FROM students
       WHERE status = 'active'
       ORDER BY gpa DESC, last_name ASC
       LIMIT 5`,
    )
    .all() as StudentRow[];

  const recentEnrollments = db
    .prepare('SELECT * FROM students ORDER BY created_at DESC, id DESC LIMIT 5')
    .all() as StudentRow[];

  return {
    ...totals,
    averageGpa: Number(totals.averageGpa),
    byStatus,
    byMajor,
    topPerformers: topPerformers.map(mapRow),
    recentEnrollments: recentEnrollments.map(mapRow),
  };
}

export const REFERENCE_DATA = { grades: GRADES, majors: MAJORS, statuses: STUDENT_STATUSES };
