import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/design-tokens';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'full' | 'inset' | 'middle';

export type DividerProps = {
  /** Orientation du divider */
  orientation?: DividerOrientation;
  /** Variante du divider */
  variant?: DividerVariant;
  /** Texte optionnel au milieu */
  label?: string;
  /** Style personnalisé */
  style?: ViewStyle;
  /** Espacement vertical (pour horizontal) ou horizontal (pour vertical) */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
};

export function Divider({
  orientation = 'horizontal',
  variant = 'full',
  label,
  style,
  spacing = 'md',
}: DividerProps) {
  const dividerColor = useThemeColor({}, 'divider');
  const backgroundColor = useThemeColor({}, 'background');

  // Calcul du margin selon l'espacement
  const getSpacing = () => {
    switch (spacing) {
      case 'none':
        return 0;
      case 'sm':
        return Spacing.sm;
      case 'lg':
        return Spacing.lg;
      default:
        return Spacing.md;
    }
  };

  // Calcul de l'indentation selon la variante
  const getInset = () => {
    switch (variant) {
      case 'inset':
        return Spacing.lg;
      case 'middle':
        return Spacing['3xl'];
      default:
        return 0;
    }
  };

  const spacingValue = getSpacing();
  const insetValue = getInset();

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          {
            backgroundColor: dividerColor,
            marginHorizontal: spacingValue,
          },
          style,
        ]}
      />
    );
  }

  // Divider horizontal avec label optionnel
  if (label) {
    return (
      <View
        style={[
          styles.labelContainer,
          {
            marginVertical: spacingValue,
            marginHorizontal: insetValue,
          },
          style,
        ]}
      >
        <View style={[styles.line, { backgroundColor: dividerColor }]} />
        <View style={[styles.labelWrapper, { backgroundColor }]}>
          <ThemedText type="small" color="tertiary">
            {label}
          </ThemedText>
        </View>
        <View style={[styles.line, { backgroundColor: dividerColor }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.horizontal,
        {
          backgroundColor: dividerColor,
          marginVertical: spacingValue,
          marginHorizontal: insetValue,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
  },
  vertical: {
    width: 1,
    alignSelf: 'stretch',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 1,
  },
  labelWrapper: {
    paddingHorizontal: Spacing.md,
  },
});
