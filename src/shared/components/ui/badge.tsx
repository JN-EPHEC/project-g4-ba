import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export type BadgeProps = {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle | ViewStyle[];
};

export function Badge({ children, variant = 'default', size = 'medium', style }: BadgeProps) {
  const variantStyles = {
    success: {
      backgroundColor: '#22c55e20',
      color: '#15803d',
    },
    warning: {
      backgroundColor: '#f59e0b20',
      color: '#b45309',
    },
    error: {
      backgroundColor: '#ef444420',
      color: '#dc2626',
    },
    info: {
      backgroundColor: '#3b82f620',
      color: '#1d4ed8',
    },
    default: {
      backgroundColor: '#6b728020',
      color: '#374151',
    },
  };

  const sizeStyles = {
    small: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      fontSize: 11,
    },
    medium: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      fontSize: 13,
    },
    large: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      fontSize: 14,
    },
  };

  const { backgroundColor, color } = variantStyles[variant];
  const { paddingVertical, paddingHorizontal, fontSize } = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor, paddingVertical, paddingHorizontal },
        style,
      ]}
    >
      <ThemedText
        style={[
          styles.text,
          { color, fontSize },
        ]}
      >
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
