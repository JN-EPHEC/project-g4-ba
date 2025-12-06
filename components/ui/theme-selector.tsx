import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useTheme, type ThemeMode } from '@/context/theme-context';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    mode: 'light',
    label: 'Clair',
    icon: 'sunny-outline',
    description: 'Thème clair',
  },
  {
    mode: 'dark',
    label: 'Sombre',
    icon: 'moon-outline',
    description: 'Thème sombre',
  },
  {
    mode: 'system',
    label: 'Système',
    icon: 'phone-portrait-outline',
    description: 'Suivre les paramètres système',
  },
];

export function ThemeSelector() {
  const { themeMode, setThemeMode } = useTheme();
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'surface');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const handleSelectTheme = async (mode: ThemeMode) => {
    try {
      await setThemeMode(mode);
    } catch (error) {
      console.error('Erreur lors du changement de thème:', error);
    }
  };

  return (
    <View style={styles.container}>
      {THEME_OPTIONS.map((option) => {
        const isSelected = themeMode === option.mode;
        return (
          <TouchableOpacity
            key={option.mode}
            style={[
              styles.option,
              {
                backgroundColor,
                borderColor: isSelected ? tintColor : borderColor,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
            onPress={() => handleSelectTheme(option.mode)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: isSelected ? tintColor : 'transparent' }
            ]}>
              <Ionicons
                name={option.icon}
                size={24}
                color={isSelected ? '#FFFFFF' : textSecondary}
              />
            </View>
            <View style={styles.textContainer}>
              <ThemedText type="bodySemiBold">{option.label}</ThemedText>
              <ThemedText type="caption" color="secondary">
                {option.description}
              </ThemedText>
            </View>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color={tintColor} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
});
