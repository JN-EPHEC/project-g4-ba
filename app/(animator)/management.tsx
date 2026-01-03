import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { UnitService } from '@/services/unit-service';
import { EventService } from '@/services/event-service';
import { ChallengeService } from '@/services/challenge-service';
import { ChannelService } from '@/src/shared/services/channel-service';
import { DocumentService } from '@/services/document-service';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Animator, Unit, EventType, ChallengeDifficulty, DocumentType } from '@/types';
import { ChannelType } from '@/src/shared/types/channel';
import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

// Données de simulation
const SIMULATION_EVENTS = [
  {
    title: "Camp d'hiver aux Vosges",
    description: "Un super camp de 3 jours dans les Vosges ! Au programme : randonnée, construction d'igloos, veillée autour du feu.",
    type: EventType.CAMP,
    location: 'Refuge du Tanet, Vosges',
    daysFromNow: 14,
    duration: 3,
    requiresParentConfirmation: true,
    maxParticipants: 20,
  },
  {
    title: 'Réunion du samedi',
    description: 'Réunion hebdomadaire de la troupe. Activités : progression personnelle, jeux, préparation du prochain camp.',
    type: EventType.MEETING,
    location: 'Local scout',
    daysFromNow: 2,
    duration: 0.125, // 3 heures
    requiresParentConfirmation: false,
  },
  {
    title: 'Grand Jeu "La Quête du Graal"',
    description: 'Grand jeu d\'aventure ! Par équipes, partez à la recherche du Graal légendaire à travers la forêt.',
    type: EventType.ACTIVITY,
    location: 'Forêt de Fontainebleau',
    daysFromNow: 9,
    duration: 0.25,
    requiresParentConfirmation: true,
  },
  {
    title: 'Formation Premiers Secours',
    description: 'Formation PSC1 pour les scouts de plus de 12 ans. Apprenez les gestes qui sauvent !',
    type: EventType.TRAINING,
    location: 'Salle communale',
    daysFromNow: 21,
    duration: 0.33,
    requiresParentConfirmation: true,
    maxParticipants: 15,
  },
  {
    title: 'Sortie Kayak',
    description: 'Descente en kayak sur la Marne ! Niveau débutant accepté.',
    type: EventType.ACTIVITY,
    location: 'Base nautique de Lagny-sur-Marne',
    daysFromNow: 30,
    duration: 0.2,
    requiresParentConfirmation: true,
    maxParticipants: 12,
  },
];

const SIMULATION_CHALLENGES = [
  { title: 'Premier Feu de Camp', description: 'Allume un feu de camp en utilisant uniquement des allumettes et du bois trouvé.', points: 20, difficulty: ChallengeDifficulty.EASY, emoji: '🔥', category: 'nature' },
  { title: 'Nœuds Experts', description: 'Maîtrise 5 nœuds différents : chaise, cabestan, huit, plat et pêcheur.', points: 40, difficulty: ChallengeDifficulty.MEDIUM, emoji: '🪢', category: 'technique' },
  { title: 'Orientation Nocturne', description: 'Participe à une randonnée nocturne avec carte et boussole.', points: 80, difficulty: ChallengeDifficulty.HARD, emoji: '🌙', category: 'nature' },
  { title: 'Cuisine Nature', description: 'Prépare un repas complet pour ta patrouille sur un feu de camp.', points: 50, difficulty: ChallengeDifficulty.MEDIUM, emoji: '🍳', category: 'cuisine' },
  { title: "Construction d'Abri", description: 'Construis un abri naturel qui protège 2 personnes de la pluie.', points: 100, difficulty: ChallengeDifficulty.HARD, emoji: '🏕️', category: 'technique' },
];

const SIMULATION_MESSAGES = {
  announcements: [
    "📢 Rappel : le camp d'hiver approche ! N'oubliez pas de rendre les fiches d'inscription avant vendredi.",
    "🎉 Bravo à tous pour le dernier grand jeu ! Vous avez été incroyables !",
    "📸 Les photos du dernier événement sont disponibles sur le Drive.",
    "⚠️ Changement d'horaire pour samedi : rendez-vous à 14h au lieu de 14h30.",
  ],
  general: [
    "Salut tout le monde ! Qui a des bouts de corde pour les nœuds samedi ?",
    "Super journée hier ! Le grand jeu était trop bien 🎮",
    "Qui vient au camp d'hiver ? On sera combien ?",
    "Moi je viens ! Trop hâte ! 🏔️",
  ],
};

