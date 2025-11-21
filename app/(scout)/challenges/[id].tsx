import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton, Badge } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { ChallengeService } from '@/services/challenge-service';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';
import { StorageService } from '@/services/storage-service';
import { Challenge, ChallengeDifficulty, ChallengeStatus } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ChallengeDetailScreen() {
  const params = useLocalSearchParams();
  const challengeId = params.id as string;
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tintColor = useThemeColor({}, 'tint');

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

  const handleSubmit = async () => {
    if (!selectedImage || !challenge || !user?.id) return;

    try {
      setIsSubmitting(true);

      // Upload la photo
      const proofImageUrl = await StorageService.uploadChallengePhoto(
        challenge.id,
        user.id,
        selectedImage
      );

      // Soumettre le défi
      await ChallengeSubmissionService.submitChallenge(
        challenge.id,
        user.id,
        proofImageUrl
      );

      Alert.alert('Succès', 'Votre défi a été soumis et est en attente de validation', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
            loadChallenge();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      Alert.alert('Erreur', error.message || 'Impossible de soumettre le défi');
    } finally {
      setIsSubmitting(false);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
            {submission.comment && (
              <ThemedText style={styles.comment}>{submission.comment}</ThemedText>
            )}
          </Card>
        ) : (
          <Card style={styles.submitCard}>
            <ThemedText type="subtitle" style={styles.submitTitle}>
              Soumettre votre preuve
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
                  Ajouter une photo de preuve
                </ThemedText>
              </TouchableOpacity>
            )}

            <PrimaryButton
              title={isSubmitting ? 'Soumission...' : 'Soumettre le défi'}
              onPress={handleSubmit}
              disabled={!selectedImage || isSubmitting}
              style={styles.submitButton}
            />
          </Card>
        )}
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
  errorCard: {
    padding: 20,
    margin: 20,
  },
});

