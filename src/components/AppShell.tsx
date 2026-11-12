'use client';

import { Suspense, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { useColorMode } from './ColorModeProvider';
import { CURRENT_USER } from '@/lib/format';
import Link from './Link';

const DRAWER_WIDTH = 264;

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: <DashboardOutlinedIcon /> },
  { href: '/students', label: 'Students', icon: <GroupsOutlinedIcon /> },
] as const;

const userInitials = CURRENT_USER.name
  .split(' ')
  .map((part) => part.charAt(0))
  .join('');

/** Page title for the active route; suspends on the client because it reads the URL. */
function CurrentSectionTitle() {
  const pathname = usePathname();
  const item = NAV_ITEMS.find((navItem) =>
    navItem.href === '/' ? pathname === '/' : pathname.startsWith(navItem.href),
  );

  if (pathname.startsWith('/students/')) return <Skeleton width={140} />;

  return (
    <Typography variant="subtitle1" noWrap component="p" sx={{ fontWeight: 600 }}>
      {item?.label ?? 'Dashboard'}
    </Typography>
  );
}

function DrawerContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            <SchoolOutlinedIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Scholaris
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Student Management
            </Typography>
          </Box>
        </Stack>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flexGrow: 1 }} component="nav">
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={item.href}
              selected={
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              }
              onClick={onNavigate}
              sx={{ borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 2 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', fontSize: 14 }}>
          {userInitials}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {CURRENT_USER.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {CURRENT_USER.role}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

/** Fallback shown while the active route (and therefore the nav state) resolves. */
function DrawerFallback() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Scholaris
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Student Management
            </Typography>
          </Box>
        </Stack>
      </Toolbar>
      <Divider />
      <Stack spacing={1} sx={{ p: 2 }}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={40} />
      </Stack>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 2 }}>
        <Skeleton variant="circular" width={34} height={34} />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton width="60%" height={18} />
          <Skeleton width="40%" height={14} />
        </Box>
      </Stack>
    </Box>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Suspense fallback={<Skeleton width={140} />}>
            <CurrentSectionTitle />
          </Suspense>
          <Box sx={{ flexGrow: 1 }} />
          <ColorModeToggle />
          <Avatar sx={{ ml: 1.5, width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
            {userInitials}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Suspense fallback={<DrawerFallback />}>
            <DrawerContent onNavigate={() => setMobileOpen(false)} />
          </Suspense>
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          <Suspense fallback={<DrawerFallback />}>
            <DrawerContent />
          </Suspense>
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100dvh',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}

function ColorModeToggle() {
  const { mode, toggleMode } = useColorMode();

  return (
    <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
      <IconButton onClick={toggleMode} aria-label="Toggle color mode">
        {mode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
}
