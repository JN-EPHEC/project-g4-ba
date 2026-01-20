import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert, Image, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { RankBadge } from '@/components/rank-badge';
import { useAuth } from '@/context/auth-context';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';
import { ChallengeService } from '@/services/challenge-service';
import { UserService } from '@/services/user-service';
import { UnitService } from '@/services/unit-service';
import { ChallengeSubmission, Challenge, Scout, Unit } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { getDisplayName, getUserTotemEmoji } from '@/src/shared/utils/totem-utils';

interface SubmissionWithDetails extends ChallengeSubmission {
  challenge?: Challenge;
  scout?: Scout;
  unit?: Unit;
}

export default function WeCampValidateChallengesScreen() {
  const { user } = useAuth();
  const [pendingSubmissions, setPendingSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const iconColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);

      // Récupérer les soumissions en attente pour les défis globaux (WeCamp uniquement)
      const pendingSubmissionsData = await ChallengeSubmissionService.getPendingSubmissionsForWeCamp();

      // Charger les détails du défi, du scout et de l'unité
      const pendingWithDetails: SubmissionWithDetails[] = await Promise.all(
        pendingSubmissionsData.map(async (submission) => {
          const challenge = await ChallengeService.getChallengeById(submission.challengeId);
          const scout = await UserService.getUserById(submission.scoutId) as Scout;
          let unit: Unit | undefined;
          if (scout?.unitId) {
            unit = await UnitService.getUnitById(scout.unitId) || undefined;
          }
          return { ...submission, challenge: challenge || undefined, scout, unit };
        })
      );

      setPendingSubmissions(pendingWithDetails);
    } catch (error: any) {
      console.error('Erreur lors du chargement des soumissions:', error);
      Alert.alert('Erreur', 'Impossible de charger les soumissions');
    } finally {
      setLoading(false);
    }
  };

  const validateSubmission = async (submissionId: string) => {
    try {
      await ChallengeSubmissionService.validateSubmission(submissionId, user!.id);
      Alert.alert('Valide', 'Le defi a ete valide avec succes');
      await loadSubmissions();
    } catch (error: any) {
      console.error('Erreur lors de la validation:', error);
      Alert.alert('Erreur', error?.message || 'Impossible de valider le defi');
    }
  };

  const openRejectModal = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setRejectComment('');
    setRejectModalVisible(true);
  };

  const closeRejectModal = () => {
    setRejectModalVisible(false);
    setSelectedSubmissionId(null);
    setRejectComment('');
  };

  const confirmRejectSubmission = async () => {
    if (!selectedSubmissionId) return;

    try {
      setIsRejecting(true);
      await ChallengeSubmissionService.rejectSubmission(
        selectedSubmissionId,
        user!.id,
        rejectComment.trim() || undefined
      );
      closeRejectModal();
      Alert.alert('Rejete', 'La soumission a ete rejetee');
      await loadSubmissions();
    } catch (error: any) {
      console.error('Erreur lors du rejet:', error);
      Alert.alert('Erreur', 'Impossible de rejeter la soumission');
    } finally {
      setIsRejecting(false);
    }
  };

  const renderSubmissionCard = (submission: SubmissionWithDetails) => (
    <Card key={submission.id} style={styles.submissionCard}>
      <View style={styles.submissionHeader}>
        {submission.proofImageUrl && (
          <Image
            source={{ uri: submission.proofImageUrl }}
            style={styles.proofImage}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.submissionInfo}>
        {submission.challenge && (
          <View style={styles.challengeInfo}>
            <View style={styles.challengeTitleRow}>
              <ThemedText style={styles.challengeEmoji}>
                {submission.challenge.emoji || '🎯'}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.challengeTitle}>
                {submission.challenge.title}
              </ThemedText>
            </View>
            <View style={styles.challengeMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="star" size={14} color={BrandColors.accent[500]} />
                <ThemedText style={styles.metaText}>
                  {submission.challenge.points} points
                </ThemedText>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="speedometer" size={14} color={BrandColors.primary[500]} />
                <ThemedText style={styles.metaText}>
                  {submission.challenge.difficulty}
                </ThemedText>
              </View>
              <View style={[styles.globalBadge]}>
                <Ionicons name="globe-outline" size={12} color="#7c3aed" />
                <ThemedText style={styles.globalBadgeText}>WeCamp</ThemedText>
              </View>
            </View>
          </View>
        )}

        {submission.scout && (
          <View style={styles.scoutInfo}>
            <View style={styles.scoutAvatar}>
              <ThemedText style={styles.avatarText}>
                {getUserTotemEmoji(submission.scout) || `${submission.scout.firstName.charAt(0)}${submission.scout.lastName.charAt(0)}`}
              </ThemedText>
            </View>
            <View style={styles.scoutDetails}>
              <View style={styles.scoutNameRow}>
                <ThemedText type="defaultSemiBold">
                  {getDisplayName(submission.scout)}
                </ThemedText>
                <RankBadge xp={submission.scout.points || 0} size="small" />
              </View>
              {submission.unit && (
                <ThemedText style={styles.unitName}>
                  {submission.unit.name}
                </ThemedText>
              )}
              <ThemedText style={styles.scoutEmail}>
                {submission.scout.email}
              </ThemedText>
            </View>
          </View>
        )}

        {submission.submittedAt && (
          <View style={styles.dateInfo}>
            <Ionicons name="time-outline" size={14} color={iconColor} />
            <ThemedText style={styles.dateText}>
              Soumis le {submission.submittedAt.toLocaleDateString('fr-FR')} a{' '}
              {submission.submittedAt.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </ThemedText>
          </View>
        )}

        {submission.scoutComment && (
          <View style={styles.scoutCommentSection}>
            <Ionicons name="chatbubble-outline" size={14} color={BrandColors.primary[500]} />
            <View style={styles.scoutCommentContent}>
              <ThemedText style={styles.scoutCommentLabel}>Message du scout :</ThemedText>
              <ThemedText style={styles.scoutCommentText}>{submission.scoutComment}</ThemedText>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.validateButton]}
          onPress={() => validateSubmission(submission.id)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          <ThemedText style={styles.buttonText}>Valider</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => openRejectModal(submission.id)}
        >
          <Ionicons name="close-circle" size={20} color="#ffffff" />
          <ThemedText style={styles.buttonText}>Rejeter</ThemedText>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
              Validation des defis WeCamp
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
              Defis globaux soumis par tous les scouts
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="globe-outline" size={20} color="#7c3aed" />
              </View>
              <ThemedText type="subtitle">
                En attente ({pendingSubmissions.length})
              </ThemedText>
            </View>
          </View>

          {pendingSubmissions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color={BrandColors.primary[500]} />
              </View>
              <ThemedText style={styles.emptyTitle}>Tout est valide !</ThemedText>
              <ThemedText style={styles.emptyText}>
                Aucune soumission de defi WeCamp en attente de validation
              </ThemedText>
            </Card>
          ) : (
            <View style={styles.submissionsList}>
              {pendingSubmissions.map((submission) => renderSubmissionCard(submission))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeRejectModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="close-circle" size={32} color="#ef4444" />
              </View>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                Rejeter la soumission
              </ThemedText>
              <ThemedText style={[styles.modalSubtitle, { color: textSecondary }]}>
                Le scout devra soumettre une nouvelle preuve.
              </ThemedText>
            </View>

            <View style={styles.commentInputContainer}>
              <ThemedText style={[styles.commentInputLabel, { color: textSecondary }]}>
                Raison du rejet (optionnel)
              </ThemedText>
              <TextInput
                style={[
                  styles.commentInput,
                  { backgroundColor: cardColor, color: textColor, borderColor: '#e5e5e5' }
                ]}
                value={rejectComment}
                onChangeText={setRejectComment}
                placeholder="Explique pourquoi le defi est rejete..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
              <ThemedText style={[styles.charCount, { color: textSecondary }]}>
                {rejectComment.length}/500
              </ThemedText>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeRejectModal}
                disabled={isRejecting}
              >
                <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmRejectButton]}
                onPress={confirmRejectSubmission}
                disabled={isRejecting}
              >
                {isRejecting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={18} color="#ffffff" />
                    <ThemedText style={styles.confirmRejectButtonText}>Rejeter</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submissionsList: {
    gap: 16,
  },
  submissionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  submissionHeader: {
    width: '100%',
  },
  proofImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  submissionInfo: {
    padding: 16,
    gap: 12,
  },
  challengeInfo: {
    gap: 8,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeEmoji: {
    fontSize: 20,
  },
  challengeTitle: {
    fontSize: 16,
    flex: 1,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    opacity: 0.7,
  },
  globalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  globalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7c3aed',
  },
  scoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  scoutAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scoutDetails: {
    flex: 1,
  },
  scoutNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7c3aed',
    marginTop: 2,
  },
  scoutEmail: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.7,
  },
  scoutCommentSection: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(34, 139, 34, 0.08)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary[500],
  },
  scoutCommentContent: {
    flex: 1,
  },
  scoutCommentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.primary[600],
    marginBottom: 4,
  },
  scoutCommentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
  },
  validateButton: {
    backgroundColor: BrandColors.primary[500],
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 139, 34, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  commentInputContainer: {
    marginBottom: 20,
  },
  commentInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmRejectButton: {
    backgroundColor: '#ef4444',
  },
  confirmRejectButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
