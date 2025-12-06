import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

interface ProgressSectionProps {
  completed: number;
  total: number;
}

export function ProgressSection({ completed, total }: ProgressSectionProps) {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');

  return (
    <View style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
      <ThemedText type="subtitle" style={styles.title}>Votre progression</ThemedText>

      <View style={styles.progressHeader}>
        <ThemedText color="secondary">Challenges complétés</ThemedText>
        <ThemedText type="bodySemiBold">
          {completed} / {total}
        </ThemedText>
      </View>

      <View style={[styles.progressBarContainer, { backgroundColor: surfaceSecondary }]}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  title: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: BrandColors.accent[500],
    borderRadius: 4,
  },
});
