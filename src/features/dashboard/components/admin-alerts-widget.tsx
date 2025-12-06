import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WidgetCard } from './widget-card';
import { useNotifications } from '@/context/notification-context';

interface AdminAlertsWidgetProps {
  delay?: number;
}

export function AdminAlertsWidget({ delay = 0 }: AdminAlertsWidgetProps) {
  const router = useRouter();
  const { pendingScouts, pendingChallenges } = useNotifications();

  const totalPending = pendingScouts + pendingChallenges;

  const handleNavigateToValidateScouts = () => {
    router.push('/(animator)/validate-scouts');
  };

  const handleNavigateToValidateChallenges = () => {
    router.push('/(animator)/validate-challenges');
  };

  const handleNavigateToManagement = () => {
    router.push('/(animator)/management');
  };

  return (
    <WidgetCard
      title="Actions requises"
      icon="alert-circle"
      iconColor="#ef4444"
      badge={totalPending > 0 ? totalPending : undefined}
      showSeeAll
      seeAllText="Gestion"
      onHeaderPress={handleNavigateToManagement}
      delay={delay}
    >
      {totalPending === 0 ? (
        <View style={styles.allGood}>
          <Ionicons name="checkmark-circle" size={40} color="#22c55e" />
          <ThemedText style={styles.allGoodText}>Tout est à jour !</ThemedText>
          <ThemedText style={styles.allGoodSubtext}>
            Aucune validation en attente
          </ThemedText>
        </View>
      ) : (
        <View style={styles.alertsList}>
          {/* Scouts en attente */}
          {pendingScouts > 0 && (
            <TouchableOpacity
              style={styles.alertItem}
              onPress={handleNavigateToValidateScouts}
              activeOpacity={0.7}
            >
              <View style={[styles.alertIcon, { backgroundColor: '#3b82f620' }]}>
                <Ionicons name="person-add" size={20} color="#3b82f6" />
              </View>
              <View style={styles.alertContent}>
                <ThemedText style={styles.alertTitle}>Scouts en attente</ThemedText>
                <ThemedText style={styles.alertDescription}>
                  {pendingScouts} inscription(s) à valider
                </ThemedText>
              </View>
              <View style={styles.alertBadge}>
                <ThemedText style={styles.alertBadgeText}>{pendingScouts}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {/* Défis en attente */}
          {pendingChallenges > 0 && (
            <TouchableOpacity
              style={styles.alertItem}
              onPress={handleNavigateToValidateChallenges}
              activeOpacity={0.7}
            >
              <View style={[styles.alertIcon, { backgroundColor: '#f9731620' }]}>
                <Ionicons name="trophy" size={20} color="#f97316" />
              </View>
              <View style={styles.alertContent}>
                <ThemedText style={styles.alertTitle}>Défis à valider</ThemedText>
                <ThemedText style={styles.alertDescription}>
                  {pendingChallenges} soumission(s) en attente
                </ThemedText>
              </View>
              <View style={[styles.alertBadge, { backgroundColor: '#f97316' }]}>
                <ThemedText style={styles.alertBadgeText}>{pendingChallenges}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  allGood: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  allGoodText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  allGoodSubtext: {
    color: '#666',
    fontSize: 14,
  },
  alertsList: {
    gap: 10,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  alertDescription: {
    color: '#999',
    fontSize: 13,
  },
  alertBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: 'center',
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
