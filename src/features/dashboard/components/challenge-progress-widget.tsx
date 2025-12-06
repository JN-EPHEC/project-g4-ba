import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { WidgetCard } from './widget-card';
import { ChallengeService } from '@/services/challenge-service';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';

interface ChallengeProgressWidgetProps {
  scoutId: string;
  unitId: string;
  delay?: number;
}

interface ProgressData {
  totalChallenges: number;
  completedChallenges: number;
  pendingValidation: number;
  totalPoints: number;
  earnedPoints: number;
}

export function ChallengeProgressWidget({
  scoutId,
  unitId,
  delay = 0,
}: ChallengeProgressWidgetProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressData>({
    totalChallenges: 0,
    completedChallenges: 0,
    pendingValidation: 0,
    totalPoints: 0,
    earnedPoints: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    try {
      // Récupérer tous les défis de l'unité
      const challenges = await ChallengeService.getByUnit(unitId);
      const activeChallenges = challenges.filter(
        (c) => new Date(c.endDate) >= new Date()
      );

      // Récupérer les soumissions du scout
      const submissions = await ChallengeSubmissionService.getByScout(scoutId);

      const completedIds = new Set(
        submissions.filter((s) => s.status === 'validated').map((s) => s.challengeId)
      );
      const pendingIds = new Set(
        submissions.filter((s) => s.status === 'pending').map((s) => s.challengeId)
      );

      const totalPoints = activeChallenges.reduce((sum, c) => sum + c.points, 0);
      const earnedPoints = activeChallenges
        .filter((c) => completedIds.has(c.id))
        .reduce((sum, c) => sum + c.points, 0);

      setProgress({
        totalChallenges: activeChallenges.length,
        completedChallenges: completedIds.size,
        pendingValidation: pendingIds.size,
        totalPoints,
        earnedPoints,
      });
    } catch (error) {
      console.error('[ChallengeProgressWidget] Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  }, [scoutId, unitId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleNavigateToChallenges = () => {
    router.push('/(scout)/challenges');
  };

  const progressPercent =
    progress.totalChallenges > 0
      ? (progress.completedChallenges / progress.totalChallenges) * 100
      : 0;

  // SVG Circle Progress
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  if (isLoading) {
    return (
      <WidgetCard
        title="Mes défis"
        icon="trophy"
        iconColor="#f97316"
        delay={delay}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#f97316" />
        </View>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Mes défis"
      icon="trophy"
      iconColor="#f97316"
      showSeeAll
      seeAllText="Voir les défis"
      onHeaderPress={handleNavigateToChallenges}
      delay={delay}
    >
      <View style={styles.content}>
        {/* Cercle de progression */}
        <View style={styles.progressCircleContainer}>
          <Svg width={size} height={size}>
            {/* Cercle de fond */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#3A3A3A"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Cercle de progression */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f97316"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.progressText}>
            <ThemedText style={styles.progressPercent}>
              {Math.round(progressPercent)}%
            </ThemedText>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
            <ThemedText style={styles.statLabel}>Complétés</ThemedText>
            <ThemedText style={styles.statValue}>
              {progress.completedChallenges}/{progress.totalChallenges}
            </ThemedText>
          </View>

          {progress.pendingValidation > 0 && (
            <View style={styles.statRow}>
              <Ionicons name="time" size={18} color="#eab308" />
              <ThemedText style={styles.statLabel}>En attente</ThemedText>
              <ThemedText style={[styles.statValue, { color: '#eab308' }]}>
                {progress.pendingValidation}
              </ThemedText>
            </View>
          )}

          <View style={styles.statRow}>
            <Ionicons name="star" size={18} color="#3b82f6" />
            <ThemedText style={styles.statLabel}>Points gagnés</ThemedText>
            <ThemedText style={[styles.statValue, { color: '#3b82f6' }]}>
              {progress.earnedPoints}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* CTA si des défis sont disponibles */}
      {progress.totalChallenges > progress.completedChallenges && (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleNavigateToChallenges}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.ctaText}>
            {progress.totalChallenges - progress.completedChallenges} défi(s) à relever
          </ThemedText>
          <Ionicons name="arrow-forward" size={16} color="#f97316" />
        </TouchableOpacity>
      )}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  progressCircleContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statsContainer: {
    flex: 1,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    color: '#999',
    fontSize: 13,
    flex: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9731620',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  ctaText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '500',
  },
});
