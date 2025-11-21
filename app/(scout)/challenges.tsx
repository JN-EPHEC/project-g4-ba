import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, ActivityIndicator, Text, Modal, TouchableOpacity, Alert } from 'react-native';
import { ChallengeCard } from '@/src/features/challenges/components/challenge-card';
import { RewardsSection } from '@/src/features/challenges/components/rewards-section';
import { ProgressSection } from '@/src/features/challenges/components/progress-section';
import { ChallengesHeader } from '@/src/features/challenges/components/challenges-header';
import { useChallenges } from '@/src/features/challenges/hooks/use-challenges';
import { useAllChallengeProgress } from '@/src/features/challenges/hooks/use-all-challenge-progress';
import { useChallengeProgress } from '@/src/features/challenges/hooks/use-challenge-progress';
import { useAuth } from '@/context/auth-context';
import { Challenge } from '@/types';
import { Scout } from '@/types';

// Mapper les icônes et couleurs par difficulté
const DIFFICULTY_CONFIG = {
  easy: { icon: '🌱', bgColor: '#E8F5E9' },
  medium: { icon: '⭐', bgColor: '#FFF9C4' },
  hard: { icon: '🏆', bgColor: '#FFE5E5' },
};

export default function ChallengesScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const scout = user as Scout;
  const { challenges, loading, error } = useChallenges();
  const { submissions, completedCount, isCompleted, refetch: refetchProgress } = useAllChallengeProgress();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Calculer le nombre de colonnes en fonction de la largeur
  const getColumns = () => {
    if (width >= 1200) return 4; // Desktop large
    if (width >= 900) return 3;  // Desktop
    if (width >= 600) return 2;  // Tablet
    return 1;                    // Mobile
  };

  const numColumns = getColumns();
  const totalChallenges = challenges.length;

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
  };

  const handleCloseModal = () => {
    setSelectedChallenge(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des défis...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ChallengesHeader totalPoints={scout?.points || 0} />

        {/* Section Récompenses */}
        <RewardsSection />

        {/* Section Progression */}
        <ProgressSection completed={completedCount} total={totalChallenges} />

        {/* Grille de défis responsive */}
        {challenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Aucun défi disponible</Text>
            <Text style={styles.emptyText}>
              Revenez plus tard pour découvrir de nouveaux défis !
            </Text>
          </View>
        ) : (
          <View style={[styles.challengesGrid, { gap: 16 }]}>
            {challenges.map((challenge) => {
              const config = DIFFICULTY_CONFIG[challenge.difficulty];
              const completed = isCompleted(challenge.id);

              return (
                <View
                  key={challenge.id}
                  style={[
                    styles.challengeItem,
                    {
                      width: width >= 600
                        ? `${100 / numColumns - 2}%`
                        : '100%',
                      minWidth: width >= 600 ? 250 : undefined,
                    },
                  ]}
                >
                  <ChallengeCard
                    title={challenge.title}
                    points={challenge.points}
                    icon={config.icon}
                    iconBgColor={config.bgColor}
                    onPress={() => handleChallengeClick(challenge)}
                    completed={completed}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal de détails du défi */}
      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={handleCloseModal}
          onComplete={refetchProgress}
        />
      )}
    </View>
  );
}

// Composant Modal pour afficher les détails d'un défi
function ChallengeModal({
  challenge,
  onClose,
  onComplete,
}: {
  challenge: Challenge;
  onClose: () => void;
  onComplete: () => void;
}) {
  const {
    submission,
    isCompleted,
    isPending,
    canSubmit,
    submitChallenge,
    submitting,
  } = useChallengeProgress(challenge.id);

  const handleComplete = async () => {
    try {
      // Pour simplifier, on marque le défi comme complété sans photo
      // Dans une vraie app, on demanderait une photo de preuve
      await submitChallenge('https://via.placeholder.com/150');

      Alert.alert(
        'Défi soumis !',
        'Votre défi a été soumis et est en attente de validation.',
        [{ text: 'OK', onPress: () => { onComplete(); onClose(); } }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de soumettre le défi');
    }
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeCompleted]}>
          <Text style={styles.statusBadgeText}>✓ Complété</Text>
        </View>
      );
    }
    if (isPending) {
      return (
        <View style={[styles.statusBadge, styles.statusBadgePending]}>
          <Text style={styles.statusBadgeText}>⏳ En attente</Text>
        </View>
      );
    }
    return null;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalIcon}>
                  {DIFFICULTY_CONFIG[challenge.difficulty].icon}
                </Text>
                <Text style={styles.modalTitle}>{challenge.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Status Badge */}
            {getStatusBadge()}

            {/* Points */}
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsIcon}>⭐</Text>
              <Text style={styles.pointsText}>{challenge.points} points</Text>
            </View>

            {/* Description */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Description</Text>
              <Text style={styles.modalDescription}>{challenge.description}</Text>
            </View>

            {/* Dates */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Période</Text>
              <Text style={styles.modalDate}>
                Du {formatDate(challenge.startDate)} au {formatDate(challenge.endDate)}
              </Text>
            </View>

            {/* Difficulté */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Difficulté</Text>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>
                  {challenge.difficulty === 'easy' && '🟢 Facile'}
                  {challenge.difficulty === 'medium' && '🟡 Moyen'}
                  {challenge.difficulty === 'hard' && '🔴 Difficile'}
                </Text>
              </View>
            </View>

            {/* Button */}
            {canSubmit && (
              <TouchableOpacity
                style={[styles.completeButton, submitting && styles.completeButtonDisabled]}
                onPress={handleComplete}
                disabled={submitting}
              >
                <Text style={styles.completeButtonText}>
                  {submitting ? 'Soumission...' : 'Marquer comme complété'}
                </Text>
              </TouchableOpacity>
            )}

            {isCompleted && submission && (
              <View style={styles.completedInfo}>
                <Text style={styles.completedInfoText}>
                  Complété le {formatDate(submission.validatedAt || submission.submittedAt)}
                </Text>
              </View>
            )}

            {isPending && (
              <View style={styles.pendingInfo}>
                <Text style={styles.pendingInfoText}>
                  En attente de validation par votre animateur
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
    color: '#666666',
    letterSpacing: -0.3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  challengesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  challengeItem: {
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#8E8E93',
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusBadgeCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgePending: {
    backgroundColor: '#FFF9C4',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 24,
    gap: 8,
  },
  pointsIcon: {
    fontSize: 20,
  },
  pointsText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalDescription: {
    fontSize: 17,
    color: '#1A1A1A',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  modalDate: {
    fontSize: 17,
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  completeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  completedInfo: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  completedInfoText: {
    fontSize: 15,
    color: '#34C759',
    textAlign: 'center',
    fontWeight: '500',
  },
  pendingInfo: {
    backgroundColor: '#FFF9C4',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  pendingInfoText: {
    fontSize: 15,
    color: '#FF9500',
    textAlign: 'center',
    fontWeight: '500',
  },
});
