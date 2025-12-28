import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChallengeService } from '@/services/challenge-service';
import { Challenge, ChallengeDifficulty } from '@/types';
import { BrandColors } from '@/constants/theme';

const DIFFICULTY_OPTIONS = [
  { value: ChallengeDifficulty.EASY, label: 'Facile', emoji: '🟢', color: BrandColors.primary[400] },
  { value: ChallengeDifficulty.MEDIUM, label: 'Moyen', emoji: '🟠', color: BrandColors.accent[500] },
  { value: ChallengeDifficulty.HARD, label: 'Difficile', emoji: '🔴', color: BrandColors.primary[700] },
];

export default function EditChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const inputBackground = useThemeColor({ light: '#F5F5F5', dark: '#2A2A2A' }, 'background');
  const placeholderColor = useThemeColor({ light: '#999999', dark: '#666666' }, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: ChallengeDifficulty.EASY,
    points: 0,
    emoji: '',
  });

  useEffect(() => {
    loadChallenge();
  }, [id]);

  const loadChallenge = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await ChallengeService.getChallengeById(id);
      if (data) {
        setChallenge(data);
        setFormData({
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          points: data.points,
          emoji: data.emoji || '',
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement du défi:', error);
      Alert.alert('Erreur', 'Impossible de charger le défi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Empêcher les doubles clics
    if (isSaving) {
      console.log('Sauvegarde déjà en cours, ignoré');
      return;
    }

    if (!id || !challenge) {
      console.log('ID ou challenge manquant');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'La description est obligatoire');
      return;
    }

    try {
      setIsSaving(true);

      // Construire l'objet de mise à jour sans valeurs undefined
      const updates: Record<string, any> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        points: formData.points,
      };

      // N'ajouter emoji que s'il n'est pas vide
      if (formData.emoji.trim()) {
        updates.emoji = formData.emoji.trim();
      }

      await ChallengeService.updateChallenge(id, updates);

      // Naviguer immédiatement après la sauvegarde
      router.back();

      // Afficher l'alerte après la navigation
      setTimeout(() => {
        Alert.alert('Succès', 'Le défi a été modifié !');
      }, 100);
    } catch (error) {
      console.error('Erreur lors de la modification du défi:', error);
      Alert.alert('Erreur', 'Impossible de modifier le défi');
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    // Sur le web, utiliser window.confirm car Alert.alert ne fonctionne pas bien
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Es-tu sûr de vouloir supprimer "${challenge?.title}" ? Cette action est irréversible.`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Supprimer le défi',
            `Es-tu sûr de vouloir supprimer "${challenge?.title}" ? Cette action est irréversible.`,
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await ChallengeService.deleteChallenge(id!);

      // Naviguer immédiatement après la suppression
      router.back();

      // Afficher le message de succès
      if (Platform.OS === 'web') {
        window.alert('Le défi a été supprimé');
      } else {
        setTimeout(() => {
          Alert.alert('Succès', 'Le défi a été supprimé');
        }, 100);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du défi:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur: Impossible de supprimer le défi');
      } else {
        Alert.alert('Erreur', 'Impossible de supprimer le défi');
      }
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText color="secondary" style={styles.loadingText}>
            Chargement du défi...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!challenge) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
          <ThemedText style={styles.errorText}>Défi introuvable</ThemedText>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <ThemedText style={{ color: tintColor }}>Retour</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>
              Modifier le défi
            </ThemedText>
            <View style={styles.placeholder} />
          </View>

          {/* Emoji & Points */}
          <Card style={styles.card}>
            <View style={styles.emojiPointsRow}>
              <View style={styles.emojiSection}>
                <ThemedText style={styles.label}>Emoji</ThemedText>
                <TextInput
                  style={[styles.emojiInput, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                  value={formData.emoji}
                  onChangeText={(text) => setFormData({ ...formData, emoji: text })}
                  placeholder="🎯"
                  placeholderTextColor={placeholderColor}
                  maxLength={2}
                />
              </View>
              <View style={styles.pointsSection}>
                <ThemedText style={styles.label}>Points</ThemedText>
                <TextInput
                  style={[styles.pointsInput, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                  value={formData.points.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 0;
                    setFormData({ ...formData, points: num });
                  }}
                  placeholder="100"
                  placeholderTextColor={placeholderColor}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </Card>

          {/* Titre & Description */}
          <Card style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Informations
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Titre *</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Titre du défi"
                placeholderTextColor={placeholderColor}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Description *</ThemedText>
              <TextInput
                style={[styles.textArea, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Décris le défi en détail..."
                placeholderTextColor={placeholderColor}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <ThemedText style={styles.charCount}>
                {formData.description.length}/500
              </ThemedText>
            </View>
          </Card>

          {/* Difficulté */}
          <Card style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Difficulté
            </ThemedText>

            <View style={styles.difficultyOptions}>
              {DIFFICULTY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.difficultyOption,
                    { borderColor: formData.difficulty === option.value ? option.color : borderColor },
                    formData.difficulty === option.value && { backgroundColor: `${option.color}15` },
                  ]}
                  onPress={() => setFormData({ ...formData, difficulty: option.value })}
                >
                  <ThemedText style={styles.difficultyEmoji}>{option.emoji}</ThemedText>
                  <ThemedText
                    style={[
                      styles.difficultyLabel,
                      formData.difficulty === option.value && { color: option.color, fontWeight: '700' },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  {formData.difficulty === option.value && (
                    <Ionicons name="checkmark-circle" size={20} color={option.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Bouton Sauvegarder */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (isSaving || isDeleting || !formData.title.trim() || !formData.description.trim()) && { opacity: 0.5 },
            ]}
            onPress={handleSave}
            disabled={isSaving || isDeleting || !formData.title.trim() || !formData.description.trim()}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.saveButtonText}>
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </ThemedText>
          </TouchableOpacity>

          {/* Bouton Supprimer */}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              (isDeleting || isSaving) && styles.deleteButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={isDeleting || isSaving}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
            <ThemedText style={styles.deleteButtonText}>
              {isDeleting ? 'Suppression...' : 'Supprimer le défi'}
            </ThemedText>
          </TouchableOpacity>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  backLink: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
  },
  placeholder: {
    width: 40,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  emojiPointsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  emojiSection: {
    flex: 1,
  },
  pointsSection: {
    flex: 2,
  },
  emojiInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 24,
    textAlign: 'center',
  },
  pointsInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  difficultyOptions: {
    gap: 12,
  },
  difficultyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  difficultyEmoji: {
    fontSize: 20,
  },
  difficultyLabel: {
    flex: 1,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: BrandColors.primary[500],
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});
