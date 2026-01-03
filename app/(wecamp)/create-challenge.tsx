import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

const CATEGORIES = [
  { value: 'nature', label: 'Nature' },
  { value: 'skills', label: 'Compétences' },
  { value: 'teamwork', label: 'Équipe' },
  { value: 'sport', label: 'Sport' },
  { value: 'ecology', label: 'Écologie' },
  { value: 'tradition', label: 'Tradition' },
  { value: 'integration', label: 'Intégration' },
  { value: 'achievement', label: 'Accomplissement' },
];

export default function CreateChallengeScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '100',
    difficulty: 'easy' as ChallengeDifficulty,
    category: 'nature',
    emoji: '🎯',
    durationDays: '30',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    const days = parseInt(formData.durationDays);
    if (isNaN(days) || days < 1 || days > 365) {
      newErrors.durationDays = 'Entre 1 et 365 jours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(formData.durationDays));

      await ChallengeService.createChallenge(
        formData.title.trim(),
        formData.description.trim(),
        parseInt(formData.points),
        formData.difficulty,
        now,
        endDate,
        'wecamp-admin',
        undefined, // unitId = null pour défi global
        undefined  // imageUrl
      );

      // Redirection vers le dashboard admin après un court délai pour l'animation
      setTimeout(() => {
        setIsLoading(false);
        router.replace('/(wecamp)/dashboard');
      }, 500);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Erreur', error?.message || 'Impossible de créer le défi');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Nouveau défi global</ThemedText>
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

        {/* Points et Durée */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
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

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <ThemedText style={styles.label}>Durée (jours)</ThemedText>
            <TextInput
              style={[styles.input, errors.durationDays && styles.inputError]}
              placeholder="30"
              placeholderTextColor={colors.neutralLight}
              value={formData.durationDays}
              onChangeText={(text) => {
                setFormData({ ...formData, durationDays: text.replace(/[^0-9]/g, '') });
                if (errors.durationDays) setErrors({ ...errors, durationDays: '' });
              }}
              keyboardType="number-pad"
            />
            {errors.durationDays && (
              <ThemedText style={styles.errorText}>{errors.durationDays}</ThemedText>
            )}
          </View>
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

        {/* Catégorie */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Catégorie</ThemedText>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                style={[
                  styles.chip,
                  formData.category === cat.value && styles.chipSelected,
                ]}
                onPress={() => setFormData({ ...formData, category: cat.value })}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    formData.category === cat.value && styles.chipTextSelected,
                  ]}
                >
                  {cat.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bouton créer */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <ThemedText style={styles.submitButtonText}>
                Créer le défi global
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
  row: {
    flexDirection: 'row',
    gap: 16,
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
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
    backgroundColor: colors.accent,
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
