import React from 'react';
import { View, StyleSheet, Pressable, type ViewStyle, type PressableProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Radius, Shadows, Opacity, Borders } from '@/constants/design-tokens';

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'ghost';
export type CardSize = 'sm' | 'md' | 'lg';

export type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: CardVariant;
  size?: CardSize;
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
};

export function Card({
  children,
  style,
  variant = 'elevated',
  size = 'md',
  onPress,
  disabled = false,
}: CardProps) {
  // Couleurs du thème
  const cardBackground = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const cardPressed = useThemeColor({}, 'cardPressed');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');

  // Styles dynamiques basés sur la variante
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: cardBackground,
          ...Shadows.lg,
        };
      case 'outlined':
        return {
          backgroundColor: cardBackground,
          borderWidth: Borders.width.thin,
          borderColor: cardBorder,
        };
      case 'filled':
        return {
          backgroundColor: surfaceSecondary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {};
    }
  };

  // Padding selon la taille
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { padding: Spacing.md };
      case 'lg':
        return { padding: Spacing.xl };
      default:
        return { padding: Spacing.lg };
    }
  };

  const containerStyle: ViewStyle[] = [
    styles.card,
    getVariantStyles(),
    getSizeStyles(),
    disabled && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...containerStyle,
          pressed && { backgroundColor: cardPressed, transform: [{ scale: 0.98 }] },
        ]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  disabled: {
    opacity: Opacity.disabled,
  },
});
