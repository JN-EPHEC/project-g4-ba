import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, ActivityIndicator, Modal, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
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
import { BrandColors } from '@/constants/theme';

// Mapper les icônes par difficulté
const DIFFICULTY_ICONS = {
  easy: '🌱',
  medium: '⭐',
  hard: '🏆',
};

export default function ChallengesScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const scout = user as Scout;
  const { challenges, loading, error } = useChallenges();
  const { submissions, completedCount, isCompleted, refetch: refetchProgress } = useAllChallengeProgress();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const successBackground = useThemeColor({}, 'successBackground');
  const warningBackground = useThemeColor({}, 'warningBackground');
  const errorBackground = useThemeColor({}, 'errorBackground');
  const tintColor = useThemeColor({}, 'tint');

  // Dynamic difficulty colors based on theme
  const getDifficultyBgColor = (difficulty: 'easy' | 'medium' | 'hard') => {
    switch (difficulty) {
      case 'easy': return successBackground;
      case 'medium': return warningBackground;
      case 'hard': return errorBackground;
    }
  };

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
      <ThemedView darkColor="#000000" style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText color="secondary" style={styles.loadingText}>Chargement des défis...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView darkColor="#000000" style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
          <ThemedText color="error" style={styles.errorText}>{error}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView darkColor="#000000" style={styles.container}>
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

        {/* Section En attente de validation */}
        {(() => {
          const pendingChallenges = challenges.filter(challenge => {
            const submission = submissions.find(s => s.challengeId === challenge.id);
            return submission && submission.status === 'pending_validation';
          });

          return pendingChallenges.length > 0 ? (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionIcon}>⏳</ThemedText>
                <ThemedText type="subtitle" style={styles.sectionTitle}>En attente de validation</ThemedText>
              </View>
              <View style={[styles.challengesGrid, { gap: 16 }]}>
                {pendingChallenges.map((challenge) => {
                  const icon = DIFFICULTY_ICONS[challenge.difficulty];
                  const bgColor = getDifficultyBgColor(challenge.difficulty);

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
                        icon={icon}
                        iconBgColor={bgColor}
                        onPress={() => handleChallengeClick(challenge)}
                        completed={false}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null;
        })()}

        {/* Grille de défis disponibles */}
        {(() => {
          const availableChallenges = challenges.filter(challenge => {
            const submission = submissions.find(s => s.challengeId === challenge.id);
            // Exclure les défis complétés et en attente
            return !isCompleted(challenge.id) && (!submission || submission.status !== 'pending_validation');
          });

          return availableChallenges.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyIcon}>🎯</ThemedText>
              <ThemedText type="heading" style={styles.emptyTitle}>Aucun défi disponible</ThemedText>
              <ThemedText color="secondary" style={styles.emptyText}>
                Revenez plus tard pour découvrir de nouveaux défis !
              </ThemedText>
            </View>
          ) : (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionIcon}>🎯</ThemedText>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Défis disponibles</ThemedText>
              </View>
              <View style={[styles.challengesGrid, { gap: 16 }]}>
                {availableChallenges.map((challenge) => {
                  const icon = DIFFICULTY_ICONS[challenge.difficulty];
                  const bgColor = getDifficultyBgColor(challenge.difficulty);

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
                        icon={icon}
                        iconBgColor={bgColor}
                        onPress={() => handleChallengeClick(challenge)}
                        completed={false}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* Section Défis complétés */}
        {(() => {
          const completedChallenges = challenges.filter(challenge => isCompleted(challenge.id));

          return completedChallenges.length > 0 ? (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionIcon}>✅</ThemedText>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Défis complétés</ThemedText>
              </View>
              <View style={[styles.challengesGrid, { gap: 16 }]}>
                {completedChallenges.map((challenge) => {
                  const icon = DIFFICULTY_ICONS[challenge.difficulty];
                  const bgColor = getDifficultyBgColor(challenge.difficulty);

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
                        icon={icon}
                        iconBgColor={bgColor}
                        onPress={() => handleChallengeClick(challenge)}
                        completed={true}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null;
        })()}
      </ScrollView>

      {/* Modal de détails du défi */}
      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={handleCloseModal}
          onComplete={refetchProgress}
        />
      )}
    </ThemedView>
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

  // Theme colors
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const overlayColor = useThemeColor({}, 'overlay');
  const successBackground = useThemeColor({}, 'successBackground');
  const warningBackground = useThemeColor({}, 'warningBackground');
  const infoBackground = useThemeColor({}, 'infoBackground');
  const tintColor = useThemeColor({}, 'tint');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const handleTakePhoto = () => {
    // Fermer le modal et naviguer vers la page de détails avec le défi
    onClose();
    router.push(`/(scout)/challenges/${challenge.id}`);
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: successBackground }]}>
          <ThemedText color="success" style={styles.statusBadgeText}>✓ Complété</ThemedText>
        </View>
      );
    }
    if (isPending) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: warningBackground }]}>
          <ThemedText color="warning" style={styles.statusBadgeText}>⏳ En attente</ThemedText>
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
      <View style={[styles.modalOverlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.modalContent, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <ThemedText style={styles.modalIcon}>
                  {DIFFICULTY_ICONS[challenge.difficulty]}
                </ThemedText>
                <ThemedText type="title" style={styles.modalTitle}>{challenge.title}</ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: cardBorderColor }]}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ThemedText color="secondary" style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Status Badge */}
            {getStatusBadge()}

            {/* Points */}
            <View style={[styles.pointsBadge, { backgroundColor: warningBackground }]}>
              <ThemedText style={styles.pointsIcon}>⭐</ThemedText>
              <ThemedText type="bodySemiBold">{challenge.points} points</ThemedText>
            </View>

            {/* Description */}
            <View style={styles.modalSection}>
              <ThemedText color="secondary" type="label" style={styles.modalSectionTitle}>Description</ThemedText>
              <ThemedText style={styles.modalDescription}>{challenge.description}</ThemedText>
            </View>

            {/* Dates */}
            <View style={styles.modalSection}>
              <ThemedText color="secondary" type="label" style={styles.modalSectionTitle}>Période</ThemedText>
              <ThemedText style={styles.modalDate}>
                Du {formatDate(challenge.startDate)} au {formatDate(challenge.endDate)}
              </ThemedText>
            </View>

            {/* Difficulté */}
            <View style={styles.modalSection}>
              <ThemedText color="secondary" type="label" style={styles.modalSectionTitle}>Difficulté</ThemedText>
              <View style={styles.difficultyBadge}>
                <ThemedText style={styles.difficultyText}>
                  {challenge.difficulty === 'easy' && '🟢 Facile'}
                  {challenge.difficulty === 'medium' && '🟡 Moyen'}
                  {challenge.difficulty === 'hard' && '🔴 Difficile'}
                </ThemedText>
              </View>
            </View>

            {/* Photo requirement notice */}
            {canSubmit && (
              <View style={[styles.photoNotice, { backgroundColor: infoBackground }]}>
                <View style={[styles.photoNoticeIcon, { backgroundColor: cardColor }]}>
                  <Ionicons name="camera" size={20} color={tintColor} />
                </View>
                <ThemedText color="tint" style={styles.photoNoticeText}>
                  Une photo de preuve est requise pour valider ce défi
                </ThemedText>
              </View>
            )}

            {/* Button */}
            {canSubmit && (
              <TouchableOpacity
                style={[styles.takePhotoButton, { backgroundColor: tintColor }]}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <ThemedText color="inverse" type="bodySemiBold" style={styles.takePhotoButtonText}>
                  Relever le défi
                </ThemedText>
              </TouchableOpacity>
            )}

            {isCompleted && submission && (
              <View style={[styles.completedInfo, { backgroundColor: successBackground }]}>
                <ThemedText color="success" style={styles.completedInfoText}>
                  Complété le {formatDate(submission.validatedAt || submission.submittedAt)}
                </ThemedText>
              </View>
            )}

            {isPending && (
              <View style={[styles.pendingInfo, { backgroundColor: warningBackground }]}>
                <ThemedText color="warning" style={styles.pendingInfoText}>
                  En attente de validation par votre animateur
                </ThemedText>
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
    color: '#888888',
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
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2A2A2A',
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
    color: '#FFFFFF',
    letterSpacing: -0.5,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3A3A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#888888',
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
    backgroundColor: '#1B4332',
  },
  statusBadgePending: {
    backgroundColor: '#4A4520',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A4520',
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
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalDescription: {
    fontSize: 17,
    color: '#CCCCCC',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  modalDate: {
    fontSize: 17,
    color: '#CCCCCC',
    letterSpacing: -0.3,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
  },
  difficultyText: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.3,
    color: '#CCCCCC',
  },
  photoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A5F',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
  },
  photoNoticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    lineHeight: 20,
  },
  takePhotoButton: {
    backgroundColor: BrandColors.accent[500],
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    shadowColor: BrandColors.accent[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  takePhotoButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  completedInfo: {
    backgroundColor: '#1B4332',
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
    backgroundColor: '#4A4520',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  pendingInfoText: {
    fontSize: 15,
    color: '#FFD60A',
    textAlign: 'center',
    fontWeight: '500',
  },
});
