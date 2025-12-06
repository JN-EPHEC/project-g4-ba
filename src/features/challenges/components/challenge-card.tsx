import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ChallengeCardProps {
  title: string;
  points: number;
  icon: string;
  iconBgColor: string;
  onPress?: () => void;
  completed?: boolean;
}

export function ChallengeCard({ title, points, icon, iconBgColor, onPress, completed = false }: ChallengeCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const successColor = useThemeColor({}, 'success');
  const successBackground = useThemeColor({}, 'successBackground');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: cardColor, borderColor: cardBorderColor },
        completed && { opacity: 0.7, borderColor: successColor, borderWidth: 2 }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {completed && (
        <View style={[styles.completedBadge, { backgroundColor: successColor }]}>
          <ThemedText color="inverse" style={styles.completedBadgeText}>✓</ThemedText>
        </View>
      )}
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }, completed && styles.iconCompleted]}>
        <ThemedText style={styles.iconText}>{icon}</ThemedText>
      </View>
      <ThemedText
        type="bodySemiBold"
        color={completed ? "secondary" : "default"}
        style={styles.title}
      >
        {title}
      </ThemedText>
      <View style={[
        styles.pointsContainer,
        { backgroundColor: surfaceSecondary },
        completed && { backgroundColor: successBackground }
      ]}>
        <ThemedText
          type="caption"
          color={completed ? "success" : "secondary"}
          style={styles.points}
        >
          {completed ? `${points} pts` : `+${points} pts`}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
    textAlign: 'center',
    marginBottom: 12,
  },
  pointsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  points: {
    fontWeight: '500',
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  completedBadgeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  iconCompleted: {
    opacity: 0.6,
  },
});
