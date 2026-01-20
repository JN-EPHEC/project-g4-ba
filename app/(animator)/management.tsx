import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { UnitService } from '@/services/unit-service';
import { EventService } from '@/services/event-service';
import { ChallengeService } from '@/services/challenge-service';
import { Animator, Unit } from '@/types';
import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ManagementScreen() {
  const { user } = useAuth();
  const { pendingChallengesCount, pendingScoutsCount } = useNotifications();
  const animator = user as Animator;
  const [unit, setUnit] = useState<Unit | null>(null);
  const [scoutsCount, setScoutsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [challengesCount, setChallengesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    loadManagementData();
  }, [animator?.unitId]);

  const loadManagementData = async () => {
    try {
      setIsLoading(true);

      // Charger l'unité et les scouts
      if (animator?.unitId) {
        const unitData = await UnitService.getUnitById(animator.unitId);
        setUnit(unitData);

        if (unitData) {
          const scouts = await UnitService.getScoutsByUnit(unitData.id);
          setScoutsCount(scouts.length);
        }
      }

      // Charger les événements
      try {
        const allEvents = await EventService.getUpcomingEvents(animator?.unitId);
        setEventsCount(allEvents.length);
      } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
        setEventsCount(0);
      }

      // Charger les défis actifs
      try {
        const allChallenges = await ChallengeService.getActiveChallenges();
        const unitChallenges = animator?.unitId
          ? allChallenges.filter(c => c.unitId === animator.unitId)
          : allChallenges;
        setChallengesCount(unitChallenges.length);
      } catch (error) {
        console.error('Erreur lors du chargement des défis:', error);
        setChallengesCount(0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de gestion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
          Gestion
        </ThemedText>

        {unit && (
          <Card style={styles.unitCard}>
            <View style={styles.unitHeader}>
              <Ionicons name="business" size={24} color={BrandColors.primary[500]} />
              <View style={styles.unitInfo}>
                <ThemedText type="subtitle">{unit.name}</ThemedText>
                {unit.description && (
                  <ThemedText style={styles.unitDescription}>
                    {unit.description}
                  </ThemedText>
                )}
              </View>
            </View>
          </Card>
        )}

        <TouchableOpacity onPress={() => router.push('/(animator)/unit-overview')} activeOpacity={0.7}>
          <Card style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <ThemedText type="defaultSemiBold" style={styles.statsTitle}>
                Statistiques
              </ThemedText>
              <View style={styles.statsHint}>
                <ThemedText style={styles.statsHintText}>Voir détails</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={iconColor} />
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText type="title" style={styles.statValue}>
                  {isLoading ? '...' : scoutsCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Scouts</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="title" style={styles.statValue}>
                  {isLoading ? '...' : eventsCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Événements</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText type="title" style={styles.statValue}>
                  {isLoading ? '...' : challengesCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Défis actifs</ThemedText>
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Créer
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(animator)/events/create')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle" size={28} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Créer un événement</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Planifier un nouveau camp, sortie ou activité
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/challenges/create')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="flash" size={28} color={BrandColors.accent[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Créer un défi</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Lancer un nouveau challenge pour les scouts
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
          Consulter
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(animator)/events')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="calendar" size={28} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Événements</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Voir tous les événements créés
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/challenges')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="trophy" size={28} color={BrandColors.accent[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Défis</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Voir tous les défis actifs
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/partners')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
              <Ionicons name="gift" size={28} color={BrandColors.accent[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Récompenses</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Échanger les points contre des avantages
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/scouts')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="people" size={28} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Gérer les scouts</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Voir et gérer les scouts de votre unité
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/validate-scouts')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="checkmark-done" size={28} color={BrandColors.accent[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Valider les inscriptions</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Approuver les nouveaux scouts
              </ThemedText>
            </View>
            <View style={styles.actionRight}>
              {pendingScoutsCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{pendingScoutsCount}</ThemedText>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={iconColor} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/validate-challenges')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="shield-checkmark" size={28} color={BrandColors.accent[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Valider les défis</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Approuver les soumissions de défis des scouts
              </ThemedText>
            </View>
            <View style={styles.actionRight}>
              {pendingChallengesCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{pendingChallengesCount}</ThemedText>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={iconColor} />
            </View>
          </Card>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
          Mon compte
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(animator)/profile')}>
          <Card style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="person" size={28} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Mon profil</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Voir et modifier mes informations
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/change-password')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="lock-closed" size={28} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Changer le mot de passe</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Modifier mon mot de passe
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
          Confidentialité
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="shield-checkmark" size={28} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Politique de confidentialité</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Consulter nos engagements RGPD
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(animator)/delete-account')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#dc262615' }]}>
              <Ionicons name="trash" size={28} color="#dc2626" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold" style={{ color: '#dc2626' }}>
                Supprimer mon compte
              </ThemedText>
              <ThemedText style={styles.actionDescription}>
                Effacer toutes mes données
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
          Ma section
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(animator)/section-logo')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
              <Ionicons name="sparkles" size={28} color={BrandColors.accent[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Logo de la section</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Personnaliser le logo avec l'IA
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

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
  title: {
    marginBottom: 20,
  },
  unitCard: {
    padding: 16,
    marginBottom: 16,
  },
  unitHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  unitInfo: {
    flex: 1,
  },
  unitDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  statsCard: {
    padding: 20,
    marginBottom: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    marginBottom: 0,
  },
  statsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsHintText: {
    fontSize: 13,
    opacity: 0.6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  actionCard: {
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${BrandColors.primary[500]}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: BrandColors.accent[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
