'use client';

import { useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import Link from '@/components/Link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <CardContent sx={{ py: 6 }}>
        <Stack sx={{ alignItems: 'center', textAlign: 'center' }} spacing={2}>
          <Typography variant="h5">Something went wrong</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
            An unexpected error occurred while rendering this page. You can retry or go
            back to the dashboard.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={reset}>
              Try again
            </Button>
            <Button component={Link} href="/" color="inherit">
              Go to dashboard
            </Button>
          </Stack>
          {error.digest ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Error ID: {error.digest}
            </Alert>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
