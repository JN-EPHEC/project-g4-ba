import { I18nManager, StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Typography } from '@/constants/design-tokens';

/**
 * Types de texte disponibles
 *
 * Hiérarchie typographique:
 * - display: Très grands titres (hero sections)
 * - title: Titres principaux de page
 * - subtitle: Sous-titres et titres de section
 * - heading: Titres de cards/composants
 * - body: Texte courant
 * - bodyMedium: Texte courant semi-gras
 * - bodySemiBold: Texte courant gras
 * - caption: Texte secondaire, métadonnées
 * - small: Petits textes, badges
 * - link: Liens cliquables
 * - label: Labels de formulaires
 */
export type TextType =
  | 'default'
  | 'display'
  | 'title'
  | 'subtitle'
  | 'heading'
  | 'body'
  | 'bodyMedium'
  | 'bodySemiBold'
  | 'defaultSemiBold' // Legacy - utiliser bodySemiBold
  | 'caption'
  | 'small'
  | 'link'
  | 'label';

/**
 * Couleurs de texte disponibles
 */
export type TextColor = 'default' | 'secondary' | 'tertiary' | 'inverse' | 'tint' | 'success' | 'warning' | 'error';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: TextType;
  color?: TextColor;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  color = 'default',
  ...rest
}: ThemedTextProps) {
  // Déterminer la couleur de base selon le prop color
  const colorKey = getColorKey(color);
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);
  const tintColor = useThemeColor({}, 'tint');

  // Couleur finale (les liens utilisent toujours la couleur tint)
  const finalColor = type === 'link' ? tintColor : textColor;

  return (
    <Text
      style={[
        { color: finalColor, writingDirection: 'ltr' },
        styles[type] || styles.default,
        style,
      ]}
      {...rest}
    />
  );
}

/**
 * Mapping des props color vers les clés du thème
 */
function getColorKey(color: TextColor): 'text' | 'textSecondary' | 'textTertiary' | 'textInverse' | 'tint' | 'success' | 'warning' | 'error' {
  switch (color) {
    case 'secondary':
      return 'textSecondary';
    case 'tertiary':
      return 'textTertiary';
    case 'inverse':
      return 'textInverse';
    case 'tint':
      return 'tint';
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    default:
      return 'text';
  }
}

const styles = StyleSheet.create({
  // ==========================================================================
  // TITRES
  // ==========================================================================

  /** Display - Très grands titres (40px, bold, tight) */
  display: {
    fontSize: Typography.fontSize['5xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize['5xl'] * Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.tighter,
  },

  /** Title - Titres principaux (32px, bold, tight) */
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize['4xl'] * Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.tight,
  },

  /** Subtitle - Sous-titres (20px, semibold) */
  subtitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.snug,
    letterSpacing: Typography.letterSpacing.tight,
  },

  /** Heading - Titres de section (18px, semibold) */
  heading: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.snug,
  },

  // ==========================================================================
  // CORPS DE TEXTE
  // ==========================================================================

  /** Default/Body - Texte standard (16px, normal) */
  default: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.fontSize.body * Typography.lineHeight.normal,
  },

  /** Body - Alias de default */
  body: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.fontSize.body * Typography.lineHeight.normal,
  },

  /** Body Medium (16px, medium) */
  bodyMedium: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.body * Typography.lineHeight.normal,
  },

  /** Body SemiBold (16px, semibold) */
  bodySemiBold: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.body * Typography.lineHeight.normal,
  },

  /** Legacy - defaultSemiBold */
  defaultSemiBold: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.body * Typography.lineHeight.normal,
  },

  // ==========================================================================
  // PETITS TEXTES
  // ==========================================================================

  /** Caption - Texte secondaire (14px, normal) */
  caption: {
    fontSize: Typography.fontSize.body2,
    fontWeight: Typography.fontWeight.normal,
    lineHeight: Typography.fontSize.body2 * Typography.lineHeight.normal,
  },

  /** Small - Petits textes (12px, medium) */
  small: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },

  // ==========================================================================
  // SPÉCIAUX
  // ==========================================================================

  /** Link - Liens cliquables (16px, medium, couleur tint) */
  link: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.body * Typography.lineHeight.normal,
  },

  /** Label - Labels de formulaires (14px, medium) */
  label: {
    fontSize: Typography.fontSize.body2,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.body2 * Typography.lineHeight.snug,
  },
});
