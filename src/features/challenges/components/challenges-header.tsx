import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChallengesHeaderProps {
  totalPoints: number;
}

export function ChallengesHeader({ totalPoints }: ChallengesHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Challenges</Text>
      <View style={styles.pointsContainer}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.points}>{totalPoints} pts</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  trophy: {
    fontSize: 20,
  },
  points: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