const SIMULATION_DOCUMENTS = [
  {
    title: "[SIMU] Autorisation parentale - Camp d'hiver",
    description: "Autorisation de participation au camp d'hiver aux Vosges du 15 au 18 janvier.",
    type: DocumentType.AUTHORIZATION,
    requiresSignature: true,
    expiryDays: 30,
  },
  {
    title: "[SIMU] Fiche sanitaire de liaison",
    description: "Fiche médicale à remplir pour les activités scouts.",
    type: DocumentType.MEDICAL,
    requiresSignature: true,
    expiryDays: 365,
  },
  {
    title: "[SIMU] Règlement intérieur 2025",
    description: "Règlement intérieur de l'unité à signer par les parents.",
    type: DocumentType.AUTHORIZATION,
    requiresSignature: true,
    expiryDays: 365,
  },
  {
    title: "[SIMU] Autorisation sortie Kayak",
    description: "Autorisation pour la sortie kayak du 25 janvier.",
    type: DocumentType.AUTHORIZATION,
    requiresSignature: true,
    expiryDays: 45,
  },
];

export default function ManagementScreen() {
  const { user } = useAuth();
  const { pendingChallengesCount, pendingScoutsCount } = useNotifications();
  const animator = user as Animator;
  const [unit, setUnit] = useState<Unit | null>(null);
  const [scoutsCount, setScoutsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [challengesCount, setChallengesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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

  // Fonction d'alerte compatible web/mobile
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Fonction de confirmation compatible web/mobile
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: onConfirm },
      ]);
    }
  };

  // Fonction de simulation
  const runSimulation = async () => {
    if (!user?.id || !animator?.unitId) {
      showAlert('Erreur', 'Vous devez être connecté et avoir une unité assignée.');
      return;
    }

    showConfirm(
      'Simulation de vie scout',
      'Cette action va créer :\n• 5 événements\n• 5 défis\n• 4 documents\n• 8 messages dans les canaux\n\nVoulez-vous continuer ?',
      async () => {
        try {
          setIsSimulating(true);
          let createdEvents = 0;
          let createdChallenges = 0;
          let createdMessages = 0;
          let createdDocuments = 0;

          // 1. Créer les événements
          for (const event of SIMULATION_EVENTS) {
            try {
              const startDate = new Date();
              startDate.setDate(startDate.getDate() + event.daysFromNow);
              startDate.setHours(9, 0, 0, 0);

              const endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + Math.floor(event.duration));
              endDate.setHours(17 + (event.duration % 1) * 24, 0, 0, 0);

              await EventService.createEvent(
                event.title,
                event.description,
                event.type,
                startDate,
                endDate,
                event.location,
                user.id,
                animator.unitId,
                event.requiresParentConfirmation,
                event.maxParticipants
              );
              createdEvents++;
            } catch (error) {
              console.error(`Erreur création événement ${event.title}:`, error);
            }
          }

          // 2. Créer les défis
          const now = new Date();
          const endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() + 3);

          for (const challenge of SIMULATION_CHALLENGES) {
            try {
              await ChallengeService.createChallenge(
                challenge.title,
                challenge.description,
                challenge.points,
                challenge.difficulty,
                now,
                endDate,
                user.id,
                animator.unitId,
                undefined,
                challenge.emoji,
                challenge.category
              );
              createdChallenges++;
            } catch (error) {
              console.error(`Erreur création défi ${challenge.title}:`, error);
            }
          }

          // 3. Créer les documents
          for (const simDoc of SIMULATION_DOCUMENTS) {
            try {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + simDoc.expiryDays);

              await DocumentService.createDocument(
                simDoc.title,
                simDoc.description,
                simDoc.type,
                '', // Pas de fichier URL pour la simulation
                user.id,
                animator.unitId,
                undefined, // Pas de scoutId spécifique
                simDoc.requiresSignature,
                expiryDate
              );
              createdDocuments++;
            } catch (error) {
              console.error(`Erreur création document ${simDoc.title}:`, error);
            }
          }

          // 4. Créer les messages dans les canaux
          try {
            const channels = await ChannelService.getChannelsByUnit(animator.unitId);

            // Messages dans le canal Annonces
            const announcementsChannel = channels.find(c => c.type === ChannelType.ANNOUNCEMENTS);
            if (announcementsChannel) {
              for (const content of SIMULATION_MESSAGES.announcements) {
                await ChannelService.sendMessage(announcementsChannel.id, user.id, content);
                createdMessages++;
              }
            }

            // Messages dans le canal Général
            const generalChannel = channels.find(c => c.type === ChannelType.GENERAL);
            if (generalChannel) {
              for (const content of SIMULATION_MESSAGES.general) {
                await ChannelService.sendMessage(generalChannel.id, user.id, content);
                createdMessages++;
              }
            }
          } catch (error) {
            console.error('Erreur création messages:', error);
          }

          // Recharger les données
          await loadManagementData();

          showAlert(
            'Simulation terminée !',
            `Données créées :\n• ${createdEvents} événements\n• ${createdChallenges} défis\n• ${createdDocuments} documents\n• ${createdMessages} messages`
          );
        } catch (error) {
          console.error('Erreur simulation:', error);
          showAlert('Erreur', 'Une erreur est survenue pendant la simulation.');
        } finally {
          setIsSimulating(false);
        }
      }
    );
  };

  // Fonction de reset de la simulation
  const resetSimulation = async () => {
    if (!user?.id || !animator?.unitId) {
      showAlert('Erreur', 'Vous devez être connecté et avoir une unité assignée.');
      return;
    }

    showConfirm(
      'Réinitialiser la simulation',
      'Cette action va supprimer toutes les données créées par la simulation :\n• Événements\n• Défis\n• Documents\n\n⚠️ Cette action est irréversible !',
      async () => {
        try {
          setIsResetting(true);
          let deletedEvents = 0;
          let deletedChallenges = 0;
          let deletedDocuments = 0;

          // 1. Supprimer les événements de simulation
          // (créés par l'animateur actuel, avec les titres de simulation)
          const eventTitles = SIMULATION_EVENTS.map(e => e.title);
          for (const title of eventTitles) {
            try {
              const eventsQuery = query(
                collection(db, 'events'),
                where('unitId', '==', animator.unitId),
                where('title', '==', title)
              );
              const eventsSnapshot = await getDocs(eventsQuery);
              for (const eventDoc of eventsSnapshot.docs) {
                await deleteDoc(doc(db, 'events', eventDoc.id));
                deletedEvents++;
              }
            } catch (error) {
              console.error(`Erreur suppression événement ${title}:`, error);
            }
          }

          // 2. Supprimer les défis de simulation
          const challengeTitles = SIMULATION_CHALLENGES.map(c => c.title);
          for (const title of challengeTitles) {
            try {
              const challengesQuery = query(
                collection(db, 'challenges'),
                where('unitId', '==', animator.unitId),
                where('title', '==', title)
              );
              const challengesSnapshot = await getDocs(challengesQuery);
              for (const challengeDoc of challengesSnapshot.docs) {
                await deleteDoc(doc(db, 'challenges', challengeDoc.id));
                deletedChallenges++;
              }
            } catch (error) {
              console.error(`Erreur suppression défi ${title}:`, error);
            }
          }

          // 3. Supprimer les documents de simulation (identifiés par le préfixe [SIMU])
          try {
            const documentsQuery = query(
              collection(db, 'documents'),
              where('unitId', '==', animator.unitId)
            );
            const documentsSnapshot = await getDocs(documentsQuery);
            for (const documentDoc of documentsSnapshot.docs) {
              const data = documentDoc.data();
              if (data.title && data.title.startsWith('[SIMU]')) {
                await deleteDoc(doc(db, 'documents', documentDoc.id));
                deletedDocuments++;
              }
            }
          } catch (error) {
            console.error('Erreur suppression documents:', error);
          }

          // Recharger les données
          await loadManagementData();

          showAlert(
            'Réinitialisation terminée !',
            `Données supprimées :\n• ${deletedEvents} événements\n• ${deletedChallenges} défis\n• ${deletedDocuments} documents`
          );
        } catch (error) {
          console.error('Erreur reset simulation:', error);
          showAlert('Erreur', 'Une erreur est survenue pendant la réinitialisation.');
        } finally {
          setIsResetting(false);
        }
      }
    );
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
          Outils
        </ThemedText>

        <TouchableOpacity onPress={runSimulation} disabled={isSimulating || isResetting}>
          <Card style={[styles.actionCard, (isSimulating || isResetting) && styles.actionCardDisabled]}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
              {isSimulating ? (
                <ActivityIndicator size="small" color={BrandColors.accent[500]} />
              ) : (
                <Ionicons name="flask" size={28} color={BrandColors.accent[500]} />
              )}
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">
                {isSimulating ? 'Simulation en cours...' : 'Simuler vie scout'}
              </ThemedText>
              <ThemedText style={styles.actionDescription}>
                Créer des événements, défis, documents et messages
              </ThemedText>
            </View>
            {!isSimulating && <Ionicons name="chevron-forward" size={20} color={iconColor} />}
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetSimulation} disabled={isSimulating || isResetting}>
          <Card style={[styles.actionCard, (isSimulating || isResetting) && styles.actionCardDisabled]}>
            <View style={[styles.actionIcon, { backgroundColor: '#dc262615' }]}>
              {isResetting ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <Ionicons name="trash" size={28} color="#dc2626" />
              )}
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">
                {isResetting ? 'Réinitialisation...' : 'Reset simulation'}
              </ThemedText>
              <ThemedText style={styles.actionDescription}>
                Supprimer toutes les données de simulation
              </ThemedText>
            </View>
            {!isResetting && <Ionicons name="chevron-forward" size={20} color={iconColor} />}
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
  actionCardDisabled: {
    opacity: 0.6,
  },
});
