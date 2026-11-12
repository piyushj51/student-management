'use client';

import { createTheme, type Theme } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';
import type { ColorMode } from './ColorModeProvider';

/**
 * Build the Material UI theme for a given color mode.
 *
 * Note: `typography.fontFamily` intentionally keeps the Material UI default
 * ("Roboto, Helvetica, Arial") so the Roboto tuned letter spacing is kept —
 * the Roboto webfont itself is loaded with `next/font` in the root layout.
 */
export function buildTheme(mode: ColorMode): Theme {
  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: { main: mode === 'light' ? '#4f46e5' : '#8b8bf5' },
      secondary: { main: mode === 'light' ? '#0d9488' : '#2dd4bf' },
      background:
        mode === 'light'
          ? { default: '#f5f6fb', paper: '#ffffff' }
          : { default: '#0f1117', paper: '#171a23' },
    },
    shape: { borderRadius: 12 },
    typography: {
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
          }),
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, paddingInline: 16 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: 'divider' },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor:
                mode === 'light' ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.04)',
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
              outline: 'none',
            },
          },
        },
      },
    },
  });
}
