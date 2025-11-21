import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ChallengeCardProps {
  title: string;
  points: number;
  icon: string;
  iconBgColor: string;
  onPress?: () => void;
  completed?: boolean;
}

export function ChallengeCard({ title, points, icon, iconBgColor, onPress, completed = false }: ChallengeCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, completed && styles.cardCompleted]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {completed && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedBadgeText}>✓</Text>
        </View>
      )}
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }, completed && styles.iconCompleted]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={[styles.title, completed && styles.titleCompleted]}>{title}</Text>
      <View style={[styles.pointsContainer, completed && styles.pointsContainerCompleted]}>
        <Text style={[styles.points, completed && styles.pointsCompleted]}>
          {completed ? `${points} pts` : `+${points} pts`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  pointsContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  points: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  cardCompleted: {
    opacity: 0.7,
    borderColor: '#34C759',
    borderWidth: 2,
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  completedBadgeText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  iconCompleted: {
    opacity: 0.6,
  },
  titleCompleted: {
    color: '#666666',
  },
  pointsContainerCompleted: {
    backgroundColor: '#E8F5E9',
  },
  pointsCompleted: {
    color: '#34C759',
  },
});
