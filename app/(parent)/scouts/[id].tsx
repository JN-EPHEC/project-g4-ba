import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';
import { UserService } from '@/services/user-service';
import { HealthService } from '@/services/health-service';
import { DocumentService } from '@/services/document-service';
import { Parent, Scout, HealthRecord, Document } from '@/types';
import { LevelService } from '@/services/level-service';
import { BadgeService, BadgeWithDetails } from '@/services/badge-service';

export default function ScoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const parent = user as Parent;

  const [scout, setScout] = useState<Scout | null>(null);
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [pendingDocs, setPendingDocs] = useState<Document[]>([]);
  const [badges, setBadges] = useState<BadgeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      // Charger le scout
      const scoutData = await UserService.getUserById(id);
      if (scoutData && scoutData.role === 'scout') {
        setScout(scoutData as Scout);

        // Charger la fiche santé
        const health = await HealthService.getHealthRecord(id);
        setHealthRecord(health);

        // Charger les documents en attente
        if ((scoutData as Scout).unitId) {
          const docs = await DocumentService.getPendingDocumentsForScout(id, (scoutData as Scout).unitId);
          setPendingDocs(docs);
        }

        // Charger les badges
        try {
          const scoutBadges = await BadgeService.getScoutBadges(id);
          setBadges(scoutBadges.filter(b => b.unlocked));
        } catch {
          // Pas de badges
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    load();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!scout) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-outline" size={48} color={textSecondary} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            Scout introuvable
          </ThemedText>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={{ color: BrandColors.primary[500] }}>Retour</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const levelInfo = LevelService.getScoutLevelInfoSync(scout.points || 0);
  const healthStatus = !healthRecord
    ? { label: 'Manquante', color: '#ef4444', icon: 'alert-circle' }
    : { label: 'Enregistrée', color: '#10b981', icon: 'checkmark-circle' };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header avec retour */}
        <Animated.View entering={FadeInUp.duration(300)}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <ThemedText type="title" style={[styles.headerTitle, { color: BrandColors.primary[600] }]}>
              Profil Scout
            </ThemedText>
            <View style={{ width: 40 }} />
          </View>
        </Animated.View>

        {/* Profil Card */}
        <Animated.View entering={FadeInDown.duration(300).delay(50)}>
          <Card style={[styles.profileCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <Avatar
              source={scout.profilePicture}
              name={`${scout.firstName} ${scout.lastName}`}
              size="xlarge"
            />
            <ThemedText style={[styles.scoutName, { color: textColor }]}>
              {scout.firstName} {scout.lastName}
            </ThemedText>
            {scout.totemName && (
              <View style={styles.totemRow}>
                <ThemedText style={styles.totemEmoji}>{scout.totemEmoji || '🦊'}</ThemedText>
                <ThemedText style={[styles.totemName, { color: textSecondary }]}>
                  {scout.totemName}
                </ThemedText>
              </View>
            )}

            {/* Level Badge */}
            <View style={[styles.levelBadge, { backgroundColor: `${levelInfo.currentLevel.color}15` }]}>
              <ThemedText style={styles.levelIcon}>{levelInfo.currentLevel.icon}</ThemedText>
              <ThemedText style={[styles.levelName, { color: levelInfo.currentLevel.color }]}>
                {levelInfo.currentLevel.name}
              </ThemedText>
            </View>

            {/* Points */}
            <View style={styles.pointsContainer}>
              <Ionicons name="star" size={20} color={BrandColors.accent[500]} />
              <ThemedText style={[styles.pointsText, { color: textColor }]}>
                {scout.points} points
              </ThemedText>
            </View>

            {/* Progress Bar */}
            {!levelInfo.isMaxLevel && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <ThemedText style={[styles.progressLabel, { color: textSecondary }]}>
                    Progression vers {levelInfo.nextLevel?.name}
                  </ThemedText>
                  <ThemedText style={[styles.progressPercent, { color: levelInfo.currentLevel.color }]}>
                    {Math.round(levelInfo.progress)}%
                  </ThemedText>
                </View>
                <View style={[styles.progressBar, { backgroundColor: cardBorder }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${levelInfo.progress}%`,
                        backgroundColor: levelInfo.currentLevel.color,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={[styles.progressInfo, { color: textSecondary }]}>
                  {levelInfo.pointsToNextLevel} points restants
                </ThemedText>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            ACTIONS RAPIDES
          </ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
              onPress={() => router.push(`/(parent)/scouts/${id}/health`)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${healthStatus.color}15` }]}>
                <Ionicons name="medical" size={24} color={healthStatus.color} />
              </View>
              <ThemedText style={[styles.actionLabel, { color: textColor }]}>Fiche Santé</ThemedText>
              <View style={[styles.actionBadge, { backgroundColor: `${healthStatus.color}15` }]}>
                <Ionicons name={healthStatus.icon as any} size={14} color={healthStatus.color} />
                <ThemedText style={[styles.actionBadgeText, { color: healthStatus.color }]}>
                  {healthStatus.label}
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
              onPress={() => router.push('/(parent)/documents')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                <Ionicons name="document-text" size={24} color={BrandColors.primary[500]} />
              </View>
              <ThemedText style={[styles.actionLabel, { color: textColor }]}>Documents</ThemedText>
              {pendingDocs.length > 0 && (
                <View style={[styles.actionBadge, { backgroundColor: '#fef3c7' }]}>
                  <ThemedText style={[styles.actionBadgeText, { color: '#d97706' }]}>
                    {pendingDocs.length} à signer
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Badges Section */}
        {badges.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300).delay(150)}>
            <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
              BADGES OBTENUS ({badges.length})
            </ThemedText>
            <Card style={[styles.badgesCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
              <View style={styles.badgesGrid}>
                {badges.slice(0, 6).map((badge, index) => (
                  <View key={badge.id} style={styles.badgeItem}>
                    <View style={[styles.badgeIcon, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                      <ThemedText style={styles.badgeEmoji}>{badge.icon}</ThemedText>
                    </View>
                    <ThemedText style={[styles.badgeName, { color: textColor }]} numberOfLines={1}>
                      {badge.name}
                    </ThemedText>
                  </View>
                ))}
              </View>
              {badges.length > 6 && (
                <ThemedText style={[styles.moreBadges, { color: textSecondary }]}>
                  +{badges.length - 6} autres badges
                </ThemedText>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Health Summary */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            FICHE SANTÉ
          </ThemedText>
          <Card style={[styles.healthCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            {!healthRecord ? (
              <View style={styles.healthEmpty}>
                <Ionicons name="medical-outline" size={32} color={textSecondary} />
                <ThemedText style={[styles.healthEmptyText, { color: textSecondary }]}>
                  Aucune fiche santé enregistrée
                </ThemedText>
                <TouchableOpacity
                  style={[styles.healthButton, { backgroundColor: BrandColors.primary[500] }]}
                  onPress={() => router.push(`/(parent)/scouts/${id}/health`)}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.healthButtonText}>Créer la fiche</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.healthRow}>
                  <View style={styles.healthItem}>
                    <ThemedText style={[styles.healthLabel, { color: textSecondary }]}>
                      Groupe sanguin
                    </ThemedText>
                    <ThemedText style={[styles.healthValue, { color: textColor }]}>
                      {healthRecord.bloodType || 'Non renseigné'}
                    </ThemedText>
                  </View>
                  <View style={styles.healthItem}>
                    <ThemedText style={[styles.healthLabel, { color: textSecondary }]}>
                      Allergies
                    </ThemedText>
                    <ThemedText style={[styles.healthValue, { color: textColor }]}>
                      {healthRecord.allergies?.length || 0}
                    </ThemedText>
                  </View>
                  <View style={styles.healthItem}>
                    <ThemedText style={[styles.healthLabel, { color: textSecondary }]}>
                      Médicaments
                    </ThemedText>
                    <ThemedText style={[styles.healthValue, { color: textColor }]}>
                      {healthRecord.medications?.length || 0}
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.healthDivider, { backgroundColor: cardBorder }]} />

                <View style={styles.healthStatus}>
                  <View style={[styles.statusBadge, { backgroundColor: `${healthStatus.color}15` }]}>
                    <Ionicons name={healthStatus.icon as any} size={16} color={healthStatus.color} />
                    <ThemedText style={[styles.statusText, { color: healthStatus.color }]}>
                      {healthStatus.label}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => router.push(`/(parent)/scouts/${id}/health`)}
                  >
                    <ThemedText style={[styles.editButtonText, { color: BrandColors.primary[500] }]}>
                      Modifier
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={16} color={BrandColors.primary[500]} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Card>
        </Animated.View>

        {/* Info Section */}
        <Animated.View entering={FadeInDown.duration(300).delay(250)}>
          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            INFORMATIONS
          </ThemedText>
          <Card style={[styles.infoCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={textSecondary} />
              <ThemedText style={[styles.infoLabel, { color: textSecondary }]}>
                Date de naissance
              </ThemedText>
              <ThemedText style={[styles.infoValue, { color: textColor }]}>
                {scout.dateOfBirth
                  ? new Date(scout.dateOfBirth).toLocaleDateString('fr-FR')
                  : 'Non renseignée'}
              </ThemedText>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: cardBorder }]} />
            <View style={styles.infoRow}>
              <Ionicons
                name={scout.validated ? 'checkmark-circle' : 'time'}
                size={20}
                color={scout.validated ? '#10b981' : '#f59e0b'}
              />
              <ThemedText style={[styles.infoLabel, { color: textSecondary }]}>
                Statut
              </ThemedText>
              <ThemedText
                style={[
                  styles.infoValue,
                  { color: scout.validated ? '#10b981' : '#f59e0b' },
                ]}
              >
                {scout.validated ? 'Validé par l\'animateur' : 'En attente de validation'}
              </ThemedText>
            </View>
          </Card>
        </Animated.View>
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
  },
  profileCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  scoutName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  totemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  totemEmoji: {
    fontSize: 18,
  },
  totemName: {
    fontSize: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  levelIcon: {
    fontSize: 16,
  },
  levelName: {
    fontSize: 14,
    fontWeight: '600',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressSection: {
    width: '100%',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: 13,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgesCard: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: 11,
    textAlign: 'center',
  },
  moreBadges: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  healthCard: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  healthEmpty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  healthEmptyText: {
    fontSize: 14,
  },
  healthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  healthButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthItem: {
    alignItems: 'center',
    flex: 1,
  },
  healthLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  healthDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  healthStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
});
