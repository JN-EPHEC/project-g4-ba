import React from 'react';
import { Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type IconButtonProps = PressableProps & {
  children: React.ReactNode;
  variant?: 'filled' | 'outlined' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle | ViewStyle[];
};

export function IconButton({
  children,
  variant = 'ghost',
  size = 'medium',
  style,
  disabled,
  ...rest
}: IconButtonProps) {
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({ light: '#e5e5e5', dark: '#3a3a3a' }, 'icon');

  const sizeMap = {
    small: 32,
    medium: 40,
    large: 48,
  };

  const buttonSize = sizeMap[size];

  const getVariantStyle = () => {
    switch (variant) {
      case 'filled':
        return { backgroundColor: tintColor };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor,
        };
      case 'ghost':
      default:
        return { backgroundColor: 'transparent' };
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
        },
        getVariantStyle(),
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
