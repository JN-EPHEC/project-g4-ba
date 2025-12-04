/**
 * Design Tokens - Système de design centralisé pour WeCamp
 *
 * Ce fichier contient tous les tokens de design utilisés dans l'application.
 * Utiliser ces valeurs garantit la cohérence visuelle à travers l'app.
 */

// =============================================================================
// SPACING - Basé sur une grille de 4px
// =============================================================================
export const Spacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  '2xl': 24,
  /** 32px */
  '3xl': 32,
  /** 40px */
  '4xl': 40,
  /** 48px */
  '5xl': 48,
  /** 64px */
  '6xl': 64,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================
export const Radius = {
  /** 4px - Boutons petits, badges */
  xs: 4,
  /** 6px - Inputs, petits éléments */
  sm: 6,
  /** 8px - Cards, conteneurs */
  md: 8,
  /** 12px - Cards larges, modals */
  lg: 12,
  /** 16px - Grands conteneurs */
  xl: 16,
  /** 20px - Très grands éléments */
  '2xl': 20,
  /** 24px - Éléments arrondis */
  '3xl': 24,
  /** 9999px - Cercle parfait */
  full: 9999,
} as const;

// =============================================================================
// SHADOWS / ELEVATION
// =============================================================================
export const Shadows = {
  /** Ombre légère - éléments interactifs au repos */
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  /** Ombre moyenne - cards, boutons hover */
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  /** Ombre standard - cards élevées */
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  /** Ombre forte - modals, dropdowns */
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  /** Ombre très forte - éléments flottants */
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================
export const Typography = {
  // Tailles de police
  fontSize: {
    /** 11px */
    xs: 11,
    /** 12px */
    sm: 12,
    /** 13px */
    caption: 13,
    /** 14px */
    body2: 14,
    /** 16px */
    body: 16,
    /** 18px */
    lg: 18,
    /** 20px */
    xl: 20,
    /** 24px */
    '2xl': 24,
    /** 28px */
    '3xl': 28,
    /** 32px */
    '4xl': 32,
    /** 40px */
    '5xl': 40,
  },

  // Hauteurs de ligne
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Poids de police
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
  },
} as const;

// =============================================================================
// ANIMATION
// =============================================================================
export const Animation = {
  // Durées
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
  },

  // Délais de stagger pour les listes
  stagger: {
    fast: 50,
    normal: 100,
    slow: 150,
  },
} as const;

// =============================================================================
// LAYOUT
// =============================================================================
export const Layout = {
  /** Padding horizontal des écrans */
  screenPadding: Spacing.lg,
  /** Padding vertical du header */
  headerPadding: Spacing['5xl'],
  /** Gap entre les sections */
  sectionGap: Spacing['2xl'],
  /** Gap entre les éléments d'une liste */
  listGap: Spacing.md,
  /** Largeur max du contenu (tablette/desktop) */
  maxContentWidth: 600,
  /** Hauteur de la tab bar */
  tabBarHeight: 80,
} as const;

// =============================================================================
// BORDERS
// =============================================================================
export const Borders = {
  width: {
    thin: 1,
    medium: 1.5,
    thick: 2,
  },
} as const;

// =============================================================================
// OPACITY
// =============================================================================
export const Opacity = {
  /** État désactivé */
  disabled: 0.5,
  /** État pressé */
  pressed: 0.7,
  /** Overlay léger */
  overlay: 0.4,
  /** Overlay fort */
  overlayStrong: 0.6,
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================
export const ZIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
} as const;
