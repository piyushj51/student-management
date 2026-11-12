import { Suspense } from 'react';
import StudentManager from '@/components/students/StudentManager';
import StudentDetailSkeleton from '@/components/students/StudentDetailSkeleton';

export default function StudentsPage() {
  return (
    <Suspense fallback={<StudentDetailSkeleton />}>
      <StudentManager />
    </Suspense>
  );
}
