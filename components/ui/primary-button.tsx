import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Radius, Shadows, Opacity, Typography } from '@/constants/design-tokens';
import { BrandColors } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type PrimaryButtonProps = TouchableOpacityProps & {
  title: string;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function PrimaryButton({
  title,
  style,
  disabled,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...rest
}: PrimaryButtonProps) {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const disabledColor = useThemeColor({}, 'disabled');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');

  const isDisabled = disabled || loading;

  // Couleurs selon la variante
  const getVariantStyles = (): { bg: string; text: string; border?: string } => {
    if (isDisabled) {
      return {
        bg: variant === 'outline' || variant === 'ghost' ? 'transparent' : disabledColor,
        text: variant === 'outline' || variant === 'ghost' ? disabledColor : backgroundColor,
        border: disabledColor,
      };
    }

    switch (variant) {
      case 'primary':
        return { bg: tintColor, text: '#FFFFFF' };
      case 'secondary':
        return { bg: BrandColors.secondary[500], text: '#FFFFFF' };
      case 'outline':
        return { bg: 'transparent', text: tintColor, border: tintColor };
      case 'ghost':
        return { bg: 'transparent', text: tintColor };
      case 'danger':
        return { bg: errorColor, text: '#FFFFFF' };
      default:
        return { bg: tintColor, text: '#FFFFFF' };
    }
  };

  // Tailles
  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          minWidth: 80,
        };
      case 'lg':
        return {
          paddingVertical: Spacing.lg,
          paddingHorizontal: Spacing.xl,
          minWidth: 160,
        };
      default:
        return {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
          minWidth: 120,
        };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return Typography.fontSize.body2;
      case 'lg':
        return Typography.fontSize.lg;
      default:
        return Typography.fontSize.body;
    }
  };

  const colors = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      activeOpacity={Opacity.pressed}
      style={[
        styles.button,
        sizeStyles,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: colors.border ? 1.5 : 0,
        },
        fullWidth && styles.fullWidth,
        variant === 'primary' && !isDisabled && Shadows.sm,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <ThemedText
          type="bodySemiBold"
          style={[
            styles.text,
            { color: colors.text, fontSize: getFontSize() },
          ]}
        >
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },
});
