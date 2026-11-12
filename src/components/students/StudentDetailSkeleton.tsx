'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Link from '../Link';

export function StudentNotFound() {
  return (
    <Stack spacing={2}>
      <Button component={Link} href="/students" startIcon={<ArrowBackIcon />} color="inherit">
        Back to students
      </Button>
      <Card>
        <CardContent sx={{ py: 6 }}>
          <Stack sx={{ alignItems: 'center', textAlign: 'center' }} spacing={1}>
            <Skeleton variant="circular" width={72} height={72} />
            <Skeleton width={220} height={36} />
            <Skeleton width={280} height={24} />
            <Button
              component={Link}
              href="/students"
              variant="contained"
              sx={{ mt: 2 }}
            >
              Go back to the list
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default function StudentDetailSkeleton() {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Button component={Link} href="/students" startIcon={<ArrowBackIcon />} color="inherit">
          Back
        </Button>
        <Skeleton variant="rounded" width={160} height={40} />
        <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
          <Skeleton width={240} height={34} />
          <Skeleton width={160} height={20} />
        </Stack>
        <Skeleton variant="rounded" width={92} height={40} />
        <Skeleton variant="rounded" width={108} height={40} />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardHeader title={<Skeleton width={180} />} />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((key) => (
                  <Grid key={key} size={{ xs: 12, sm: key === 8 ? 12 : 6 }}>
                    <Skeleton height={60} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardHeader title={<Skeleton width={160} />} />
            <Divider />
            <CardContent>
              <Stack spacing={2}>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={80} />
                <Skeleton height={60} />
                <Skeleton height={60} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
