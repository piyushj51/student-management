'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid';
import { apiRequest, isApiRequestError } from '@/lib/api-client';
import { STATUS_META, formatDate, fullName, initials } from '@/lib/format';
import {
  GRADES,
  MAJORS,
  STUDENT_STATUSES,
  type Student,
  type StudentListResult,
  type StudentStatus,
} from '@/lib/types';
import ConfirmDialog from './ConfirmDialog';
import StudentFormDialog from './StudentFormDialog';
import { GpaChip, StatusChip } from './StudentChips';
import PageHeader from '../PageHeader';

const DEFAULT_SORT: GridSortModel = [{ field: 'createdAt', sort: 'desc' }];

const SORTABLE_FIELDS = new Set(['name', 'grade', 'major', 'gpa', 'status', 'createdAt']);

function isStudentStatus(value: string | null): value is StudentStatus {
  return value !== null && STUDENT_STATUSES.includes(value as StudentStatus);
}

export default function StudentManager() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<StudentStatus | ''>(() => {
    const initial = searchParams.get('status');
    return isStudentStatus(initial) ? initial : '';
  });
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState('');

  const [sortModel, setSortModel] = useState<GridSortModel>(DEFAULT_SORT);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [result, setResult] = useState<StudentListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  // Debounce the free text search so typing does not hammer the API.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timeout);
  }, [query]);

  // Any filter change goes back to the first page. Reconciling during render
  // avoids an extra effect-driven render pass.
  const filtersKey = `${debouncedQuery}|${status}|${major}|${grade}`;
  const [appliedFiltersKey, setAppliedFiltersKey] = useState(filtersKey);
  if (appliedFiltersKey !== filtersKey) {
    setAppliedFiltersKey(filtersKey);
    if (paginationModel.page !== 0) {
      setPaginationModel((previous) => ({ ...previous, page: 0 }));
    }
  }

  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (status) params.set('status', status);
      if (major) params.set('major', major);
      if (grade) params.set('grade', grade);
      params.set('page', String(paginationModel.page + 1));
      params.set('pageSize', String(paginationModel.pageSize));

      const activeSort = sortModel[0];
      if (activeSort && SORTABLE_FIELDS.has(activeSort.field)) {
        params.set('sort', activeSort.field);
        params.set('order', activeSort.sort === 'asc' ? 'asc' : 'desc');
      } else {
        params.set('sort', 'createdAt');
        params.set('order', 'desc');
      }

      try {
        const data = await apiRequest<StudentListResult>(`/api/students?${params}`, {
          signal: controller.signal,
        });
        if (active) setResult(data);
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        setError(
          isApiRequestError(requestError)
            ? requestError.message
            : 'Could not load the student list.',
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
  }, [debouncedQuery, status, major, grade, sortModel, paginationModel, reloadKey]);

  const hasFilters = Boolean(debouncedQuery || status || major || grade);

  const clearFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setStatus('');
    setMajor('');
    setGrade('');
  };

  const columns = useMemo<GridColDef<Student>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Student',
        flex: 1.1,
        minWidth: 230,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', height: '100%' }}>
            <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: 'primary.main' }}>
              {initials(row)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {fullName(row)}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {row.rollNumber}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        field: 'email',
        headerName: 'Contact',
        flex: 1,
        minWidth: 220,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {row.email}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.phone}
            </Typography>
          </Box>
        ),
      },
      { field: 'grade', headerName: 'Grade', width: 130 },
      { field: 'major', headerName: 'Major', width: 200 },
      {
        field: 'gpa',
        headerName: 'GPA',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => <GpaChip gpa={row.gpa} />,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 140,
        renderCell: ({ row }) => <StatusChip status={row.status} />,
      },
      {
        field: 'createdAt',
        headerName: 'Added',
        width: 130,
        renderCell: ({ row }) => (
          <Typography variant="body2" color="text.secondary">
            {formatDate(row.createdAt)}
          </Typography>
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
            <Tooltip title="Edit student">
              <IconButton
                size="small"
                aria-label={`Edit ${fullName(row)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingStudent(row);
                  setFormOpen(true);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete student">
              <IconButton
                size="small"
                color="error"
                aria-label={`Delete ${fullName(row)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setPendingDelete(row);
                  setDeleteError(null);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [],
  );

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await apiRequest<{ id: number }>(`/api/students/${pendingDelete.id}`, {
        method: 'DELETE',
      });
      setSnackbar({
        message: `${fullName(pendingDelete)} was removed from the register.`,
        severity: 'success',
      });
      const wasLastRow = (result?.rows.length ?? 1) === 1;
      setPendingDelete(null);
      if (wasLastRow && paginationModel.page > 0) {
        setPaginationModel((previous) => ({ ...previous, page: previous.page - 1 }));
      } else {
        reload();
      }
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

  const total = result?.total ?? 0;
  const firstRow = total === 0 ? 0 : paginationModel.page * paginationModel.pageSize + 1;
  const lastRow = Math.min(total, firstRow + (result?.rows.length ?? 0) - 1);

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${total} ${total === 1 ? 'student' : 'students'} in the register`}
        action={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Reload">
              <span>
                <IconButton onClick={reload} disabled={loading} aria-label="Reload students">
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingStudent(null);
                setFormOpen(true);
              }}
            >
              Add student
            </Button>
          </Stack>
        }
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 2, alignItems: { md: 'center' } }}
      >
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, roll number, email or major"
          size="small"
          sx={{ flexGrow: 1, minWidth: { md: 280 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as StudentStatus | '')}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {STUDENT_STATUSES.map((value) => (
            <MenuItem key={value} value={value}>
              {STATUS_META[value].label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Grade"
          value={grade}
          onChange={(event) => setGrade(event.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All grades</MenuItem>
          {GRADES.map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Major"
          value={major}
          onChange={(event) => setMajor(event.target.value)}
          sx={{ minWidth: 190 }}
        >
          <MenuItem value="">All majors</MenuItem>
          {MAJORS.map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
        <Button
          onClick={clearFilters}
          color="inherit"
          startIcon={<FilterAltOffOutlinedIcon />}
          disabled={!hasFilters}
        >
          Clear
        </Button>
      </Stack>

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={reload}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <DataGrid
          rows={result?.rows ?? []}
          columns={columns}
          loading={loading}
          rowCount={total}
          pagination
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25, 50]}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          disableColumnFilter
          disableColumnMenu
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          rowHeight={64}
          height={600}
          onRowClick={({ row }) => router.push(`/students/${row.id}`)}
          slotProps={{
            loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' },
          }}
          slots={{
            noRowsOverlay: () => (
              <Stack sx={{ alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  No students found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {hasFilters
                    ? 'Try adjusting or clearing the filters.'
                    : 'Add your first student to get started.'}
                </Typography>
              </Stack>
            ),
          }}
          sx={{ borderRadius: 3 }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        {total === 0
          ? 'No records to display'
          : `Showing ${firstRow}–${lastRow} of ${total} students`}
      </Typography>

      <StudentFormDialog
        open={formOpen}
        student={editingStudent}
        onClose={() => setFormOpen(false)}
        onSaved={(student, created) => {
          setFormOpen(false);
          setSnackbar({
            message: created
              ? `${fullName(student)} was added to the register.`
              : `${fullName(student)} was updated.`,
            severity: 'success',
          });
          if (created) {
            setPaginationModel((previous) => ({ ...previous, page: 0 }));
            setSortModel(DEFAULT_SORT);
          }
          reload();
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete student"
        description={
          pendingDelete ? (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                This permanently removes <strong>{fullName(pendingDelete)}</strong> (
                {pendingDelete.rollNumber}) from the register.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This action cannot be undone.
              </Typography>
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Delete"
        loading={deleting}
        error={deleteError}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />

      <Snackbar
        open={snackbar !== null}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar?.severity ?? 'success'}
          variant="filled"
          onClose={() => setSnackbar(null)}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
