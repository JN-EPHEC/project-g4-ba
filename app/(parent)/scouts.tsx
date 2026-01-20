import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { Avatar } from '@/components/ui/avatar';
import { LinkScoutModal } from '@/components/link-scout-modal';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';
import { ParentScoutService } from '@/services/parent-scout-service';
import { Parent, Scout } from '@/types';
import { LevelService } from '@/services/level-service';

export default function ScoutsScreen() {
  const { user } = useAuth();
  const parent = user as Parent;

  const [scouts, setScouts] = useState<Scout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const loadScouts = useCallback(async () => {
    if (!parent?.id) return;

    try {
      const linkedScouts = await ParentScoutService.getScoutsByParent(parent.id);
      setScouts(linkedScouts);
    } catch (error) {
      console.error('Erreur lors du chargement des scouts:', error);
    }
  }, [parent?.id]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadScouts();
      setIsLoading(false);
    };
    load();
  }, [loadScouts]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadScouts();
    setIsRefreshing(false);
  };

  const handleScoutLinked = () => {
    loadScouts();
  };

  const handleScoutPress = (scoutId: string) => {
    router.push(`/(parent)/scouts/${scoutId}`);
  };

  const getRankBadge = (points: number) => {
    const levelInfo = LevelService.getScoutLevelInfoSync(points);
    return {
      name: levelInfo.currentLevel.name,
      color: levelInfo.currentLevel.color,
      icon: levelInfo.currentLevel.icon,
    };
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(400)}>
          <View style={styles.header}>
            <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
              Mes Enfants
            </ThemedText>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: BrandColors.primary[500] }]}
              onPress={() => setShowLinkModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {scouts.length === 0 ? (
          /* Empty State */
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Card style={[styles.emptyCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
              <View style={[styles.emptyIconContainer, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                <Ionicons name="people-outline" size={48} color={BrandColors.primary[500]} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                Aucun scout lié
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                Liez vos enfants scouts pour suivre leur progression, signer les documents et gérer leur fiche santé.
              </ThemedText>
              <TouchableOpacity
                style={[styles.linkButton, { backgroundColor: BrandColors.primary[500] }]}
                onPress={() => setShowLinkModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
                <ThemedText style={styles.linkButtonText}>Lier un scout</ThemedText>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        ) : (
          /* Scouts List */
          <>
            <Animated.View entering={FadeInDown.duration(300)}>
              <ThemedText style={[styles.sectionLabel, { color: textSecondary }]}>
                {scouts.length} scout{scouts.length > 1 ? 's' : ''} lié{scouts.length > 1 ? 's' : ''}
              </ThemedText>
            </Animated.View>

            {scouts.map((scout, index) => {
              const rank = getRankBadge(scout.points);
              return (
                <Animated.View
                  key={scout.id}
                  entering={FadeInDown.duration(300).delay(index * 100)}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleScoutPress(scout.id)}
                  >
                    <Card style={[styles.scoutCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
                      <View style={styles.scoutHeader}>
                        <Avatar
                          source={scout.profilePicture}
                          name={`${scout.firstName} ${scout.lastName}`}
                          size="large"
                        />
                        <View style={styles.scoutInfo}>
                          <ThemedText style={[styles.scoutName, { color: textColor }]}>
                            {scout.firstName} {scout.lastName}
                          </ThemedText>
                          {scout.totemName && (
                            <ThemedText style={[styles.scoutTotem, { color: textSecondary }]}>
                              {scout.totemEmoji || '🦊'} {scout.totemName}
                            </ThemedText>
                          )}
                          <View style={[styles.rankBadge, { backgroundColor: `${rank.color}15` }]}>
                            <ThemedText style={styles.rankIcon}>{rank.icon}</ThemedText>
                            <ThemedText style={[styles.rankName, { color: rank.color }]}>
                              {rank.name}
                            </ThemedText>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={textSecondary} />
                      </View>

                      {/* Stats Row */}
                      <View style={[styles.statsRow, { borderTopColor: cardBorder }]}>
                        <View style={styles.statItem}>
                          <Ionicons name="star" size={18} color={BrandColors.accent[500]} />
                          <ThemedText style={[styles.statValue, { color: textColor }]}>
                            {scout.points}
                          </ThemedText>
                          <ThemedText style={[styles.statLabel, { color: textSecondary }]}>
                            points
                          </ThemedText>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: cardBorder }]} />
                        <View style={styles.statItem}>
                          <Ionicons
                            name={scout.validated ? 'checkmark-circle' : 'time'}
                            size={18}
                            color={scout.validated ? '#10b981' : '#f59e0b'}
                          />
                          <ThemedText style={[styles.statValue, { color: textColor }]}>
                            {scout.validated ? 'Validé' : 'En attente'}
                          </ThemedText>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}

            {/* Add Another Scout Button */}
            <Animated.View entering={FadeInDown.duration(300).delay(scouts.length * 100)}>
              <TouchableOpacity
                style={[styles.addAnotherButton, { borderColor: BrandColors.primary[500] }]}
                onPress={() => setShowLinkModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={24} color={BrandColors.primary[500]} />
                <ThemedText style={[styles.addAnotherText, { color: BrandColors.primary[500] }]}>
                  Lier un autre scout
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Link Scout Modal */}
      <LinkScoutModal
        visible={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        parentId={parent?.id || ''}
        onScoutLinked={handleScoutLinked}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    marginBottom: 0,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    marginLeft: 4,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scoutCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xl,
  },
  scoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  scoutInfo: {
    flex: 1,
  },
  scoutName: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoutTotem: {
    fontSize: 14,
    marginTop: 2,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  rankIcon: {
    fontSize: 14,
  },
  rankName: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.xl,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    marginTop: Spacing.sm,
  },
  addAnotherText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
