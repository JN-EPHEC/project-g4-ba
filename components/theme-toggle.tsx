import React from 'react';
import { View, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';

export function ThemeToggle() {
  const { isDark, mode, setMode } = useTheme();
  const iconColor = useThemeColor({}, 'icon');

  const toggle = async () => {
    await setMode(isDark ? 'light' : 'dark');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={async () => await setMode('light')} style={styles.iconButton}>
        <Ionicons name="sunny" size={20} color={iconColor} />
      </TouchableOpacity>

      <Switch
        value={isDark}
        onValueChange={toggle}
        trackColor={{ false: '#767577', true: '#3b82f6' }}
        thumbColor="#fff"
      />

      <TouchableOpacity onPress={async () => await setMode('dark')} style={styles.iconButton}>
        <Ionicons name="moon" size={20} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  autoButton: {
    paddingLeft: 10,
  },
});
