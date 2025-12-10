import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { RankBadge } from '@/components/rank-badge';
import { useAuth } from '@/context/auth-context';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';
import { ChallengeService } from '@/services/challenge-service';
import { UserService } from '@/services/user-service';
import { Animator, ChallengeSubmission, Challenge, Scout } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

interface SubmissionWithDetails extends ChallengeSubmission {
  challenge?: Challenge;
  scout?: Scout;
}

export default function ValidateChallengesScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [pendingSubmissions, setPendingSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [validatedSubmissions, setValidatedSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    loadSubmissions();
  }, [animator?.unitId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);

      if (animator?.unitId) {
        // Récupérer toutes les soumissions en attente pour l'unité
        const allSubmissions = await ChallengeSubmissionService.getPendingSubmissions(animator.unitId);

        // Charger les détails du défi et du scout pour chaque soumission
        const submissionsWithDetails = await Promise.all(
          allSubmissions.map(async (submission) => {
            const challenge = await ChallengeService.getChallengeById(submission.challengeId);
            const scout = await UserService.getUserById(submission.scoutId) as Scout;
            return { ...submission, challenge, scout };
          })
        );

        // Séparer les soumissions en attente et validées
        const pending = submissionsWithDetails.filter((s) => s.status === 'pending_validation');
        const validated = submissionsWithDetails.filter((s) => s.status !== 'pending_validation');

        setPendingSubmissions(pending);
        setValidatedSubmissions(validated);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des soumissions:', error);
      Alert.alert('Erreur', 'Impossible de charger les soumissions');
    } finally {
      setLoading(false);
    }
  };

  const validateSubmission = async (submissionId: string) => {
    try {
      await ChallengeSubmissionService.validateSubmission(submissionId, animator.id);
      Alert.alert('✅ Validé', 'Le défi a été validé avec succès');
      await loadSubmissions();
    } catch (error: any) {
      console.error('Erreur lors de la validation:', error);
      Alert.alert('Erreur', 'Impossible de valider le défi');
    }
  };

  const rejectSubmission = async (submissionId: string) => {
    Alert.alert(
      'Rejeter cette soumission ?',
      'Le scout devra soumettre une nouvelle preuve.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChallengeSubmissionService.rejectSubmission(submissionId, animator.id);
              Alert.alert('❌ Rejeté', 'La soumission a été rejetée');
              await loadSubmissions();
            } catch (error: any) {
              console.error('Erreur lors du rejet:', error);
              Alert.alert('Erreur', 'Impossible de rejeter la soumission');
            }
          },
        },
      ]
    );
  };

  const renderSubmissionCard = (submission: SubmissionWithDetails, isPending: boolean) => (
    <Card key={submission.id} style={styles.submissionCard}>
      <View style={styles.submissionHeader}>
        {/* Photo de preuve */}
        {submission.proofImageUrl && (
          <Image
            source={{ uri: submission.proofImageUrl }}
            style={styles.proofImage}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.submissionInfo}>
        {/* Informations sur le défi */}
        {submission.challenge && (
          <View style={styles.challengeInfo}>
            <ThemedText type="defaultSemiBold" style={styles.challengeTitle}>
              {submission.challenge.title}
            </ThemedText>
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
            </View>
          </View>
        )}

        {/* Informations sur le scout */}
        {submission.scout && (
          <View style={styles.scoutInfo}>
            <View style={styles.scoutAvatar}>
              <ThemedText style={styles.avatarText}>
                {submission.scout.firstName.charAt(0)}
                {submission.scout.lastName.charAt(0)}
              </ThemedText>
            </View>
            <View style={styles.scoutDetails}>
              <View style={styles.scoutNameRow}>
                <ThemedText type="defaultSemiBold">
                  {submission.scout.firstName} {submission.scout.lastName}
                </ThemedText>
                <RankBadge xp={submission.scout.points || 0} size="small" />
              </View>
              <ThemedText style={styles.scoutEmail}>
                {submission.scout.email}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Date de soumission */}
        <View style={styles.dateInfo}>
          <Ionicons name="time-outline" size={14} color={iconColor} />
          <ThemedText style={styles.dateText}>
            Soumis le {submission.submittedAt.toLocaleDateString('fr-FR')} à{' '}
            {submission.submittedAt.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </ThemedText>
        </View>
      </View>

      {isPending && (
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
            onPress={() => rejectSubmission(submission.id)}
          >
            <Ionicons name="close-circle" size={20} color="#ffffff" />
            <ThemedText style={styles.buttonText}>Rejeter</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {!isPending && submission.comment && (
        <View style={styles.commentSection}>
          <Ionicons name="chatbox-outline" size={16} color={iconColor} />
          <ThemedText style={styles.commentText}>{submission.comment}</ThemedText>
        </View>
      )}
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
        <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
          Validation des défis
        </ThemedText>

        {/* Soumissions en attente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color={iconColor} />
            <ThemedText type="subtitle">
              En attente ({pendingSubmissions.length})
            </ThemedText>
          </View>

          {pendingSubmissions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={48} color={BrandColors.primary[500]} />
              <ThemedText style={styles.emptyText}>
                Aucune soumission en attente de validation
              </ThemedText>
            </Card>
          ) : (
            <View style={styles.submissionsList}>
              {pendingSubmissions.map((submission) => renderSubmissionCard(submission, true))}
            </View>
          )}
        </View>

        {/* Soumissions validées */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color={iconColor} />
            <ThemedText type="subtitle">
              Traitées ({validatedSubmissions.length})
            </ThemedText>
          </View>

          {validatedSubmissions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={48} color={iconColor} />
              <ThemedText style={styles.emptyText}>
                Aucune soumission traitée pour le moment
              </ThemedText>
            </Card>
          ) : (
            <View style={styles.submissionsList}>
              {validatedSubmissions.map((submission) => renderSubmissionCard(submission, false))}
            </View>
          )}
        </View>
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
  title: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
  challengeTitle: {
    fontSize: 16,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: 16,
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
  scoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  scoutAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  commentSection: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#f3f4f6',
  },
  commentText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
});
