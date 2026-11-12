'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type ColorMode = 'light' | 'dark';

interface ColorModeContextValue {
  mode: ColorMode;
  toggleMode: () => void;
  setMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null);
const STORAGE_KEY = 'sms-color-mode';

/* -------------------------------------------------------------------------- */
/* External store so the mode can be read without setState-in-effect          */
/* -------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

/** Server snapshot: always light so prerendered HTML and hydration match. */
function getServerSnapshot(): ColorMode {
  return 'light';
}

function readStoredMode(): ColorMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function writeStoredMode(mode: ColorMode): void {
  window.localStorage.setItem(STORAGE_KEY, mode);
  emit();
}

/**
 * Reads the persisted color mode from `localStorage`, falling back to the
 * operating system preference. React re-reads the snapshot after hydration.
 */
export function useColorMode(): ColorModeContextValue {
  const mode = useSyncExternalStore(subscribe, readStoredMode, getServerSnapshot);

  const setMode = useCallback((next: ColorMode) => {
    writeStoredMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    writeStoredMode(readStoredMode() === 'light' ? 'dark' : 'light');
  }, []);

  return useMemo(() => ({ mode, toggleMode, setMode }), [mode, toggleMode, setMode]);
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const value = useColorMode();
  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>;
}

/** Context based accessor for components that prefer context over the hook. */
export function useColorModeContext(): ColorModeContextValue {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error('useColorModeContext must be used inside a ColorModeProvider');
  }
  return context;
}
