import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from '@/constants/themes';

const STORAGE_KEY = 'wecamp:theme-mode'; // 'light' | 'dark'

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Par défaut: mode "light" (Jour) si l'utilisateur n'a rien choisi
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored as ThemeMode);
          applyMode(stored as ThemeMode);
        } else {
          // Aucun mode stocké: choisir Jour par défaut
          setModeState('light');
          setIsDark(false);
        }
      } catch (e) {
        // En cas d'erreur de lecture, forcer Jour par défaut
        setModeState('light');
        setIsDark(false);
      } finally {
        setLoaded(true);
      }
    };

    init();
    // no Appearance listener needed since we removed 'auto' mode
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyMode = async (m: ThemeMode) => {
    setIsDark(m === 'dark');
  };

  const setMode = async (m: ThemeMode) => {
    setModeState(m);
    await applyMode(m);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, m);
    } catch (e) {
      console.warn('ThemeContext: cannot save mode', e);
    }
  };

  const toggle = async () => {
    const newMode: ThemeMode = isDark ? 'light' : 'dark';
    await setMode(newMode);
  };

  const theme = isDark ? darkTheme : lightTheme;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDark, mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
