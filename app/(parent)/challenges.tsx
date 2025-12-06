import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Badge, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';
import { ChallengeService } from '@/services/challenge-service';
import { ParentScoutService } from '@/services/parent-scout-service';
import { ChallengeSubmission, ChallengeStatus } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ParentChallengesScreen() {
  const { user } = useAuth();
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    loadPendingSubmissions();
  }, []);

  const loadPendingSubmissions = async () => {
    try {
      setIsLoading(true);
      // Récupérer tous les scouts du parent
      const scouts = await ParentScoutService.getScoutsByParent(user?.id || '');
      
      // Récupérer les soumissions en attente pour chaque scout
      const allSubmissions = [];
      for (const scout of scouts) {
        const submissions = await ChallengeSubmissionService.getSubmissionsByScout(scout.id);
        const pending = submissions.filter(
          (s) => s.status === ChallengeStatus.PENDING_VALIDATION
        );
        
        // Ajouter les informations du défi et du scout à chaque soumission
        for (const submission of pending) {
          const challenge = await ChallengeService.getChallengeById(submission.challengeId);
          allSubmissions.push({
            ...submission,
            challenge,
            scout,
          });
        }
      }
      
      setPendingSubmissions(allSubmissions);
    } catch (error) {
      console.error('Erreur lors du chargement des soumissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async (submissionId: string) => {
    try {
      await ChallengeSubmissionService.validateSubmission(
        submissionId,
        user?.id || '',
        'Validé par le parent'
      );
      Alert.alert('Succès', 'Le défi a été validé et les points ont été attribués');
      loadPendingSubmissions();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de valider le défi');
    }
  };

  const handleReject = async (submissionId: string) => {
    Alert.alert(
      'Rejeter le défi',
      'Êtes-vous sûr de vouloir rejeter cette soumission ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChallengeSubmissionService.rejectSubmission(
                submissionId,
                user?.id || '',
                'Rejeté par le parent'
              );
              Alert.alert('Succès', 'Le défi a été rejeté');
              loadPendingSubmissions();
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de rejeter le défi');
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Validations en attente
        </ThemedText>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : pendingSubmissions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              Aucune soumission en attente de validation
            </ThemedText>
          </Card>
        ) : (
          pendingSubmissions.map((item) => (
            <Card key={item.id} style={styles.submissionCard}>
              <View style={styles.submissionHeader}>
                <View style={styles.submissionInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.scoutName}>
                    {item.scout?.firstName} {item.scout?.lastName}
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.challengeTitle}>
                    {item.challenge?.title}
                  </ThemedText>
                </View>
                <Badge variant="warning">En attente</Badge>
              </View>

              {item.proofImageUrl && (
                <Image
                  source={{ uri: item.proofImageUrl }}
                  style={styles.proofImage}
                />
              )}

              <View style={styles.actions}>
                <PrimaryButton
                  title="Valider"
                  onPress={() => handleValidate(item.id)}
                  style={[styles.actionButton, styles.validateButton]}
                />
                <PrimaryButton
                  title="Rejeter"
                  onPress={() => handleReject(item.id)}
                  style={[styles.actionButton, styles.rejectButton]}
                />
              </View>
            </Card>
          ))
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
    paddingBottom: 100,
  },
  title: {
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.7,
    textAlign: 'center',
  },
  submissionCard: {
    padding: 16,
    marginBottom: 12,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  submissionInfo: {
    flex: 1,
  },
  scoutName: {
    fontSize: 16,
    marginBottom: 4,
  },
  challengeTitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  proofImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  validateButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
});

