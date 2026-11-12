'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import { apiRequest, isApiRequestError } from '@/lib/api-client';
import {
  formatDate,
  formatGpa,
  fullName,
  gpaColor,
  initials,
  STATUS_META,
} from '@/lib/format';
import type { Student } from '@/lib/types';
import ConfirmDialog from './ConfirmDialog';
import StudentFormDialog from './StudentFormDialog';
import { GpaChip, StatusChip } from './StudentChips';
import { StudentNotFound } from './StudentDetailSkeleton';
import Link from '../Link';

interface StudentDetailClientProps {
  studentId: number | null;
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function StudentDetailClient({ studentId }: StudentDetailClientProps) {
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(studentId !== null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [updatedMessage, setUpdatedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (studentId === null) return;
    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<Student>(`/api/students/${studentId}`, {
          signal: controller.signal,
        });
        if (active) setStudent(data);
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        setError(
          isApiRequestError(requestError)
            ? requestError.message
            : 'Could not load the student record.',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [studentId, reloadKey]);

  if (studentId === null) return <StudentNotFound />;

  if (loading && !student) {
    return (
      <Stack sx={{ alignItems: 'center', py: 6 }} spacing={2}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading student details...
        </Typography>
      </Stack>
    );
  }

  if (!student) {
    if (error?.toLowerCase().includes('not found')) return <StudentNotFound />;
    return (
      <Stack spacing={2}>
        <Button component={Link} href="/students" startIcon={<ArrowBackIcon />} color="inherit">
          Back to students
        </Button>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setReloadKey((k) => k + 1)}>
              Retry
            </Button>
          }
        >
          {error ?? 'Student not found.'}
        </Alert>
      </Stack>
    );
  }

  const record = student;
  const enrolledDate = new Date(record.enrolledOn);
  const now = new Date();
  const yearsEnrolled = Math.max(0, (now.getTime() - enrolledDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const gpa = record.gpa;
  const progress = Math.max(0, Math.min(100, (gpa / 4) * 100));
  const gpaTone = gpaColor(gpa);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiRequest<{ id: number }>(`/api/students/${record.id}`, {
        method: 'DELETE',
      });
      router.push('/students');
    } catch (requestError) {
      setDeleteError(
        isApiRequestError(requestError)
          ? requestError.message
          : 'Could not delete this student.',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Stack spacing={3}>
      {updatedMessage ? (
        <Alert
          severity="success"
          onClose={() => setUpdatedMessage(null)}
          action={
            <Button color="inherit" size="small" onClick={() => setUpdatedMessage(null)}>
              Dismiss
            </Button>
          }
        >
          {updatedMessage}
        </Alert>
      ) : null}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'flex-start', md: 'center' } }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexGrow: 1 }}>
          <Button component={Link} href="/students" startIcon={<ArrowBackIcon />} color="inherit">
            Back
          </Button>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            {initials(student)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" noWrap>
              {fullName(student)}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {student.rollNumber} • {student.email}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Tooltip title="Refresh">
            <IconButton
              aria-label="Refresh"
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setFormOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              setDeleteError(null);
              setPendingDelete(true);
            }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Student profile" subheader="Personal and enrollment details" />
            <Divider />
            <CardContent>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <LabelValue label="First name" value={student.firstName} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <LabelValue label="Last name" value={student.lastName} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <LabelValue label="Email" value={student.email} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <LabelValue label="Phone" value={student.phone || '—'} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <LabelValue label="Date of birth" value={formatDate(student.dateOfBirth)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <LabelValue label="Enrolled on" value={formatDate(student.enrolledOn)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <LabelValue label="Grade" value={student.grade} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <LabelValue label="Major" value={student.major} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <LabelValue label="Status" value={STATUS_META[student.status].label} />
                </Grid>
                <Grid size={12}>
                  <LabelValue label="Address" value={student.address || '—'} />
                </Grid>
                <Grid size={12}>
                  <LabelValue label="Notes" value={student.notes || '—'} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Academic standing" subheader="Performance and account timeline" />
            <Divider />
            <CardContent>
              <Stack spacing={2.5}>
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      GPA
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <GpaChip gpa={gpa} />
                      <StatusChip status={student.status} />
                    </Stack>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color={gpaTone}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {formatGpa(gpa)} / 4.00
                  </Typography>
                </Box>

                <List disablePadding>
                  <ListItem disablePadding>
                    <ListItemText
                      primary={yearsEnrolled.toFixed(1)}
                      secondary="Years enrolled"
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText
                      primary={student.grade}
                      secondary="Current year level"
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemText
                      primary={STATUS_META[student.status].label}
                      secondary="Enrollment status"
                    />
                  </ListItem>
                </List>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Added on
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDate(student.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last updated
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDate(student.updatedAt)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <StudentFormDialog
        open={formOpen}
        student={student}
        onClose={() => setFormOpen(false)}
        onSaved={(saved) => {
          setFormOpen(false);
          setUpdatedMessage(`${fullName(saved)} was updated successfully.`);
          setReloadKey((k) => k + 1);
        }}
      />

      <ConfirmDialog
        open={pendingDelete}
        title="Delete student"
        description={
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              This permanently removes <strong>{fullName(student)}</strong> (
              {student.rollNumber}) from the register.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone.
            </Typography>
          </>
        }
        confirmLabel="Delete"
        loading={deleting}
        error={deleteError}
        onCancel={() => setPendingDelete(false)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
