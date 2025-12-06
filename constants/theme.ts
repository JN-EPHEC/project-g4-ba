/**
 * Système de couleurs WeCamp
 *
 * Palette complète avec support light/dark mode, couleurs sémantiques,
 * et échelles de gris pour une UI cohérente et moderne.
 */

import { Platform } from 'react-native';

// =============================================================================
// COULEURS DE MARQUE - Palette Nature WeCamp
// =============================================================================
export const BrandColors = {
  /** Couleur principale - Vert Forêt */
  primary: {
    50: '#f0f5f3',
    100: '#d9e8e2',
    200: '#b5d4c8',
    300: '#8bbaaa',
    400: '#5d9a86',
    500: '#2D5A45', // Vert forêt principal
    600: '#264d3b',
    700: '#1f4031',
    800: '#183327',
    900: '#12261d',
  },
  /** Couleur secondaire - Taupe/Gris chaud */
  secondary: {
    50: '#f8f7f6',
    100: '#eeece9',
    200: '#ddd9d4',
    300: '#c7c1b9',
    400: '#a9a197',
    500: '#8B7E74', // Taupe principal
    600: '#756960',
    700: '#5f554d',
    800: '#4a423b',
    900: '#36302b',
  },
  /** Accent - Orange Terracotta */
  accent: {
    50: '#fdf4f0',
    100: '#fbe6dd',
    200: '#f7cbb8',
    300: '#f1a98a',
    400: '#e99265',
    500: '#D97B4A', // Orange terracotta principal
    600: '#c46839',
    700: '#a3552e',
    800: '#824425',
    900: '#61331c',
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
// ÉCHELLE DE GRIS - Tons chauds naturels
// =============================================================================
export const NeutralColors = {
  white: '#FFFFFF',
  black: '#000000',
  /** Fond crème clair */
  cream: '#FAF9F7',
  /** Fond crème */
  canvas: '#F5F4F1',
  gray: {
    50: '#FAFAF9',
    100: '#F5F5F3',
    200: '#E8E7E4',
    300: '#D6D5D1',
    400: '#A8A7A3',
    500: '#78776F',
    600: '#5C5B55',
    700: '#46453F',
    800: '#2E2D2A',
    900: '#1C1B19',
    950: '#0F0E0D',
  },
};

// =============================================================================
// THÈME COMPLET LIGHT/DARK
// =============================================================================
export const Colors = {
  light: {
    // Base
    text: NeutralColors.gray[900],
    textSecondary: NeutralColors.gray[500],
    textTertiary: NeutralColors.gray[400],
    textInverse: '#FFFFFF',

    // Backgrounds - Tons crème naturels
    background: NeutralColors.cream,
    backgroundSecondary: NeutralColors.canvas,
    backgroundTertiary: NeutralColors.gray[100],
    surface: '#FFFFFF',
    surfaceSecondary: NeutralColors.gray[100],

    // Borders - Plus douces
    border: NeutralColors.gray[200],
    borderSecondary: NeutralColors.gray[300],
    divider: NeutralColors.gray[200],

    // Interactive - Vert forêt
    tint: BrandColors.primary[500],
    tintSecondary: BrandColors.secondary[500],
    tintAccent: BrandColors.accent[500],

    // Icons
    icon: NeutralColors.gray[500],
    iconSecondary: NeutralColors.gray[400],
    tabIconDefault: NeutralColors.gray[400],
    tabIconSelected: BrandColors.primary[500],

    // States
    disabled: NeutralColors.gray[300],
    placeholder: NeutralColors.gray[400],
    overlay: 'rgba(0, 0, 0, 0.4)',

    // Semantic
    success: BrandColors.primary[500],
    successBackground: BrandColors.primary[50],
    warning: SemanticColors.warning.light,
    warningBackground: SemanticColors.warning.background.light,
    error: SemanticColors.error.light,
    errorBackground: SemanticColors.error.background.light,
    info: BrandColors.primary[400],
    infoBackground: BrandColors.primary[50],

    // Cards - Fond blanc avec bordures douces
    card: '#FFFFFF',
    cardBorder: NeutralColors.gray[200],
    cardPressed: NeutralColors.gray[100],

    // Input
    inputBackground: '#FFFFFF',
    inputBorder: NeutralColors.gray[200],
    inputBorderFocus: BrandColors.primary[500],
  },

  dark: {
    // Base
    text: NeutralColors.gray[50],
    textSecondary: NeutralColors.gray[400],
    textTertiary: NeutralColors.gray[500],
    textInverse: NeutralColors.gray[900],

    // Backgrounds
    background: NeutralColors.gray[950],
    backgroundSecondary: NeutralColors.gray[900],
    backgroundTertiary: NeutralColors.gray[800],
    surface: NeutralColors.gray[900],
    surfaceSecondary: NeutralColors.gray[800],

    // Borders
    border: NeutralColors.gray[800],
    borderSecondary: NeutralColors.gray[700],
    divider: NeutralColors.gray[800],

    // Interactive
    tint: BrandColors.primary[400],
    tintSecondary: BrandColors.secondary[400],
    tintAccent: BrandColors.accent[400],

    // Icons
    icon: NeutralColors.gray[400],
    iconSecondary: NeutralColors.gray[500],
    tabIconDefault: NeutralColors.gray[500],
    tabIconSelected: BrandColors.primary[400],

    // States
    disabled: NeutralColors.gray[700],
    placeholder: NeutralColors.gray[500],
    overlay: 'rgba(0, 0, 0, 0.6)',

    // Semantic
    success: BrandColors.primary[400],
    successBackground: BrandColors.primary[900],
    warning: SemanticColors.warning.dark,
    warningBackground: SemanticColors.warning.background.dark,
    error: SemanticColors.error.dark,
    errorBackground: SemanticColors.error.background.dark,
    info: BrandColors.primary[300],
    infoBackground: BrandColors.primary[900],

    // Cards
    card: NeutralColors.gray[900],
    cardBorder: NeutralColors.gray[800],
    cardPressed: NeutralColors.gray[800],

    // Input
    inputBackground: NeutralColors.gray[900],
    inputBorder: NeutralColors.gray[700],
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
    camp: BrandColors.primary[600],
    activity: BrandColors.accent[500],
    training: BrandColors.secondary[500],
    other: NeutralColors.gray[500],
  },

  /** Couleurs des canaux de discussion */
  channels: {
    announcements: BrandColors.accent[500],
    general: BrandColors.primary[500],
    parents: BrandColors.secondary[500],
    custom: BrandColors.primary[400],
  },

  /** Couleurs des rangs scouts */
  ranks: {
    beginner: BrandColors.primary[300],
    intermediate: BrandColors.primary[500],
    advanced: BrandColors.accent[500],
    expert: BrandColors.accent[600],
    master: BrandColors.primary[700],
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
