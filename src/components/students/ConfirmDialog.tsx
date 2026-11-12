'use client';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Alert from '@mui/material/Alert';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  error = null,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <DialogContentText component="div">{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading} color="inherit">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
