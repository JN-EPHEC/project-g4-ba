import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { UnitCategory, UserRole } from '@/types';
import { UnitService } from '@/services/unit-service';
import { UserService } from '@/services/user-service';

// Design System Colors
const colors = {
  primary: '#2D5A45',
  primaryLight: '#3d7a5a',
  accent: '#E07B4C',
  accentLight: '#FEF3EE',
  neutral: '#8B7E74',
  neutralLight: '#C4BBB3',
  dark: '#1A2E28',
  mist: '#E8EDE9',
  canvas: '#FDFCFB',
  cardBg: '#FFFFFF',
  error: '#DC2626',
};


export default function CreateUnitScreen() {
  const params = useLocalSearchParams();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '' as string,
    description: '',
    accessCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'unité est requis';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La fédération est requise';
    } else if (formData.category.trim().length < 2) {
      newErrors.category = 'Le nom de la fédération doit contenir au moins 2 caractères';
    }

    if (!formData.accessCode.trim()) {
      newErrors.accessCode = 'Le code d\'accès est requis';
    } else if (formData.accessCode.trim().length < 4) {
      newErrors.accessCode = 'Le code doit contenir au moins 4 caractères';
    } else if (!/^[A-Z0-9]+$/.test(formData.accessCode.trim())) {
      newErrors.accessCode = 'Le code ne peut contenir que des lettres et chiffres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log('🚀 Création du compte animateur...');

      // 1. Créer l'animateur d'abord (sans unitId)
      const animator = await register(
        params.email as string,
        params.password as string,
        params.firstName as string,
        params.lastName as string,
        UserRole.ANIMATOR
      );

      console.log('✅ Animateur créé:', animator.id);

      // 2. Créer l'unité avec l'animateur comme leader
      console.log('🏕 Création de l\'unité...');
      const unit = await UnitService.createUnitWithoutValidation(
        formData.name.trim(),
        formData.category.trim() as UnitCategory,
        'default-group',
        animator.id,
        formData.description.trim() || undefined,
        undefined, // logoUrl
        formData.accessCode.trim().toUpperCase()
      );

      console.log('✅ Unité créée:', unit.id);

      // 3. Mettre à jour l'animateur avec le unitId
      await UserService.updateUser(animator.id, {
        unitId: unit.id,
        isUnitLeader: true
      });

      console.log('✅ Animateur mis à jour avec unitId');

      // 4. Rediriger vers le dashboard
      Alert.alert(
        'Bienvenue !',
        `Ton unité "${formData.name}" a été créée avec succès.`,
        [
          {
            text: 'Continuer',
            onPress: () => router.replace('/(animator)/dashboard'),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      Alert.alert(
        'Erreur',
        error?.message || 'Impossible de créer le compte et l\'unité'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <ThemedText style={styles.iconEmoji}>🏕</ThemedText>
          </View>
          <ThemedText style={styles.title}>Créer mon unité</ThemedText>
          <ThemedText style={styles.subtitle}>
            Renseigne les informations de ton unité
          </ThemedText>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Nom de l'unité */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Nom de l'unité *</ThemedText>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Ex: 15ème Unité Bruxelles"
              placeholderTextColor={colors.neutralLight}
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
            />
            {errors.name && (
              <ThemedText style={styles.errorText}>{errors.name}</ThemedText>
            )}
          </View>

          {/* Fédération */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Fédération *</ThemedText>
            <TextInput
              style={[styles.input, errors.category && styles.inputError]}
              placeholder="Ex: Scouts, Guides, Patro, SGP..."
              placeholderTextColor={colors.neutralLight}
              value={formData.category}
              onChangeText={(text) => {
                setFormData({ ...formData, category: text });
                if (errors.category) setErrors({ ...errors, category: '' });
              }}
            />
            <ThemedText style={styles.helperText}>
              Entre le nom de ta fédération scoute
            </ThemedText>
            {errors.category && (
              <ThemedText style={styles.errorText}>{errors.category}</ThemedText>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Description (optionnel)</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Décris ton unité en quelques mots..."
              placeholderTextColor={colors.neutralLight}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Code d'accès */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>Code d'accès de ton unité *</ThemedText>
              <Ionicons name="key-outline" size={18} color={colors.neutral} />
            </View>
            <TextInput
              style={[styles.input, errors.accessCode && styles.inputError]}
              placeholder="Ex: UNITE15BXL"
              placeholderTextColor={colors.neutralLight}
              value={formData.accessCode}
              onChangeText={(text) => {
                setFormData({ ...formData, accessCode: text.toUpperCase() });
                if (errors.accessCode) setErrors({ ...errors, accessCode: '' });
              }}
              autoCapitalize="characters"
            />
            <ThemedText style={styles.helperText}>
              Choisis un code unique que tes membres utiliseront pour rejoindre ton unité
            </ThemedText>
            {errors.accessCode && (
              <ThemedText style={styles.errorText}>{errors.accessCode}</ThemedText>
            )}
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                Créer mon unité
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <ThemedText style={styles.backButtonText}>Retour</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.neutral,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    minHeight: 80,
    paddingTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: colors.neutral,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },

  // Spacer
  spacer: {
    flex: 1,
    minHeight: 32,
  },

  // Buttons
  buttonsContainer: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
