import React from 'react';
import { TextInput, StyleSheet, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
};

export function Input({ label, error, icon, style, ...rest }: InputProps) {
  const borderColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({ light: '#f5f5f5', dark: '#2a2a2a' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const errorColor = '#ef4444';

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="defaultSemiBold" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor: error ? errorColor : borderColor,
          },
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            { color: textColor },
            icon && styles.inputWithIcon,
            style,
          ]}
          placeholderTextColor={textColor + '80'}
          {...rest}
        />
      </View>
      {error && (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
  },
});
