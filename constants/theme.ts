/**
 * Système de couleurs WeCamp
 *
 * Palette complète avec support light/dark mode, couleurs sémantiques,
 * et échelles de gris pour une UI cohérente et moderne.
 */

import { Platform } from 'react-native';

// =============================================================================
// COULEURS DE MARQUE
// =============================================================================
export const BrandColors = {
  /** Couleur principale - Bleu scout */
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Principal
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  /** Couleur secondaire - Vert nature */
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Principal
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  /** Accent - Orange énergie */
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Principal
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
};

// =============================================================================
// COULEURS SÉMANTIQUES
// =============================================================================
export const SemanticColors = {
  success: {
    light: '#10b981',
    dark: '#34d399',
    background: {
      light: '#ecfdf5',
      dark: '#064e3b',
    },
  },
  warning: {
    light: '#f59e0b',
    dark: '#fbbf24',
    background: {
      light: '#fffbeb',
      dark: '#78350f',
    },
  },
  error: {
    light: '#ef4444',
    dark: '#f87171',
    background: {
      light: '#fef2f2',
      dark: '#7f1d1d',
    },
  },
  info: {
    light: '#3b82f6',
    dark: '#60a5fa',
    background: {
      light: '#eff6ff',
      dark: '#1e3a8a',
    },
  },
};

// =============================================================================
// ÉCHELLE DE GRIS
// =============================================================================
export const NeutralColors = {
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
};

// =============================================================================
// THÈME COMPLET LIGHT/DARK
// =============================================================================
export const Colors = {
  light: {
    // Base
    text: '#18181b',
    textSecondary: '#71717a',
    textTertiary: '#a1a1aa',
    textInverse: '#FFFFFF',

    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#fafafa',
    backgroundTertiary: '#f4f4f5',
    surface: '#FFFFFF',
    surfaceSecondary: '#f4f4f5',

    // Borders
    border: '#e4e4e7',
    borderSecondary: '#d4d4d8',
    divider: '#e4e4e7',

    // Interactive
    tint: BrandColors.primary[500],
    tintSecondary: BrandColors.secondary[500],
    tintAccent: BrandColors.accent[500],

    // Icons
    icon: '#71717a',
    iconSecondary: '#a1a1aa',
    tabIconDefault: '#a1a1aa',
    tabIconSelected: BrandColors.primary[500],

    // States
    disabled: '#d4d4d8',
    placeholder: '#a1a1aa',
    overlay: 'rgba(0, 0, 0, 0.4)',

    // Semantic
    success: SemanticColors.success.light,
    successBackground: SemanticColors.success.background.light,
    warning: SemanticColors.warning.light,
    warningBackground: SemanticColors.warning.background.light,
    error: SemanticColors.error.light,
    errorBackground: SemanticColors.error.background.light,
    info: SemanticColors.info.light,
    infoBackground: SemanticColors.info.background.light,

    // Cards
    card: '#FFFFFF',
    cardBorder: '#e4e4e7',
    cardPressed: '#f4f4f5',

    // Input
    inputBackground: '#fafafa',
    inputBorder: '#e4e4e7',
    inputBorderFocus: BrandColors.primary[500],
  },

  dark: {
    // Base
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    textTertiary: '#71717a',
    textInverse: '#18181b',

    // Backgrounds
    background: '#09090b',
    backgroundSecondary: '#18181b',
    backgroundTertiary: '#27272a',
    surface: '#18181b',
    surfaceSecondary: '#27272a',

    // Borders
    border: '#27272a',
    borderSecondary: '#3f3f46',
    divider: '#27272a',

    // Interactive
    tint: BrandColors.primary[400],
    tintSecondary: BrandColors.secondary[400],
    tintAccent: BrandColors.accent[400],

    // Icons
    icon: '#a1a1aa',
    iconSecondary: '#71717a',
    tabIconDefault: '#71717a',
    tabIconSelected: BrandColors.primary[400],

    // States
    disabled: '#3f3f46',
    placeholder: '#71717a',
    overlay: 'rgba(0, 0, 0, 0.6)',

    // Semantic
    success: SemanticColors.success.dark,
    successBackground: SemanticColors.success.background.dark,
    warning: SemanticColors.warning.dark,
    warningBackground: SemanticColors.warning.background.dark,
    error: SemanticColors.error.dark,
    errorBackground: SemanticColors.error.background.dark,
    info: SemanticColors.info.dark,
    infoBackground: SemanticColors.info.background.dark,

    // Cards
    card: '#18181b',
    cardBorder: '#27272a',
    cardPressed: '#27272a',

    // Input
    inputBackground: '#18181b',
    inputBorder: '#3f3f46',
    inputBorderFocus: BrandColors.primary[400],
  },
};

// =============================================================================
// COULEURS SPÉCIFIQUES À L'APP
// =============================================================================
export const AppColors = {
  /** Couleurs des types d'événements */
  eventTypes: {
    meeting: BrandColors.primary[500],
    camp: BrandColors.secondary[500],
    activity: BrandColors.accent[500],
    training: '#8b5cf6', // Violet
  },

  /** Couleurs des canaux de discussion */
  channels: {
    announcements: '#ef4444',
    general: BrandColors.primary[500],
    parents: BrandColors.secondary[500],
    custom: '#8b5cf6',
  },

  /** Couleurs des rangs scouts */
  ranks: {
    beginner: '#10b981',
    intermediate: '#3b82f6',
    advanced: '#8b5cf6',
    expert: '#f59e0b',
    master: '#ef4444',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
