import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { ChallengeService } from '@/services/challenge-service';
import { ChallengeDifficulty, ChallengeCategory } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';

// Emojis disponibles pour le défi
const CHALLENGE_EMOJIS = [
  '🏕️', '🔥', '🥾', '🪢', '♻️', '👨‍🍳',
  '🧭', '⛺', '⭐', '🎯', '🏆', '🌿',
];

// Configuration des catégories
const CATEGORIES_CONFIG: Record<ChallengeCategory, { label: string; emoji: string }> = {
  [ChallengeCategory.NATURE]: { label: 'Nature', emoji: '🌲' },
  [ChallengeCategory.SPORT]: { label: 'Sport', emoji: '⚽' },
  [ChallengeCategory.TECHNIQUE]: { label: 'Technique', emoji: '🔧' },
  [ChallengeCategory.CUISINE]: { label: 'Cuisine', emoji: '🔍' },
  [ChallengeCategory.CREATIVITY]: { label: 'Créatif', emoji: '🎨' },
};

// Configuration des difficultés
const DIFFICULTY_CONFIG: Record<ChallengeDifficulty, { label: string }> = {
  [ChallengeDifficulty.EASY]: { label: 'Facile' },
  [ChallengeDifficulty.MEDIUM]: { label: 'Moyen' },
  [ChallengeDifficulty.HARD]: { label: 'Difficile' },
};

