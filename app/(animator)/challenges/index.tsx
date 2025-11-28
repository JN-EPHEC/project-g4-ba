import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions, ActivityIndicator, Text, Modal, TouchableOpacity } from 'react-native';
import { ChallengeCard } from '@/src/features/challenges/components/challenge-card';
import { ChallengesHeader } from '@/src/features/challenges/components/challenges-header';
import { useChallenges } from '@/src/features/challenges/hooks/use-challenges';
import { useAuth } from '@/context/auth-context';
import { Challenge } from '@/types';
import { Animator } from '@/types';

// Mapper les icônes et couleurs par difficulté
const DIFFICULTY_CONFIG = {
  easy: { icon: '🌱', bgColor: '#E8F5E9' },
  medium: { icon: '⭐', bgColor: '#FFF9C4' },
  hard: { icon: '🏆', bgColor: '#FFE5E5' },
};

export default function AnimatorChallengesScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const animator = user as Animator;
  const { challenges, loading, error } = useChallenges();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Calculer le nombre de colonnes en fonction de la largeur
  const getColumns = () => {
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    if (width >= 600) return 2;
    return 1;
  };

  const numColumns = getColumns();

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
        <ChallengesHeader totalPoints={0} />

        {/* Grille de défis responsive */}
        {challenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Aucun défi disponible</Text>
            <Text style={styles.emptyText}>
              Créez un nouveau défi depuis l'onglet Gestion !
            </Text>
          </View>
        ) : (
          <View style={[styles.challengesGrid, { gap: 16 }]}>
            {challenges.map((challenge) => {
              const config = DIFFICULTY_CONFIG[challenge.difficulty];

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
                    completed={false}
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
        />
      )}
    </View>
  );
}

// Composant Modal pour afficher les détails d'un défi
function ChallengeModal({
  challenge,
  onClose,
}: {
  challenge: Challenge;
  onClose: () => void;
}) {
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
});
