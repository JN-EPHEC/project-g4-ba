import React from 'react';
import { Pressable, StyleSheet, ViewStyle, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type PrimaryButtonProps = PressableProps & {
  title: string;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
};

export function PrimaryButton({ title, style, disabled, ...rest }: PrimaryButtonProps) {
  const backgroundColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'background');

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? '#999' : backgroundColor },
        pressed ? styles.buttonPressed : undefined,
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <ThemedText type="defaultSemiBold" style={[styles.text, { color: textColor }]}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  text: {
    fontSize: 16,
    color: '#fff',
  },
});