// Format date for display
const formatDateDisplay = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Format date for HTML input (YYYY-MM-DD)
const formatDateForInput = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CreateChallengeScreen() {
  const { user } = useAuth();
  // Points fixes à 10 pour les défis animateurs
  const FIXED_POINTS = 10;

  const [formData, setFormData] = useState({
    emoji: '🪢',
    title: '',
    description: '',
    difficulty: ChallengeDifficulty.EASY,
    category: ChallengeCategory.SPORT,
    startDate: null as Date | null,
    endDate: null as Date | null,
    isGlobal: false,
    allowMultipleValidations: false,
    notifyMembers: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est requise';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    }

    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = 'La date de fin doit être après la date de début';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user?.id || !formData.startDate || !formData.endDate) return;

    try {
      setIsLoading(true);

      await ChallengeService.createChallenge(
        formData.title,
        formData.description,
        FIXED_POINTS, // Points fixes à 10
        formData.difficulty,
        formData.startDate,
        formData.endDate,
        user.id,
        formData.isGlobal ? undefined : (user as any).unitId,
        undefined, // imageUrl
        formData.emoji,
        formData.category,
        formData.isGlobal,
        formData.allowMultipleValidations,
        formData.notifyMembers
      );

      alert('Le défi a été créé avec succès.');
      router.back();
    } catch (error) {
      console.error('Erreur lors de la création du défi:', error);
      alert('Impossible de créer le défi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date change for native picker
  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setFormData({ ...formData, startDate: selectedDate });
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setFormData({ ...formData, endDate: selectedDate });
    }
  };

  // Handle web date input change
  const handleWebStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setFormData({ ...formData, startDate: new Date(value) });
    } else {
      setFormData({ ...formData, startDate: null });
    }
  };

  const handleWebEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setFormData({ ...formData, endDate: new Date(value) });
    } else {
      setFormData({ ...formData, endDate: null });
    }
  };

  // Render date input based on platform
  const renderDateInput = (
    type: 'start' | 'end',
    value: Date | null,
    showPicker: boolean,
    setShowPicker: (show: boolean) => void,
    onChange: (event: DateTimePickerEvent, date?: Date) => void,
    onWebChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    error?: string
  ) => {
    if (Platform.OS === 'web') {
      // Web: use native HTML date input
      return (
        <View>
          <TouchableOpacity
            style={[
              styles.dateContainer,
              { backgroundColor: cardColor, borderColor: error ? '#ef4444' : cardBorderColor },
            ]}
            activeOpacity={1}
          >
            <Ionicons name="calendar-outline" size={18} color={textSecondary} />
            <input
              type="date"
              value={formatDateForInput(value)}
              onChange={onWebChange}
              style={{
                flex: 1,
                fontSize: 16,
                color: textColor,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                height: 40,
                cursor: 'pointer',
              }}
            />
          </TouchableOpacity>
          {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
        </View>
      );
    }

    // iOS/Android: use native date picker
    return (
      <View>
        <TouchableOpacity
          style={[
            styles.dateContainer,
            { backgroundColor: cardColor, borderColor: error ? '#ef4444' : cardBorderColor },
          ]}
          onPress={() => setShowPicker(true)}
        >
          <Ionicons name="calendar-outline" size={18} color={textSecondary} />
          <ThemedText style={[styles.dateText, !value && { color: textSecondary }]}>
            {value ? formatDateDisplay(value) : 'jj/mm/aaaa'}
          </ThemedText>
        </TouchableOpacity>
        {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

        {Platform.OS === 'ios' && showPicker && (
          <Modal
            transparent
            animationType="slide"
            visible={showPicker}
            onRequestClose={() => setShowPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <ThemedText style={{ color: BrandColors.primary[500] }}>Annuler</ThemedText>
                  </TouchableOpacity>
                  <ThemedText type="defaultSemiBold">
                    {type === 'start' ? 'Date de début' : 'Date de fin'}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <ThemedText style={{ color: BrandColors.primary[500], fontWeight: '600' }}>OK</ThemedText>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={value || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={onChange}
                  locale="fr-FR"
                  minimumDate={type === 'end' && formData.startDate ? formData.startDate : undefined}
                />
              </View>
            </View>
          </Modal>
        )}

        {Platform.OS === 'android' && showPicker && (
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display="calendar"
            onChange={onChange}
            minimumDate={type === 'end' && formData.startDate ? formData.startDate : undefined}
          />
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: cardColor }]}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.headerTitle}>
              Créer un défi
            </ThemedText>
            <View style={{ width: 44 }} />
          </View>

          {/* Emoji Selector */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Icône du défi</ThemedText>
            <View style={styles.emojiGrid}>
              {CHALLENGE_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    { backgroundColor: cardColor, borderColor: cardBorderColor },
                    formData.emoji === emoji && styles.emojiButtonSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, emoji })}
                >
                  <ThemedText style={styles.emojiText}>{emoji}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>
              Titre du défi <ThemedText style={styles.required}>*</ThemedText>
            </ThemedText>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: cardColor, borderColor: errors.title ? '#ef4444' : cardBorderColor },
              ]}
            >
              <ThemedText style={styles.inputEmoji}>{formData.emoji}</ThemedText>
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder="Ex: Premier feu de camp"
                placeholderTextColor={textSecondary}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>
            {errors.title && (
              <ThemedText style={styles.errorText}>{errors.title}</ThemedText>
            )}
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Description</ThemedText>
            <View
              style={[
                styles.textAreaContainer,
                { backgroundColor: cardColor, borderColor: cardBorderColor },
              ]}
            >
              <TextInput
                style={[styles.textArea, { color: textColor }]}
                placeholder="Décrivez le défi en détail..."
                placeholderTextColor={textSecondary}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Points info (fixes à 10) + Difficulty Row */}
          <View style={styles.row}>
            <View style={styles.halfSection}>
              <ThemedText style={styles.sectionLabel}>Points</ThemedText>
              <View
                style={[
                  styles.pointsContainer,
                  { backgroundColor: `${BrandColors.primary[500]}10`, borderColor: BrandColors.primary[200] },
                ]}
              >
                <ThemedText style={styles.pointsStar}>⭐</ThemedText>
                <ThemedText style={[styles.pointsFixed, { color: BrandColors.primary[600] }]}>
                  +{FIXED_POINTS} pts
                </ThemedText>
              </View>
              <ThemedText style={[styles.pointsHint, { color: textSecondary }]}>
                Points fixes pour les défis d'unité
              </ThemedText>
            </View>

            <View style={styles.halfSection}>
              <ThemedText style={styles.sectionLabel}>Difficulté</ThemedText>
              <View style={styles.difficultyRow}>
                {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => {
                  const isSelected = formData.difficulty === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.difficultyButton,
                        { backgroundColor: isSelected ? BrandColors.primary[500] : cardColor },
                        { borderColor: isSelected ? BrandColors.primary[500] : cardBorderColor },
                      ]}
                      onPress={() => setFormData({ ...formData, difficulty: key as ChallengeDifficulty })}
                    >
                      <ThemedText
                        style={[
                          styles.difficultyText,
                          { color: isSelected ? '#FFFFFF' : textSecondary },
                        ]}
                      >
                        {config.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Catégorie</ThemedText>
            <View style={styles.categoryGrid}>
              {Object.entries(CATEGORIES_CONFIG).map(([key, config]) => {
                const isSelected = formData.category === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryButton,
                      { backgroundColor: cardColor, borderColor: isSelected ? BrandColors.primary[500] : cardBorderColor },
                      isSelected && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, category: key as ChallengeCategory })}
                  >
                    <ThemedText style={styles.categoryEmoji}>{config.emoji}</ThemedText>
                    <ThemedText
                      style={[
                        styles.categoryText,
                        { color: isSelected ? BrandColors.primary[500] : textColor },
                      ]}
                    >
                      {config.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Inputs */}
          <View style={styles.row}>
            <View style={styles.halfSection}>
              <ThemedText style={styles.sectionLabel}>Date de début</ThemedText>
              {renderDateInput(
                'start',
                formData.startDate,
                showStartDatePicker,
                setShowStartDatePicker,
                handleStartDateChange,
                handleWebStartDateChange,
                errors.startDate
              )}
            </View>

            <View style={styles.halfSection}>
              <ThemedText style={styles.sectionLabel}>Date de fin</ThemedText>
              {renderDateInput(
                'end',
                formData.endDate,
                showEndDatePicker,
                setShowEndDatePicker,
                handleEndDateChange,
                handleWebEndDateChange,
                errors.endDate
              )}
            </View>
          </View>

          {/* Preview Card */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Aperçu</ThemedText>
            <View style={[styles.previewCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
              <View style={[styles.previewEmojiContainer, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                <ThemedText style={styles.previewEmoji}>{formData.emoji}</ThemedText>
              </View>
              <View style={styles.previewContent}>
                <ThemedText style={styles.previewTitle} numberOfLines={1}>
                  {formData.title || 'Titre du défi'}
                </ThemedText>
                <View style={styles.previewTags}>
                  <View style={[styles.previewTag, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                    <ThemedText style={[styles.previewTagText, { color: BrandColors.primary[500] }]}>
                      {CATEGORIES_CONFIG[formData.category]?.label}
                    </ThemedText>
                  </View>
                  <View style={[styles.previewTag, { backgroundColor: NeutralColors.gray[100] }]}>
                    <ThemedText style={[styles.previewTagText, { color: textSecondary }]}>
                      {DIFFICULTY_CONFIG[formData.difficulty]?.label}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <View style={[styles.previewPointsBadge, { backgroundColor: '#fef3c7' }]}>
                <ThemedText style={styles.previewPointsIcon}>⭐</ThemedText>
                <ThemedText style={styles.previewPointsText}>+{FIXED_POINTS}</ThemedText>
              </View>
            </View>
          </View>

          {/* Options Card */}
          <Card style={styles.optionsCard}>
            <ThemedText type="defaultSemiBold" style={styles.optionsTitle}>Options</ThemedText>

            <View style={styles.optionRow}>
              <ThemedText style={styles.optionLabel}>Visible par tous les groupes</ThemedText>
              <Switch
                value={formData.isGlobal}
                onValueChange={(value) => setFormData({ ...formData, isGlobal: value })}
                trackColor={{ false: NeutralColors.gray[300], true: `${BrandColors.primary[500]}50` }}
                thumbColor={formData.isGlobal ? BrandColors.primary[500] : NeutralColors.gray[100]}
              />
            </View>

            <View style={[styles.optionRow, styles.optionDivider]}>
              <ThemedText style={styles.optionLabel}>Permettre plusieurs validations</ThemedText>
              <Switch
                value={formData.allowMultipleValidations}
                onValueChange={(value) => setFormData({ ...formData, allowMultipleValidations: value })}
                trackColor={{ false: NeutralColors.gray[300], true: `${BrandColors.primary[500]}50` }}
                thumbColor={formData.allowMultipleValidations ? BrandColors.primary[500] : NeutralColors.gray[100]}
              />
            </View>

            <View style={[styles.optionRow, styles.optionDivider]}>
              <ThemedText style={styles.optionLabel}>Notifier les membres</ThemedText>
              <Switch
                value={formData.notifyMembers}
                onValueChange={(value) => setFormData({ ...formData, notifyMembers: value })}
                trackColor={{ false: NeutralColors.gray[300], true: `${BrandColors.primary[500]}50` }}
                thumbColor={formData.notifyMembers ? BrandColors.primary[500] : NeutralColors.gray[100]}
              />
            </View>
          </Card>

          {/* Submit Button */}
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
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  required: {
    color: '#ef4444',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emojiButtonSelected: {
    borderWidth: 2,
    borderColor: BrandColors.primary[500],
  },
  emojiText: {
    fontSize: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputEmoji: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  textAreaContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  textArea: {
    fontSize: 16,
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfSection: {
    flex: 1,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    gap: 8,
  },
  pointsStar: {
    fontSize: 18,
  },
  pointsFixed: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  pointsHint: {
    fontSize: 11,
    marginTop: 4,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryButtonSelected: {
    borderWidth: 2,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  previewEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 22,
  },
  previewContent: {
    flex: 1,
    gap: 6,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewTags: {
    flexDirection: 'row',
    gap: 6,
  },
  previewTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  previewPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  previewPointsIcon: {
    fontSize: 12,
  },
  previewPointsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b45309',
  },
  optionsCard: {
    padding: 0,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionsTitle: {
    padding: 16,
    paddingBottom: 0,
    fontSize: 15,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  optionLabel: {
    fontSize: 15,
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});
