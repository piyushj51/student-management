import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@/components/Link';

export default function NotFound() {
  return (
    <Card>
      <CardContent sx={{ py: 6 }}>
        <Stack sx={{ alignItems: 'center', textAlign: 'center' }} spacing={2}>
          <Typography variant="h3">404</Typography>
          <Typography variant="h5">Page not found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
            The page you are looking for does not exist or has been moved.
          </Typography>
          <Button component={Link} href="/" startIcon={<ArrowBackIcon />} variant="contained">
            Back to dashboard
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
