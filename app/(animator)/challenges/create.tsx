import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Input, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { ChallengeService } from '@/services/challenge-service';
import { UnitService } from '@/services/unit-service';
import { ChallengeDifficulty, Unit } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function CreateChallengeScreen() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '',
    difficulty: ChallengeDifficulty.MEDIUM,
    startDate: '',
    endDate: '',
    unitId: '',
  });
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const iconColor = useThemeColor({}, 'icon');

  React.useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const allUnits = await UnitService.getAllUnits();
      setUnits(allUnits);
    } catch (error) {
      console.error('Erreur lors du chargement des unités:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.points || parseInt(formData.points) <= 0) {
      newErrors.points = 'Le nombre de points doit être supérieur à 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est requise';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'La date de fin doit être après la date de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user?.id) return;

    try {
      setIsLoading(true);

      await ChallengeService.createChallenge(
        formData.title,
        formData.description,
        parseInt(formData.points),
        formData.difficulty,
        new Date(formData.startDate),
        new Date(formData.endDate),
        user.id,
        formData.unitId || undefined
      );

      Alert.alert('Succès', 'Le défi a été créé avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Erreur lors de la création du défi:', error);
      Alert.alert('Erreur', 'Impossible de créer le défi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.title}>
            Créer un défi
          </ThemedText>

          <Card style={styles.formCard}>
            <Input
              label="Titre du défi"
              placeholder="Ex: Premier campement"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              error={errors.title}
              icon={<Ionicons name="trophy-outline" size={20} color={iconColor} />}
            />

            <Input
              label="Description"
              placeholder="Décrivez le défi..."
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              error={errors.description}
              multiline
              numberOfLines={4}
              style={styles.textArea}
              icon={<Ionicons name="document-text-outline" size={20} color={iconColor} />}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="Points"
                  placeholder="50"
                  value={formData.points}
                  onChangeText={(text) =>
                    setFormData({ ...formData, points: text })
                  }
                  error={errors.points}
                  keyboardType="numeric"
                  icon={<Ionicons name="star-outline" size={20} color={iconColor} />}
                />
              </View>

              <View style={styles.halfWidth}>
                <ThemedText style={styles.label}>Difficulté</ThemedText>
                <View style={styles.difficultyButtons}>
                  {Object.values(ChallengeDifficulty).map((difficulty) => (
                    <PrimaryButton
                      key={difficulty}
                      title={
                        difficulty === ChallengeDifficulty.EASY
                          ? 'Facile'
                          : difficulty === ChallengeDifficulty.MEDIUM
                          ? 'Moyen'
                          : 'Difficile'
                      }
                      onPress={() =>
                        setFormData({ ...formData, difficulty })
                      }
                      style={[
                        styles.difficultyButton,
                        formData.difficulty === difficulty &&
                          styles.difficultyButtonActive,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="Date de début"
                  placeholder="YYYY-MM-DD"
                  value={formData.startDate}
                  onChangeText={(text) =>
                    setFormData({ ...formData, startDate: text })
                  }
                  error={errors.startDate}
                  icon={<Ionicons name="calendar-outline" size={20} color={iconColor} />}
                />
              </View>

              <View style={styles.halfWidth}>
                <Input
                  label="Date de fin"
                  placeholder="YYYY-MM-DD"
                  value={formData.endDate}
                  onChangeText={(text) =>
                    setFormData({ ...formData, endDate: text })
                  }
                  error={errors.endDate}
                  icon={<Ionicons name="calendar-outline" size={20} color={iconColor} />}
                />
              </View>
            </View>

            <ThemedText style={styles.label}>Unité (optionnel)</ThemedText>
            <ThemedText style={styles.hint}>
              Laissez vide pour un défi disponible pour tous
            </ThemedText>
          </Card>

          <PrimaryButton
            title={isLoading ? 'Création...' : 'Créer le défi'}
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    marginBottom: 24,
  },
  formCard: {
    padding: 20,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 8,
  },
  difficultyButtonActive: {
    opacity: 1,
  },
  submitButton: {
    marginTop: 20,
  },
});

