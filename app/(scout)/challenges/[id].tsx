import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator, Modal, Animated as RNAnimated, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton, Badge } from '@/components/ui';
import { Confetti } from '@/components/confetti';
import { useAuth } from '@/context/auth-context';
import { ChallengeService } from '@/services/challenge-service';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';
import { StorageService } from '@/services/storage-service';
import { Challenge, ChallengeDifficulty, ChallengeStatus } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { NeutralColors } from '@/constants/theme';

export default function ChallengeDetailScreen() {
  const params = useLocalSearchParams();
  const challengeId = params.id as string;
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scoutComment, setScoutComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scaleAnim] = useState(new RNAnimated.Value(0));
  const [fadeAnim] = useState(new RNAnimated.Value(0));
  const pulseScale = useSharedValue(1);
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  const loadChallenge = async () => {
    try {
      setIsLoading(true);
      const challengeData = await ChallengeService.getChallengeById(challengeId);
      setChallenge(challengeData);

      if (challengeData && user?.id) {
        const submissionData = await ChallengeSubmissionService.getSubmissionByChallengeAndScout(
          challengeId,
          user.id
        );
        setSubmission(submissionData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du défi:', error);
      Alert.alert('Erreur', 'Impossible de charger le défi');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
    }
  };

  const showSuccessAnimation = () => {
    setShowSuccessModal(true);

    // Start pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    );

    // Animation d'apparition
    RNAnimated.parallel([
      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Redirection automatique après 2.5 secondes
    setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccessModal(false);
        router.replace('/(scout)/dashboard');
      });
    }, 2500);
  };

  const handleSubmit = async () => {
    if (!challenge || !user?.id) return;

    try {
      setIsSubmitting(true);

      // Upload la photo si fournie
      let proofImageUrl: string | undefined;
      if (selectedImage) {
        proofImageUrl = await StorageService.uploadChallengePhoto(
          challenge.id,
          user.id,
          selectedImage
        );
      }

      // Soumettre le défi avec commentaire obligatoire et photo optionnelle
      await ChallengeSubmissionService.submitChallenge(
        challenge.id,
        user.id,
        scoutComment.trim(),
        proofImageUrl
      );

      // Arrêter le loading
      setIsSubmitting(false);

      // Afficher l'animation de succès
      showSuccessAnimation();
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      setIsSubmitting(false);
      Alert.alert('❌ Erreur', error.message || 'Impossible de soumettre le défi');
    }
  };

  const getDifficultyLabel = (difficulty: ChallengeDifficulty): string => {
    const labels: Record<ChallengeDifficulty, string> = {
      [ChallengeDifficulty.EASY]: 'Facile',
      [ChallengeDifficulty.MEDIUM]: 'Moyen',
      [ChallengeDifficulty.HARD]: 'Difficile',
    };
    return labels[difficulty] || difficulty;
  };

  const getStatusLabel = (status: ChallengeStatus): string => {
    const labels: Record<ChallengeStatus, string> = {
      [ChallengeStatus.PENDING_VALIDATION]: 'En attente',
      [ChallengeStatus.COMPLETED]: 'Validé',
      [ChallengeStatus.EXPIRED]: 'Rejeté',
      [ChallengeStatus.ACTIVE]: 'Actif',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  if (!challenge) {
    return (
      <ThemedView style={styles.container}>
        <Card style={styles.errorCard}>
          <ThemedText>Défi introuvable</ThemedText>
        </Card>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          {challenge.title}
        </ThemedText>

        <Card style={styles.challengeCard}>
          <View style={styles.header}>
            <Badge variant="info">{getDifficultyLabel(challenge.difficulty)}</Badge>
            <View style={styles.pointsContainer}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <ThemedText style={styles.pointsText}>{challenge.points} points</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.description}>{challenge.description}</ThemedText>

          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={16} color={tintColor} />
            <ThemedText style={styles.dateText}>
              Du {challenge.startDate.toLocaleDateString('fr-FR')} au{' '}
              {challenge.endDate.toLocaleDateString('fr-FR')}
            </ThemedText>
          </View>
        </Card>

        {submission ? (
          <Card style={styles.submissionCard}>
            <ThemedText type="subtitle" style={styles.submissionTitle}>
              Votre soumission
            </ThemedText>
            <Badge
              variant={
                submission.status === ChallengeStatus.COMPLETED
                  ? 'success'
                  : submission.status === ChallengeStatus.EXPIRED
                  ? 'error'
                  : 'warning'
              }
            >
              {getStatusLabel(submission.status)}
            </Badge>
            {submission.proofImageUrl && (
              <Image
                source={{ uri: submission.proofImageUrl }}
                style={styles.proofImage}
              />
            )}
            {submission.scoutComment && (
              <View style={styles.scoutCommentContainer}>
                <ThemedText style={[styles.scoutCommentLabel, { color: textSecondary }]}>
                  Ton commentaire :
                </ThemedText>
                <ThemedText style={styles.scoutCommentText}>
                  {submission.scoutComment}
                </ThemedText>
              </View>
            )}
            {submission.comment && (
              <View style={[
                styles.animatorCommentContainer,
                submission.status === ChallengeStatus.EXPIRED && styles.rejectedCommentContainer
              ]}>
                <ThemedText style={[styles.animatorCommentLabel, { color: textSecondary }]}>
                  {submission.status === ChallengeStatus.EXPIRED ? 'Raison du rejet :' : 'Commentaire de l\'animateur :'}
                </ThemedText>
                <ThemedText style={styles.comment}>{submission.comment}</ThemedText>
              </View>
            )}
          </Card>
        ) : (
          <Card style={styles.submitCard}>
            <ThemedText type="subtitle" style={styles.submitTitle}>
              Soumettre le défi
            </ThemedText>

            {selectedImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={styles.removeImageButton}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                <Ionicons name="camera" size={48} color={tintColor} />
                <ThemedText style={styles.imagePickerText}>
                  Ajouter une photo (optionnel)
                </ThemedText>
              </TouchableOpacity>
            )}

            {/* Champ de commentaire obligatoire */}
            <View style={styles.commentSection}>
              <ThemedText style={[styles.commentLabel, { color: textSecondary }]}>
                Décris comment tu as réalisé ce défi *
              </ThemedText>
              <TextInput
                style={[
                  styles.commentInput,
                  { backgroundColor: cardColor, color: textColor, borderColor: NeutralColors.gray[300] }
                ]}
                value={scoutComment}
                onChangeText={setScoutComment}
                placeholder="Décris comment tu as réalisé ce défi..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={3}
                maxLength={500}
                textAlignVertical="top"
              />
              <ThemedText style={[styles.charCount, { color: textSecondary }]}>
                {scoutComment.length}/500
              </ThemedText>
            </View>

            <PrimaryButton
              title={isSubmitting ? 'Soumission...' : 'Soumettre le défi'}
              onPress={handleSubmit}
              disabled={isSubmitting || !scoutComment.trim()}
              style={styles.submitButton}
            />
          </Card>
        )}
      </ScrollView>

      {/* Modal d'animation de succès avec confettis */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="none"
      >
        <View style={styles.successModalOverlay}>
          {/* Confettis en arrière-plan */}
          {showSuccessModal && <Confetti count={60} />}

          <RNAnimated.View
            style={[
              styles.successModalContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Icon avec animation pulsante */}
            <View style={styles.successIconContainer}>
              <Animated.View style={pulseStyle}>
                <Ionicons name="checkmark-circle" size={80} color="#34C759" />
              </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.duration(300).delay(400)}>
              <ThemedText style={styles.successTitle}>
                🎉 Défi soumis !
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(300).delay(500)}>
              <ThemedText style={styles.successMessage}>
                Bravo ! Ton défi a été envoyé avec succès.
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(300).delay(600)}>
              <ThemedText style={styles.successSubMessage}>
                Un animateur va le valider prochainement
              </ThemedText>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(300).delay(700)}>
              <View style={styles.successPointsBadge}>
                <Ionicons name="star" size={24} color="#f59e0b" />
                <ThemedText style={styles.successPoints}>
                  +{challenge?.points} points
                </ThemedText>
              </View>
            </Animated.View>
          </RNAnimated.View>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 20,
  },
  challengeCard: {
    padding: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    opacity: 0.7,
  },
  submissionCard: {
    padding: 20,
    marginBottom: 20,
  },
  submissionTitle: {
    marginBottom: 12,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  comment: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
  },
  submitCard: {
    padding: 20,
  },
  submitTitle: {
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  imagePicker: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imagePickerText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  submitButton: {
    marginTop: 8,
  },
  commentSection: {
    marginBottom: 16,
  },
  commentLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  scoutCommentContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  scoutCommentLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  scoutCommentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  animatorCommentContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  rejectedCommentContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftColor: '#ef4444',
  },
  animatorCommentLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  errorCard: {
    padding: 20,
    margin: 20,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubMessage: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  successPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  successPoints: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
  },
});

