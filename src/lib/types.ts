/**
 * Shared domain types for the student management system.
 * These types are imported by both the server (route handlers, data layer)
 * and the client (MUI components).
 */

export const STUDENT_STATUSES = [
  'active',
  'graduated',
  'suspended',
  'withdrawn',
] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const MAJORS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Biology',
  'Business Administration',
  'Psychology',
  'Mechanical Engineering',
  'Economics',
] as const;

export type Major = (typeof MAJORS)[number];

export const GRADES = ['Freshman', 'Sophomore', 'Junior', 'Senior'] as const;

export type Grade = (typeof GRADES)[number];

export const STUDENT_SORT_FIELDS = [
  'name',
  'rollNumber',
  'grade',
  'major',
  'gpa',
  'status',
  'enrolledOn',
  'createdAt',
] as const;

export type StudentSortField = (typeof STUDENT_SORT_FIELDS)[number];

export type SortOrder = 'asc' | 'desc';

/** A student as returned by the API. */
export interface Student {
  id: number;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  grade: Grade;
  major: Major;
  gpa: number;
  status: StudentStatus;
  enrolledOn: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentListParams {
  q?: string;
  status?: StudentStatus;
  major?: Major;
  grade?: Grade;
  sort: StudentSortField;
  order: SortOrder;
  page: number;
  pageSize: number;
}

export interface StudentListResult {
  rows: Student[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface StatusCount {
  status: StudentStatus;
  count: number;
}

export interface MajorCount {
  major: Major;
  count: number;
}

export interface DashboardStats {
  total: number;
  active: number;
  graduated: number;
  suspended: number;
  withdrawn: number;
  averageGpa: number;
  byStatus: StatusCount[];
  byMajor: MajorCount[];
  topPerformers: Student[];
  recentEnrollments: Student[];
}

export interface ApiFieldError {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  error: string;
  details?: ApiFieldError[];
}
