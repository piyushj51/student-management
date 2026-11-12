'use client';

import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import { apiRequest, isApiRequestError } from '@/lib/api-client';
import { STATUS_META, formatDate, formatGpa, fullName, initials } from '@/lib/format';
import type { DashboardStats, StudentStatus } from '@/lib/types';
import Link from '../Link';
import PageHeader from '../PageHeader';
import { GpaChip } from '../students/StudentChips';

const STATUS_COLORS: Record<StudentStatus, string> = {
  active: '#2e7d32',
  graduated: '#0288d1',
  suspended: '#ed6c02',
  withdrawn: '#d32f2f',
};

interface StatCardProps {
  label: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}

function StatCard({ label, value, caption, icon, color, loading }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: `${color}1a`, color, width: 48, height: 48 }}>{icon}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={70} height={36} />
            ) : (
              <Typography variant="h5">{value}</Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title={<Skeleton width={180} />} />
      <CardContent>
        <Skeleton variant="rounded" height={280} />
      </CardContent>
    </Card>
  );
}

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiRequest<DashboardStats>('/api/stats', {
          signal: controller.signal,
        });
        if (active) setStats(data);
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        setError(
          isApiRequestError(requestError)
            ? requestError.message
            : 'Could not load the dashboard statistics.',
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
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of the student body, performance and enrollment activity."
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refresh}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button component={Link} href="/students" variant="contained">
              Manage students
            </Button>
          </Stack>
        }
      />

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={refresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Total students"
            value={String(stats?.total ?? 0)}
            caption="All records in the register"
            icon={<GroupsOutlinedIcon />}
            color="#4f46e5"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Currently active"
            value={String(stats?.active ?? 0)}
            caption={`${stats?.suspended ?? 0} suspended`}
            icon={<SchoolOutlinedIcon />}
            color="#2e7d32"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Average GPA"
            value={stats ? formatGpa(stats.averageGpa) : '0.00'}
            caption="Across every student"
            icon={<TrendingUpOutlinedIcon />}
            color="#ed6c02"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Graduated"
            value={String(stats?.graduated ?? 0)}
            caption={`${stats?.withdrawn ?? 0} withdrawn`}
            icon={<WorkspacePremiumOutlinedIcon />}
            color="#0288d1"
            loading={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          {loading || !stats ? (
            <ChartCardSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Students by major"
                subheader="Distribution of the register across departments"
              />
              <CardContent>
                <BarChart
                  height={320}
                  grid={{ horizontal: true }}
                  hideLegend
                  margin={{ bottom: 90, left: 50, right: 20, top: 20 }}
                  xAxis={[
                    {
                      scaleType: 'band',
                      data: stats.byMajor.map((item) => item.major),
                      height: 80,
                      tickLabelStyle: {
                        fontSize: 11,
                        angle: -35,
                        textAnchor: 'end',
                      },
                    },
                  ]}
                  series={[
                    {
                      label: 'Students',
                      data: stats.byMajor.map((item) => item.count),
                      color: '#4f46e5',
                    },
                  ]}
                />
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          {loading || !stats ? (
            <ChartCardSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardHeader title="Status breakdown" subheader="Enrollment lifecycle" />
              <CardContent>
                <PieChart
                  height={320}
                  series={[
                    {
                      innerRadius: 55,
                      paddingAngle: 2,
                      cornerRadius: 4,
                      data: stats.byStatus.map((item) => ({
                        id: item.status,
                        value: item.count,
                        label: STATUS_META[item.status].label,
                        color: STATUS_COLORS[item.status],
                      })),
                    },
                  ]}
                  slotProps={{
                    legend: {
                      direction: 'horizontal' as const,
                      position: { vertical: 'bottom' as const, horizontal: 'center' as const },
                    },
                  }}
                />
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Top performers" subheader="Active students with the highest GPA" />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {loading || !stats ? (
                <Stack spacing={1} sx={{ p: 2 }}>
                  {[0, 1, 2, 3, 4].map((key) => (
                    <Skeleton key={key} height={48} />
                  ))}
                </Stack>
              ) : (
                <List disablePadding>
                  {stats.topPerformers.map((student, index) => (
                    <ListItem
                      key={student.id}
                      divider={index !== stats.topPerformers.length - 1}
                      secondaryAction={<GpaChip gpa={student.gpa} />}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', fontSize: 14 }}>
                          {initials(student)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={fullName(student)}
                        secondary={`${student.major} • ${student.grade}`}
                        slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Recently added" subheader="Latest students in the register" />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {loading || !stats ? (
                <Stack spacing={1} sx={{ p: 2 }}>
                  {[0, 1, 2, 3, 4].map((key) => (
                    <Skeleton key={key} height={48} />
                  ))}
                </Stack>
              ) : (
                <List disablePadding>
                  {stats.recentEnrollments.map((student, index) => (
                    <ListItem
                      key={student.id}
                      divider={index !== stats.recentEnrollments.length - 1}
                      secondaryAction={
                        <Button component={Link} href={`/students/${student.id}`} size="small">
                          View
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main', fontSize: 14 }}>
                          {initials(student)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={fullName(student)}
                        secondary={`${student.rollNumber} • added ${formatDate(student.createdAt)}`}
                        slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {!loading && stats ? (
          <Grid size={12}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Quick filters:
              </Typography>
              <Chip
                component={Link}
                href="/students?status=active"
                clickable
                label={`Active (${stats.active})`}
              />
              <Chip
                component={Link}
                href="/students?status=suspended"
                clickable
                label={`Suspended (${stats.suspended})`}
              />
              <Chip
                component={Link}
                href="/students?status=graduated"
                clickable
                label={`Graduated (${stats.graduated})`}
              />
            </Stack>
          </Grid>
        ) : null}
      </Grid>
    </>
  );
}
