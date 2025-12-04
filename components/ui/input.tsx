import React, { useState } from 'react';
import { TextInput, StyleSheet, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Radius, Borders, Typography } from '@/constants/design-tokens';

export type InputSize = 'sm' | 'md' | 'lg';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: InputSize;
  disabled?: boolean;
};

export function Input({
  label,
  error,
  helper,
  icon,
  rightIcon,
  size = 'md',
  disabled = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Couleurs du thème
  const inputBackground = useThemeColor({}, 'inputBackground');
  const inputBorder = useThemeColor({}, 'inputBorder');
  const inputBorderFocus = useThemeColor({}, 'inputBorderFocus');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const errorColor = useThemeColor({}, 'error');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const disabledColor = useThemeColor({}, 'disabled');

  // Déterminer la couleur de la bordure
  const getBorderColor = () => {
    if (disabled) return disabledColor;
    if (error) return errorColor;
    if (isFocused) return inputBorderFocus;
    return inputBorder;
  };

  // Tailles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          minHeight: 40,
          paddingHorizontal: Spacing.md,
          fontSize: Typography.fontSize.body2,
        };
      case 'lg':
        return {
          minHeight: 56,
          paddingHorizontal: Spacing.lg,
          fontSize: Typography.fontSize.lg,
        };
      default:
        return {
          minHeight: 48,
          paddingHorizontal: Spacing.lg,
          fontSize: Typography.fontSize.body,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="label" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled ? disabledColor : inputBackground,
            borderColor: getBorderColor(),
            minHeight: sizeStyles.minHeight,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          isFocused && styles.inputContainerFocused,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              color: disabled ? textSecondary : textColor,
              fontSize: sizeStyles.fontSize,
            },
            icon ? styles.inputWithIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            style,
          ]}
          placeholderTextColor={placeholderColor}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>
      {(error || helper) && (
        <ThemedText
          type="small"
          style={[
            styles.helperText,
            { color: error ? errorColor : textSecondary },
          ]}
        >
          {error || helper}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: Borders.width.thin,
    borderRadius: Radius.md,
  },
  inputContainerFocused: {
    borderWidth: Borders.width.medium,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  rightIconContainer: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  helperText: {
    marginTop: Spacing.xs,
  },
});
