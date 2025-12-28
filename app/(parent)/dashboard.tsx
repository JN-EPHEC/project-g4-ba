import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar, Badge, Card } from '@/components/ui';
import { RankBadge } from '@/components/rank-badge';
import { LinkScoutModal } from '@/components/link-scout-modal';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ParentScoutService } from '@/services/parent-scout-service';
import { Parent, Scout, UserRole } from '@/types';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';
import { getDisplayName } from '@/src/shared/utils/totem-utils';

export default function ParentDashboardScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const parent = user as Parent;
  const { parentPendingDocumentsCount } = useNotifications();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Vérification de sécurité - rediriger si ce n'est pas un parent
  useEffect(() => {
    if (!isAuthLoading && user && user.role !== UserRole.PARENT && user.role !== 'parent') {
      console.log('⚠️ ParentDashboard - Mauvais rôle détecté:', user.role, '- redirection...');
      // Rediriger vers le bon dashboard selon le rôle
      if (user.role === UserRole.SCOUT || user.role === 'scout') {
        router.replace('/(scout)/dashboard');
      } else if (user.role === UserRole.ANIMATOR || user.role === 'animator') {
        router.replace('/(animator)/dashboard');
      }
    }
  }, [user, isAuthLoading]);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  useEffect(() => {
    loadScouts();
  }, [parent?.id]);

  const loadScouts = async () => {
    if (!parent?.id) return;

    try {
      setIsLoading(true);
      const parentScouts = await ParentScoutService.getScoutsByParent(parent.id);
      setScouts(parentScouts);
    } catch (error) {
      console.error('Erreur lors du chargement des scouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        <ThemedText type="title" style={[styles.title, { color: textColor }]}>
          Bonjour {parent?.firstName}
        </ThemedText>

        {/* Stats Cards - Nature Theme */}
        <View style={styles.statsRow}>
          <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.statCardWrapper}>
            <View style={[styles.statCard, { backgroundColor: BrandColors.primary[500] }]}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="people" size={24} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.statValue}>{scouts.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Scouts</ThemedText>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.statCardWrapper}>
            <TouchableOpacity
              style={[styles.statCard, { backgroundColor: BrandColors.accent[500] }]}
              onPress={() => router.push('/(parent)/documents')}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="document-text" size={24} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.statValue}>{parentPendingDocumentsCount}</ThemedText>
              <ThemedText style={styles.statLabel}>À signer</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Section Scouts */}
        <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Mes scouts
          </ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          </View>
        ) : scouts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <Ionicons name="people-outline" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              Aucun scout lié pour le moment
            </ThemedText>
            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: BrandColors.accent[500] }]}
              onPress={() => setShowLinkModal(true)}
            >
              <ThemedText style={styles.linkButtonText}>Lier un scout</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          scouts.map((scout, index) => (
            <Animated.View
              key={scout.id}
              entering={FadeInLeft.duration(400).delay(300 + index * 100)}
            >
              <TouchableOpacity
                style={[styles.scoutCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
                activeOpacity={0.7}
                onPress={() => router.push(`/(parent)/scouts/${scout.id}`)}
              >
                <Avatar
                  name={getDisplayName(scout, { showTotem: false })}
                  imageUrl={scout.profilePicture}
                  size="medium"
                />
                <View style={styles.scoutInfo}>
                  <View style={styles.nameRow}>
                    <ThemedText style={[styles.scoutName, { color: textColor }]}>
                      {getDisplayName(scout)}
                    </ThemedText>
                    <RankBadge xp={scout.points || 0} size="small" />
                  </View>
                  <View style={styles.scoutStats}>
                    <View style={[styles.pointsBadge, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                      <Ionicons name="star" size={14} color={BrandColors.accent[500]} />
                      <ThemedText style={[styles.pointsText, { color: BrandColors.accent[500] }]}>
                        {scout.points || 0} points
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: BrandColors.primary[500] }]} />
                  <ThemedText style={[styles.statusText, { color: BrandColors.primary[500] }]}>
                    Actif
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}

        {/* Quick Actions */}
        {scouts.length > 0 && (
          <View style={styles.actionsSection}>
            <ThemedText style={[styles.sectionTitle, { color: textColor, marginBottom: Spacing.md }]}>
              Actions rapides
            </ThemedText>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
                activeOpacity={0.7}
                onPress={() => router.push('/(parent)/challenges')}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                  <Ionicons name="checkmark-circle" size={24} color={BrandColors.primary[500]} />
                </View>
                <ThemedText style={[styles.actionText, { color: textColor }]}>Validations</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
                activeOpacity={0.7}
                onPress={() => router.push('/(parent)/messages')}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                  <Ionicons name="chatbubbles" size={24} color={BrandColors.accent[500]} />
                </View>
                <ThemedText style={[styles.actionText, { color: textColor }]}>Messages</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
                activeOpacity={0.7}
                onPress={() => router.push('/(parent)/documents')}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.secondary[500]}15` }]}>
                  <Ionicons name="document" size={24} color={BrandColors.secondary[500]} />
                </View>
                <ThemedText style={[styles.actionText, { color: textColor }]}>Documents</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Link Scout Modal */}
      <LinkScoutModal
        visible={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        parentId={parent?.id || ''}
        onScoutLinked={loadScouts}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    marginBottom: Spacing.xl,
    fontSize: 28,
    fontWeight: '700',
  },

  // Stats Cards
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Section Header
  sectionHeader: {
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Scout Cards
  scoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  scoutInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  scoutName: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
  },
  linkButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },

  // Loading
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },

  // Actions Section
  actionsSection: {
    marginTop: Spacing.xl,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
