import React from 'react';
import { View, StyleSheet, Pressable, type ViewStyle, type PressableProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'elevated' | 'outlined' | 'filled';
  onPress?: PressableProps['onPress'];
};

export function Card({ children, style, variant = 'elevated', onPress }: CardProps) {
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1a1a1a' }, 'background');
  const borderColor = useThemeColor({ light: '#e5e5e5', dark: '#3a3a3a' }, 'icon');

  const containerStyle = [
    styles.card,
    { backgroundColor },
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && [styles.outlined, { borderColor }],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
