import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ChallengesHeaderProps {
  totalPoints: number;
}

export function ChallengesHeader({ totalPoints }: ChallengesHeaderProps) {
  const warningBackground = useThemeColor({}, 'warningBackground');

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>Challenges</ThemedText>
      <View style={[styles.pointsContainer, { backgroundColor: warningBackground }]}>
        <ThemedText style={styles.trophy}>🏆</ThemedText>
        <ThemedText type="bodySemiBold">{totalPoints} pts</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  title: {
    letterSpacing: -0.5,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  trophy: {
    fontSize: 20,
  },
});
