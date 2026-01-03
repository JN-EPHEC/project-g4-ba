import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ChallengeService } from '@/src/features/challenges/services/challenge-service';
import { ChallengeDifficulty } from '@/types';

const colors = {
  primary: '#2D5A45',
  accent: '#E07B4C',
  dark: '#1A2E28',
  neutral: '#8B7E74',
  neutralLight: '#C4BBB3',
  mist: '#E8EDE9',
  canvas: '#FDFCFB',
  cardBg: '#FFFFFF',
  error: '#DC2626',
};

const DIFFICULTIES = [
  { value: 'easy', label: 'Facile', color: '#22C55E' },
  { value: 'medium', label: 'Moyen', color: '#F59E0B' },
  { value: 'hard', label: 'Difficile', color: '#EF4444' },
];

const EMOJIS = ['🎯', '🌲', '🔥', '⭐', '🏆', '🥾', '🧭', '🪢', '🍳', '🌍', '🤝', '👋', '🎪', '🏕'];

export default function EditChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '100',
    difficulty: 'easy' as ChallengeDifficulty,
    emoji: '🎯',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadChallenge();
  }, [id]);

  const loadChallenge = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const challenge = await ChallengeService.getChallengeById(id);

      if (challenge) {
        setFormData({
          title: challenge.title,
          description: challenge.description,
          points: String(challenge.points),
          difficulty: challenge.difficulty,
          emoji: challenge.emoji || '🎯',
        });
      }
    } catch (error) {
      console.error('Erreur chargement défi:', error);
      Alert.alert('Erreur', 'Impossible de charger le défi');
    } finally {
      setIsLoading(false);
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

    const points = parseInt(formData.points);
    if (isNaN(points) || points < 10 || points > 1000) {
      newErrors.points = 'Entre 10 et 1000 points';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !id) return;

    setIsSaving(true);

    try {
      await ChallengeService.updateChallenge(id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        points: parseInt(formData.points),
        difficulty: formData.difficulty,
        emoji: formData.emoji,
      });

      Alert.alert(
        'Défi modifié !',
        `Le défi "${formData.title}" a été mis à jour.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de modifier le défi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Modifier le défi</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Titre */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Titre *</ThemedText>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Ex: Explorateur nature"
            placeholderTextColor={colors.neutralLight}
            value={formData.title}
            onChangeText={(text) => {
              setFormData({ ...formData, title: text });
              if (errors.title) setErrors({ ...errors, title: '' });
            }}
          />
          {errors.title && (
            <ThemedText style={styles.errorText}>{errors.title}</ThemedText>
          )}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Description *</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, errors.description && styles.inputError]}
            placeholder="Décris le défi..."
            placeholderTextColor={colors.neutralLight}
            value={formData.description}
            onChangeText={(text) => {
              setFormData({ ...formData, description: text });
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.description && (
            <ThemedText style={styles.errorText}>{errors.description}</ThemedText>
          )}
        </View>

        {/* Emoji */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Emoji</ThemedText>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={[
                  styles.emojiButton,
                  formData.emoji === emoji && styles.emojiButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, emoji })}
              >
                <ThemedText style={styles.emojiText}>{emoji}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Points */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Points *</ThemedText>
          <TextInput
            style={[styles.input, errors.points && styles.inputError]}
            placeholder="100"
            placeholderTextColor={colors.neutralLight}
            value={formData.points}
            onChangeText={(text) => {
              setFormData({ ...formData, points: text.replace(/[^0-9]/g, '') });
              if (errors.points) setErrors({ ...errors, points: '' });
            }}
            keyboardType="number-pad"
          />
          {errors.points && (
            <ThemedText style={styles.errorText}>{errors.points}</ThemedText>
          )}
        </View>

        {/* Difficulté */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Difficulté</ThemedText>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((diff) => (
              <Pressable
                key={diff.value}
                style={[
                  styles.chip,
                  formData.difficulty === diff.value && {
                    backgroundColor: diff.color,
                    borderColor: diff.color,
                  },
                ]}
                onPress={() => setFormData({ ...formData, difficulty: diff.value as ChallengeDifficulty })}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    formData.difficulty === diff.value && styles.chipTextSelected,
                  ]}
                >
                  {diff.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bouton sauvegarder */}
        <TouchableOpacity
          style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <ThemedText style={styles.submitButtonText}>
                Enregistrer les modifications
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.dark,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.mist,
  },
  emojiButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  emojiText: {
    fontSize: 24,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  chipText: {
    fontSize: 14,
    color: colors.neutral,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
