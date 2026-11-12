'use client';

import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';
import { STATUS_META, formatGpa, gpaColor } from '@/lib/format';
import type { StudentStatus } from '@/lib/types';

export function StatusChip({ status }: { status: StudentStatus }) {
  const meta = STATUS_META[status];

  return <Chip size="small" label={meta.label} color={meta.color as ChipProps['color']} />;
}

export function GpaChip({ gpa }: { gpa: number }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={gpaColor(gpa) as ChipProps['color']}
      label={formatGpa(gpa)}
    />
  );
}
