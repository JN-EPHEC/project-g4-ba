import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Image, Text, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { RankBadge } from '@/components/rank-badge';
import { useAuth } from '@/context/auth-context';
import { SectionService } from '@/services/section-service';
import { LeaderboardService } from '@/services/leaderboard-service';
import { Section, Scout, UserRole, SECTION_LABELS, SECTION_COLORS, SECTION_EMOJIS } from '@/types';
import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

interface SectionMember {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  points?: number;
  profilePicture?: string;
  isSectionLeader?: boolean;
}

export default function SectionScreen() {
  const { user } = useAuth();
  const scout = user as Scout;
  const [section, setSection] = useState<Section | null>(null);
  const [members, setMembers] = useState<SectionMember[]>([]);
  const [sectionRank, setSectionRank] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  const loadSectionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!scout?.sectionId) {
        setError('Vous n\'êtes pas encore assigné à une section');
        return;
      }

      // Charger la section
      const sectionData = await SectionService.getSectionById(scout.sectionId);
      if (!sectionData) {
        setError('Section non trouvée');
        return;
      }
      setSection(sectionData);

      // Charger les membres avec leurs points
      const [scoutsData, animatorsData] = await Promise.all([
        SectionService.getScoutsBySection(scout.sectionId),
        SectionService.getAnimatorsBySection(scout.sectionId),
      ]);

      // Combiner les membres
      const allMembers: SectionMember[] = [
        ...animatorsData.map((a: any) => ({
          id: a.id,
          firstName: a.firstName,
          lastName: a.lastName,
          role: UserRole.ANIMATOR,
          profilePicture: a.profilePicture,
          isSectionLeader: a.isSectionLeader,
        })),
        ...scoutsData.map((s: any) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          role: UserRole.SCOUT,
          points: s.points || 0,
          profilePicture: s.profilePicture,
        })),
      ];
      setMembers(allMembers);

      // Calculer les points totaux de la section
      const total = scoutsData.reduce((sum: number, s: any) => sum + (s.points || 0), 0);
      setTotalPoints(total);

      // Charger le classement de la section
      if (scout.unitId) {
        const leaderboard = await LeaderboardService.getLeaderboardBySections(scout.unitId, scout.sectionId);
        const mySection = leaderboard.find(entry => entry.section.id === scout.sectionId);
        if (mySection) {
          const rank = leaderboard.indexOf(mySection) + 1;
          setSectionRank(rank);
        }
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement de la section:', err);
      setError(err.message || 'Impossible de charger les données de la section');
    } finally {
      setLoading(false);
    }
  }, [scout?.sectionId, scout?.unitId]);

  useFocusEffect(
    useCallback(() => {
      loadSectionData();
    }, [loadSectionData])
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={styles.loadingText}>Chargement de la section...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !section) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Section</ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🏕️</Text>
          <ThemedText style={styles.errorText}>{error || 'Section non trouvée'}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const sectionColor = SECTION_COLORS[section.sectionType] || BrandColors.primary[500];
  const sectionEmoji = SECTION_EMOJIS[section.sectionType] || '🏕️';
  const sectionLabel = SECTION_LABELS[section.sectionType] || section.sectionType;

  const scoutMembers = members.filter(m => m.role === UserRole.SCOUT);
  const animatorMembers = members.filter(m => m.role === UserRole.ANIMATOR);

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Header avec bouton retour */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={iconColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Ma Section</ThemedText>
        </View>

        {/* Carte principale de la section */}
        <Card style={[styles.sectionCard, { borderTopColor: sectionColor, borderTopWidth: 4 }]}>
          <View style={styles.sectionHeader}>
            {section.logoUrl ? (
              <Image source={{ uri: section.logoUrl }} style={styles.sectionLogo} />
            ) : (
              <View style={[styles.sectionLogoPlaceholder, { backgroundColor: `${sectionColor}20` }]}>
                <Text style={styles.sectionEmoji}>{sectionEmoji}</Text>
              </View>
            )}
            <View style={styles.sectionInfo}>
              <ThemedText type="title" style={styles.sectionName}>{section.name}</ThemedText>
              <View style={[styles.typeBadge, { backgroundColor: `${sectionColor}20` }]}>
                <ThemedText style={[styles.typeLabel, { color: sectionColor }]}>
                  {sectionEmoji} {sectionLabel}
                </ThemedText>
              </View>
            </View>
          </View>

          {section.description && (
            <ThemedText style={styles.description}>{section.description}</ThemedText>
          )}

          {/* Stats de la section */}
          <View style={[styles.statsRow, { borderTopColor: borderColor }]}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{scoutMembers.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Scouts</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: BrandColors.accent[500] }]}>{totalPoints}</ThemedText>
              <ThemedText style={styles.statLabel}>Points</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: borderColor }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: sectionColor }]}>
                {sectionRank ? `#${sectionRank}` : '-'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Classement</ThemedText>
            </View>
          </View>

          {/* Tranche d'âge */}
          <View style={[styles.ageRow, { borderTopColor: borderColor }]}>
            <Ionicons name="calendar-outline" size={16} color={iconColor} />
            <ThemedText style={styles.ageText}>
              {section.ageRange.min} - {section.ageRange.max} ans
            </ThemedText>
          </View>
        </Card>

        {/* Animateurs */}
        {animatorMembers.length > 0 && (
          <>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Animateurs ({animatorMembers.length})
            </ThemedText>
            <Card style={styles.membersCard}>
              {animatorMembers.map((member, index) => (
                <View
                  key={member.id}
                  style={[
                    styles.memberRow,
                    index < animatorMembers.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }
                  ]}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: BrandColors.accent[500] }]}>
                    <Text style={styles.avatarText}>
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <ThemedText style={styles.memberName}>
                        {member.firstName} {member.lastName}
                      </ThemedText>
                      {member.isSectionLeader && (
                        <View style={[styles.leaderBadge, { backgroundColor: `${BrandColors.accent[500]}20` }]}>
                          <ThemedText style={[styles.leaderBadgeText, { color: BrandColors.accent[600] }]}>
                            Chef
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText style={styles.memberRole}>Animateur</ThemedText>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Scouts */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Scouts ({scoutMembers.length})
        </ThemedText>
        {scoutMembers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏕️</Text>
            <ThemedText style={styles.emptyText}>Aucun scout dans cette section</ThemedText>
          </Card>
        ) : (
          <Card style={styles.membersCard}>
            {scoutMembers
              .sort((a, b) => (b.points || 0) - (a.points || 0))
              .map((member, index) => {
                const isMe = member.id === scout?.id;
                return (
                  <View
                    key={member.id}
                    style={[
                      styles.memberRow,
                      index < scoutMembers.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
                      isMe && { backgroundColor: `${BrandColors.primary[500]}08` }
                    ]}
                  >
                    <ThemedText style={styles.rankNumber}>{index + 1}</ThemedText>
                    <View style={[styles.memberAvatar, { backgroundColor: BrandColors.primary[500] }]}>
                      <Text style={styles.avatarText}>
                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <ThemedText style={[styles.memberName, isMe && { color: BrandColors.primary[600], fontWeight: '700' }]}>
                          {member.firstName} {member.lastName}
                          {isMe && ' (Moi)'}
                        </ThemedText>
                        <RankBadge xp={member.points || 0} size="small" />
                      </View>
                      <ThemedText style={styles.memberPoints}>
                        {member.points || 0} points
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
          </Card>
        )}
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorIcon: {
    fontSize: 64,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    flex: 1,
  },
  sectionCard: {
    padding: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  sectionLogo: {
    width: 72,
    height: 72,
    borderRadius: 20,
  },
  sectionLogoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionEmoji: {
    fontSize: 36,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 20,
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.primary[500],
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
  },
  ageText: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionTitle: {
    marginBottom: 12,
    color: BrandColors.primary[600],
  },
  membersCard: {
    padding: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  rankNumber: {
    width: 24,
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.secondary[500],
    textAlign: 'center',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  memberPoints: {
    fontSize: 13,
    color: BrandColors.accent[500],
    fontWeight: '500',
    marginTop: 2,
  },
  leaderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  leaderBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});
