import { Suspense } from 'react';
import StudentDetailClient from '@/components/students/StudentDetailClient';
import StudentDetailSkeleton from '@/components/students/StudentDetailSkeleton';
import { parseId } from '@/lib/http';

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

async function StudentDetailSection({ params }: StudentDetailPageProps) {
  const { id } = await params;
  const studentId = parseId(id);
  return <StudentDetailClient studentId={studentId} />;
}

export default function StudentDetailPage({ params }: StudentDetailPageProps) {
  return (
    <Suspense fallback={<StudentDetailSkeleton />}>
      <StudentDetailSection params={params} />
    </Suspense>
  );
}
