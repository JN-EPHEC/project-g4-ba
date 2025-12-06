import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mode de thème disponibles
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Schéma de couleur effectif (résolu)
 */
export type ColorScheme = 'light' | 'dark';

/**
 * Interface pour le contexte de thème
 */
interface ThemeContextType {
  /** Mode de thème sélectionné par l'utilisateur */
  themeMode: ThemeMode;
  /** Schéma de couleur effectif (résolu depuis system si nécessaire) */
  colorScheme: ColorScheme;
  /** Changer le mode de thème */
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  /** Indique si le thème est en cours de chargement */
  isLoading: boolean;
}

const THEME_STORAGE_KEY = '@wecamp_theme_mode';

/**
 * Contexte de thème
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook personnalisé pour utiliser le contexte de thème
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
}

/**
 * Provider pour le contexte de thème
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && isValidThemeMode(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      console.log('🎨 Changement de thème:', mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
      console.log('✅ Thème changé avec succès:', mode);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du thème:', error);
      throw error;
    }
  };

  // Résoudre le schéma de couleur effectif
  const colorScheme: ColorScheme =
    themeMode === 'system'
      ? (systemColorScheme ?? 'light')
      : themeMode;

  // Log pour debug
  console.log('🔍 ThemeProvider - themeMode:', themeMode, 'colorScheme:', colorScheme);

  const value: ThemeContextType = {
    themeMode,
    colorScheme,
    setThemeMode,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Valide si une valeur est un ThemeMode valide
 */
function isValidThemeMode(value: string): value is ThemeMode {
  return ['light', 'dark', 'system'].includes(value);
}
