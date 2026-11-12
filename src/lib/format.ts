import type { Student, StudentStatus } from './types';

export function fullName(student: Pick<Student, 'firstName' | 'lastName'>): string {
  return `${student.firstName} ${student.lastName}`;
}

export function initials(student: Pick<Student, 'firstName' | 'lastName'>): string {
  return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatGpa(gpa: number): string {
  return gpa.toFixed(2);
}

export function gpaColor(gpa: number): 'success' | 'warning' | 'error' {
  if (gpa >= 3.5) return 'success';
  if (gpa >= 2.5) return 'warning';
  return 'error';
}

export const STATUS_META: Record<
  StudentStatus,
  { label: string; color: 'success' | 'info' | 'warning' | 'error' }
> = {
  active: { label: 'Active', color: 'success' },
  graduated: { label: 'Graduated', color: 'info' },
  suspended: { label: 'Suspended', color: 'warning' },
  withdrawn: { label: 'Withdrawn', color: 'error' },
};

export function statusLabel(status: StudentStatus): string {
  return STATUS_META[status].label;
}

/** Titles from a signed in user — kept as a stub for a future auth layer. */
export const CURRENT_USER = { name: 'Admin User', role: 'Registrar' };
