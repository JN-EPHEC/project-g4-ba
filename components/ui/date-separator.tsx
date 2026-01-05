import React from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/design-tokens';

interface DateSeparatorProps {
  date: Date;
}

function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) {
    return "Aujourd'hui";
  }

  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Hier';
  }

  // Format: "samedi 3 janvier"
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');
  const label = formatDateLabel(date);

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.text, { color: textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});
