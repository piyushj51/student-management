'use client';

import { useState, type ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, type Theme } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ColorModeProvider, useColorMode, type ColorMode } from './ColorModeProvider';
import { buildTheme } from './theme';

/**
 * Builds the Material UI theme for the active color mode.
 *
 * The theme is derived during render: when the mode changes, the mismatch
 * between the stored snapshot and the incoming mode is reconciled in the same
 * render, which is React's recommended alternative to setting state in an
 * effect.
 */
function MuiThemeProvider({ children }: { children: ReactNode }) {
  const { mode } = useColorMode();

  const [state, setState] = useState<{ mode: ColorMode; theme: Theme }>(() => ({
    mode,
    theme: buildTheme(mode),
  }));

  if (state.mode !== mode) {
    setState({ mode, theme: buildTheme(mode) });
  }

  return (
    <ThemeProvider theme={state.theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}

/** Collects server rendered Emotion styles and provides the MUI theme. */
export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ColorModeProvider>
        <MuiThemeProvider>{children}</MuiThemeProvider>
      </ColorModeProvider>
    </AppRouterCacheProvider>
  );
}
