import React, { useEffect, useState, useCallback } from 'react';
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
import { HealthService } from '@/services/health-service';
import { EventService } from '@/services/event-service';
import { UnitService } from '@/services/unit-service';
import { Parent, Scout, UserRole, Event } from '@/types';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';
import { getDisplayName } from '@/src/shared/utils/totem-utils';

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function ParentDashboardScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const parent = user as Parent;
  const { parentPendingDocumentsCount } = useNotifications();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [scoutHealthStatus, setScoutHealthStatus] = useState<Record<string, boolean>>({});
  const [missingHealthCount, setMissingHealthCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [unitsCache, setUnitsCache] = useState<Record<string, string>>({});

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

  // Charger les événements quand les scouts changent
  const loadUpcomingEvents = useCallback(async () => {
    if (scouts.length === 0) {
      setUpcomingEvents([]);
      return;
    }

    try {
      // Récupérer les unitIds uniques des scouts
      const unitIds = [...new Set(scouts.map(s => s.unitId).filter(Boolean))];

      if (unitIds.length === 0) {
        setUpcomingEvents([]);
        return;
      }

      // Charger les événements de toutes les unités
      const allEventsArrays = await Promise.all(
        unitIds.map(unitId => EventService.getUpcomingEvents(unitId))
      );

      // Fusionner et dédupliquer
      const allEvents = allEventsArrays.flat();
      const uniqueEvents = Array.from(
        new Map(allEvents.map(e => [e.id, e])).values()
      );

      // Trier par date et prendre les 3 premiers
      uniqueEvents.sort((a, b) => {
        const dateA = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
        const dateB = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
        return dateA.getTime() - dateB.getTime();
      });

      setUpcomingEvents(uniqueEvents.slice(0, 3));

      // Charger les noms des unités
      const newUnitsCache: Record<string, string> = {};
      await Promise.all(
        unitIds.map(async (unitId) => {
          try {
            const unit = await UnitService.getUnitById(unitId);
            if (unit) {
              newUnitsCache[unitId] = unit.name;
            }
          } catch (err) {
            console.error(`Erreur chargement unité ${unitId}:`, err);
          }
        })
      );
      setUnitsCache(newUnitsCache);
    } catch (error) {
      console.error('Erreur chargement événements:', error);
    }
  }, [scouts]);

  useEffect(() => {
    loadUpcomingEvents();
  }, [loadUpcomingEvents]);

  const formatEventDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  };

  const formatEventTime = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const loadScouts = useCallback(async () => {
    if (!parent?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const parentScouts = await ParentScoutService.getScoutsByParent(parent.id);
      setScouts(parentScouts);

      // Vérifier les fiches santé pour chaque scout
      // Une fiche est considérée comme complète si elle a des contacts d'urgence ET est signée par un parent
      const healthStatus: Record<string, boolean> = {};
      let missingCount = 0;

      await Promise.all(
        parentScouts.map(async (scout) => {
          try {
            const healthRecord = await HealthService.getHealthRecord(scout.id);
            // Vérifier si la fiche existe ET est complète (contacts + signature)
            const isComplete = healthRecord ? HealthService.isHealthRecordComplete(healthRecord) : false;
            healthStatus[scout.id] = isComplete;
            if (!isComplete) missingCount++;
          } catch {
            healthStatus[scout.id] = false;
            missingCount++;
          }
        })
      );

      setScoutHealthStatus(healthStatus);
      setMissingHealthCount(missingCount);
    } catch (error) {
      console.error('Erreur lors du chargement des scouts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [parent?.id]);

  useEffect(() => {
    loadScouts();
  }, [loadScouts]);

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

        {/* Alerte fiches santé manquantes */}
        {missingHealthCount > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(250)}>
            <TouchableOpacity
              style={styles.healthAlert}
              onPress={() => {
                // Naviguer vers le premier scout sans fiche santé
                const scoutWithoutHealth = scouts.find(s => !scoutHealthStatus[s.id]);
                if (scoutWithoutHealth) {
                  router.push(`/(parent)/scouts/${scoutWithoutHealth.id}/health`);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.healthAlertIcon}>
                <Ionicons name="medical" size={24} color="#ef4444" />
              </View>
              <View style={styles.healthAlertContent}>
                <ThemedText style={styles.healthAlertTitle}>
                  {missingHealthCount} fiche{missingHealthCount > 1 ? 's' : ''} santé manquante{missingHealthCount > 1 ? 's' : ''}
                </ThemedText>
                <ThemedText style={styles.healthAlertDesc}>
                  Complétez les fiches pour les activités
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ef4444" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Widget Événements à venir */}
        {upcomingEvents.length > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(280)}>
            <TouchableOpacity
              style={[styles.eventsWidget, { backgroundColor: cardColor, borderColor: cardBorder }]}
              onPress={() => router.push('/(parent)/events')}
              activeOpacity={0.8}
            >
              <View style={styles.eventsWidgetHeader}>
                <View style={styles.eventsWidgetTitleRow}>
                  <Ionicons name="calendar" size={20} color={BrandColors.secondary[500]} />
                  <ThemedText style={[styles.eventsWidgetTitle, { color: textColor }]}>
                    Prochains événements
                  </ThemedText>
                </View>
                <View style={styles.eventsWidgetBadge}>
                  <ThemedText style={styles.eventsWidgetBadgeText}>
                    {upcomingEvents.length}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.eventsWidgetList}>
                {upcomingEvents.map((event, index) => (
                  <View
                    key={event.id}
                    style={[
                      styles.eventWidgetItem,
                      index < upcomingEvents.length - 1 && { borderBottomWidth: 1, borderBottomColor: cardBorder }
                    ]}
                  >
                    <View style={[styles.eventDateBadge, { backgroundColor: `${BrandColors.secondary[500]}15` }]}>
                      <ThemedText style={[styles.eventDateDay, { color: BrandColors.secondary[600] }]}>
                        {new Date(event.startDate).getDate()}
                      </ThemedText>
                      <ThemedText style={[styles.eventDateMonth, { color: BrandColors.secondary[500] }]}>
                        {MONTHS_SHORT[new Date(event.startDate).getMonth()]}
                      </ThemedText>
                    </View>
                    <View style={styles.eventWidgetInfo}>
                      <ThemedText style={[styles.eventWidgetTitle, { color: textColor }]} numberOfLines={1}>
                        {event.title}
                      </ThemedText>
                      <View style={styles.eventWidgetMeta}>
                        <Ionicons name="time-outline" size={12} color={textSecondary} />
                        <ThemedText style={[styles.eventWidgetMetaText, { color: textSecondary }]}>
                          {formatEventTime(event.startDate)}
                        </ThemedText>
                        {event.unitId && unitsCache[event.unitId] && (
                          <>
                            <ThemedText style={[styles.eventWidgetMetaText, { color: textSecondary }]}>•</ThemedText>
                            <ThemedText style={[styles.eventWidgetMetaText, { color: textSecondary }]} numberOfLines={1}>
                              {unitsCache[event.unitId]}
                            </ThemedText>
                          </>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={textSecondary} />
                  </View>
                ))}
              </View>
              <View style={styles.eventsWidgetFooter}>
                <ThemedText style={[styles.eventsWidgetFooterText, { color: BrandColors.secondary[500] }]}>
                  Voir tous les événements
                </ThemedText>
                <Ionicons name="arrow-forward" size={14} color={BrandColors.secondary[500]} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

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
                    {!scoutHealthStatus[scout.id] && (
                      <View style={[styles.healthMissingBadge]}>
                        <Ionicons name="medical" size={12} color="#ef4444" />
                        <ThemedText style={styles.healthMissingText}>Fiche santé</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
                {scoutHealthStatus[scout.id] ? (
                  <View style={[styles.statusBadge, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: BrandColors.primary[500] }]} />
                    <ThemedText style={[styles.statusText, { color: BrandColors.primary[500] }]}>
                      Actif
                    </ThemedText>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: '#fef2f2' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/(parent)/scouts/${scout.id}/health`);
                    }}
                  >
                    <Ionicons name="alert-circle" size={14} color="#ef4444" />
                    <ThemedText style={[styles.statusText, { color: '#ef4444' }]}>
                      À compléter
                    </ThemedText>
                  </TouchableOpacity>
                )}
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
                onPress={() => router.push('/(parent)/events')}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.secondary[500]}15` }]}>
                  <Ionicons name="calendar" size={24} color={BrandColors.secondary[500]} />
                </View>
                <ThemedText style={[styles.actionText, { color: textColor }]}>Événements</ThemedText>
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
                <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                  <Ionicons name="document" size={24} color={BrandColors.primary[500]} />
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
    lineHeight: 40,
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

  // Health Alert
  healthAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  healthAlertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthAlertContent: {
    flex: 1,
  },
  healthAlertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 2,
  },
  healthAlertDesc: {
    fontSize: 13,
    color: '#b91c1c',
  },
  healthMissingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: '#fef2f2',
  },
  healthMissingText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#ef4444',
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

  // Events Widget
  eventsWidget: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  eventsWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingBottom: 0,
  },
  eventsWidgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eventsWidgetTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventsWidgetBadge: {
    backgroundColor: BrandColors.secondary[500],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  eventsWidgetBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventsWidgetList: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  eventWidgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  eventDateBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDateDay: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  eventDateMonth: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    lineHeight: 12,
  },
  eventWidgetInfo: {
    flex: 1,
  },
  eventWidgetTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventWidgetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventWidgetMetaText: {
    fontSize: 12,
  },
  eventsWidgetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  eventsWidgetFooterText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
