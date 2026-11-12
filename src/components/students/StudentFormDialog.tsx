'use client';

import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { apiRequest, isApiRequestError } from '@/lib/api-client';
import { STATUS_META } from '@/lib/format';
import {
  GRADES,
  MAJORS,
  STUDENT_STATUSES,
  type Student,
} from '@/lib/types';
import {
  fieldErrorMap,
  studentInputSchema,
  type StudentInput,
} from '@/lib/validation';

interface StudentFormDialogProps {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onSaved: (student: Student, created: boolean) => void;
}

/** Every form control is a string; Zod coerces and trims on submit. */
type FormState = Record<keyof StudentInput, string>;

const FORM_ID = 'student-form';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): FormState {
  return {
    rollNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    grade: GRADES[0],
    major: MAJORS[0],
    gpa: '0',
    status: 'active',
    enrolledOn: today(),
    address: '',
    notes: '',
  };
}

function toFormState(student: Student): FormState {
  return {
    rollNumber: student.rollNumber,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    phone: student.phone,
    dateOfBirth: student.dateOfBirth,
    grade: student.grade,
    major: student.major,
    gpa: String(student.gpa),
    status: student.status,
    enrolledOn: student.enrolledOn,
    address: student.address,
    notes: student.notes,
  };
}

export default function StudentFormDialog({
  open,
  student,
  onClose,
  onSaved,
}: StudentFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-seed the form during render whenever the dialog opens (or switches to a
  // different student) instead of resetting state from inside an effect.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const formKey = open ? `open:${student?.id ?? 'new'}` : 'closed';

  if (loadedFor !== formKey) {
    setLoadedFor(formKey);
    if (open) {
      setForm(student ? toFormState(student) : emptyForm());
      setErrors({});
      setFormError(null);
      setSaving(false);
    }
  }

  const update =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((previous) => ({ ...previous, [field]: value }));
    };

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setFormError(null);

    const parsed = studentInputSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrorMap(parsed.error));
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const payload = JSON.stringify(parsed.data);
      const saved = student
        ? await apiRequest<Student>(`/api/students/${student.id}`, {
            method: 'PUT',
            body: payload,
          })
        : await apiRequest<Student>('/api/students', { method: 'POST', body: payload });

      onSaved(saved, !student);
    } catch (error) {
      if (isApiRequestError(error)) {
        const fieldMap = error.fieldErrors;
        setErrors(fieldMap);
        setFormError(Object.keys(fieldMap).length > 0 ? error.message : error.message);
      } else {
        setFormError('Something went wrong while saving. Please try again.');
      }
      setSaving(false);
    }
  }

  return (
      <Dialog
        open={open}
        onClose={saving ? undefined : onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {student ? `Edit ${student.firstName} ${student.lastName}` : 'Add a student'}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id={FORM_ID} onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Roll number"
                value={form.rollNumber}
                onChange={update('rollNumber')}
                error={Boolean(errors.rollNumber)}
                helperText={errors.rollNumber ?? 'For example STU-2026-0001'}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={update('email')}
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="First name"
                value={form.firstName}
                onChange={update('firstName')}
                error={Boolean(errors.firstName)}
                helperText={errors.firstName}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Last name"
                value={form.lastName}
                onChange={update('lastName')}
                error={Boolean(errors.lastName)}
                helperText={errors.lastName}
                required
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Phone"
                value={form.phone}
                onChange={update('phone')}
                error={Boolean(errors.phone)}
                helperText={errors.phone ?? '+1 (555) 123-4567'}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date of birth"
                type="date"
                value={form.dateOfBirth}
                onChange={update('dateOfBirth')}
                error={Boolean(errors.dateOfBirth)}
                helperText={errors.dateOfBirth}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                label="Grade"
                value={form.grade}
                onChange={update('grade')}
                error={Boolean(errors.grade)}
                helperText={errors.grade}
                fullWidth
              >
                {GRADES.map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    {grade}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                label="Major"
                value={form.major}
                onChange={update('major')}
                error={Boolean(errors.major)}
                helperText={errors.major}
                fullWidth
              >
                {MAJORS.map((major) => (
                  <MenuItem key={major} value={major}>
                    {major}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={update('status')}
                error={Boolean(errors.status)}
                helperText={errors.status}
                fullWidth
              >
                {STUDENT_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {STATUS_META[status].label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="GPA"
                type="number"
                value={form.gpa}
                onChange={update('gpa')}
                error={Boolean(errors.gpa)}
                helperText={errors.gpa ?? 'Between 0.00 and 4.00'}
                slotProps={{ htmlInput: { step: 0.01, min: 0, max: 4 } }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Enrolled on"
                type="date"
                value={form.enrolledOn}
                onChange={update('enrolledOn')}
                error={Boolean(errors.enrolledOn)}
                helperText={errors.enrolledOn}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Address"
                value={form.address}
                onChange={update('address')}
                error={Boolean(errors.address)}
                helperText={errors.address}
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Notes"
                value={form.notes}
                onChange={update('notes')}
                error={Boolean(errors.notes)}
                helperText={errors.notes}
                multiline
                minRows={2}
                fullWidth
              />
            </Grid>
          </Grid>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {student ? 'Save changes' : 'Create student'}
          </Button>
        </DialogActions>
      </Dialog>
  );
}
