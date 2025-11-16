import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Avatar, Badge } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Scout } from '@/types';

export default function ScoutDashboardScreen() {
  const { user } = useAuth();
  const scout = user as Scout;
  const tintColor = useThemeColor({}, 'tint');

  // Données mockées pour la démo
  const stats = {
    points: scout?.points || 0,
    rank: 5,
    totalScouts: 24,
    completedChallenges: 12,
    upcomingEvents: 3,
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header avec profil */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <Avatar
              name={scout ? `${scout.firstName} ${scout.lastName}` : undefined}
              imageUrl={scout?.profilePicture}
              size="large"
            />
            <View style={styles.profileInfo}>
              <ThemedText type="title" style={styles.welcomeText}>
                Salut {scout?.firstName} ! 👋
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Prêt pour de nouvelles aventures ?
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Statistiques principales */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard} variant="elevated">
            <View style={[styles.iconBadge, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="trophy" size={24} color="#3b82f6" />
            </View>
            <ThemedText type="title" style={styles.statValue}>
              {stats.points}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Points</ThemedText>
          </Card>

          <Card style={styles.statCard} variant="elevated">
            <View style={[styles.iconBadge, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="ribbon" size={24} color="#f59e0b" />
            </View>
            <ThemedText type="title" style={styles.statValue}>
              #{stats.rank}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Classement</ThemedText>
          </Card>
        </View>

        {/* Défis en cours */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Défis en cours</ThemedText>
            <ThemedText type="link" style={styles.seeAllText}>
              Voir tout
            </ThemedText>
          </View>

          <Card style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <ThemedText type="defaultSemiBold" style={styles.challengeTitle}>
                🏕️ Premier campement
              </ThemedText>
              <Badge variant="warning" size="small">
                En cours
              </Badge>
            </View>
            <ThemedText style={styles.challengeDescription}>
              Participe à ton premier camp de week-end
            </ThemedText>
            <View style={styles.challengeFooter}>
              <View style={styles.pointsBadge}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <ThemedText style={styles.pointsText}>50 points</ThemedText>
              </View>
              <ThemedText style={styles.challengeDeadline}>
                Se termine dans 5 jours
              </ThemedText>
            </View>
          </Card>

          <Card style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <ThemedText type="defaultSemiBold" style={styles.challengeTitle}>
                🎯 Scout débrouillard
              </ThemedText>
              <Badge variant="info" size="small">
                Nouveau
              </Badge>
            </View>
            <ThemedText style={styles.challengeDescription}>
              Apprends à faire un feu de camp en toute sécurité
            </ThemedText>
            <View style={styles.challengeFooter}>
              <View style={styles.pointsBadge}>
                <Ionicons name="star" size={16} color="#f59e0b" />
                <ThemedText style={styles.pointsText}>30 points</ThemedText>
              </View>
              <ThemedText style={styles.challengeDeadline}>
                Se termine dans 12 jours
              </ThemedText>
            </View>
          </Card>
        </View>

        {/* Prochains événements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Prochains événements</ThemedText>
            <ThemedText type="link" style={styles.seeAllText}>
              Voir tout
            </ThemedText>
          </View>

          <Card style={styles.eventCard}>
            <View style={styles.eventDateBadge}>
              <ThemedText style={styles.eventDay}>15</ThemedText>
              <ThemedText style={styles.eventMonth}>NOV</ThemedText>
            </View>
            <View style={styles.eventContent}>
              <ThemedText type="defaultSemiBold" style={styles.eventTitle}>
                Réunion hebdomadaire
              </ThemedText>
              <View style={styles.eventInfo}>
                <Ionicons name="time-outline" size={14} color={tintColor} />
                <ThemedText style={styles.eventDetail}>14h00 - 17h00</ThemedText>
              </View>
              <View style={styles.eventInfo}>
                <Ionicons name="location-outline" size={14} color={tintColor} />
                <ThemedText style={styles.eventDetail}>Local scout</ThemedText>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
  },
  challengeCard: {
    marginBottom: 12,
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    flex: 1,
  },
  challengeDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
    lineHeight: 20,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  challengeDeadline: {
    fontSize: 12,
    opacity: 0.6,
  },
  eventCard: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  eventDateBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#3b82f620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  eventMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  eventContent: {
    flex: 1,
    gap: 6,
  },
  eventTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetail: {
    fontSize: 13,
    opacity: 0.7,
  },
});
