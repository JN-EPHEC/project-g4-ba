import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BrandColors } from '@/constants/theme';

export default function ChangePasswordScreen() {
  const { changePassword } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const inputBackground = isDark ? '#2A2A2A' : '#F5F5F5';
  const placeholderColor = isDark ? '#9CA3AF' : '#6B7280';
  const errorColor = useThemeColor({}, 'error');

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): string | null => {
    if (!formData.currentPassword) {
      return 'Veuillez entrer votre mot de passe actuel';
    }
    if (!formData.newPassword) {
      return 'Veuillez entrer un nouveau mot de passe';
    }
    if (formData.newPassword.length < 6) {
      return 'Le nouveau mot de passe doit contenir au moins 6 caractères';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      return 'Les mots de passe ne correspondent pas';
    }
    if (formData.currentPassword === formData.newPassword) {
      return 'Le nouveau mot de passe doit être différent de l\'ancien';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await changePassword(formData.currentPassword, formData.newPassword);

      Alert.alert(
        'Succès',
        'Votre mot de passe a été modifié avec succès !',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid =
    formData.currentPassword.length > 0 &&
    formData.newPassword.length >= 6 &&
    formData.confirmPassword === formData.newPassword;

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
              Changer le mot de passe
            </ThemedText>
            <View style={styles.placeholder} />
          </View>

          {/* Icon */}
          <View style={styles.iconSection}>
            <View style={[styles.iconCircle, { backgroundColor: `${BrandColors.primary[500]}20` }]}>
              <Ionicons name="lock-closed" size={40} color={BrandColors.primary[500]} />
            </View>
          </View>

          {/* Error message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${errorColor}15` }]}>
              <Ionicons name="alert-circle" size={20} color={errorColor} />
              <ThemedText style={[styles.errorText, { color: errorColor }]}>
                {error}
              </ThemedText>
            </View>
          )}

          {/* Form */}
          <Card style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Modification du mot de passe
            </ThemedText>

            {/* Current Password */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Mot de passe actuel</ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                  value={formData.currentPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, currentPassword: text });
                    setError(null);
                  }}
                  placeholder="Entrez votre mot de passe actuel"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry={!showPasswords.current}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                >
                  <Ionicons
                    name={showPasswords.current ? 'eye-off' : 'eye'}
                    size={22}
                    color={iconColor}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nouveau mot de passe</ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                  value={formData.newPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, newPassword: text });
                    setError(null);
                  }}
                  placeholder="Entrez votre nouveau mot de passe"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry={!showPasswords.new}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                >
                  <Ionicons
                    name={showPasswords.new ? 'eye-off' : 'eye'}
                    size={22}
                    color={iconColor}
                  />
                </TouchableOpacity>
              </View>
              <ThemedText style={styles.hint}>
                Minimum 6 caractères
              </ThemedText>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Confirmer le nouveau mot de passe</ThemedText>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                  value={formData.confirmPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, confirmPassword: text });
                    setError(null);
                  }}
                  placeholder="Confirmez votre nouveau mot de passe"
                  placeholderTextColor={placeholderColor}
                  secureTextEntry={!showPasswords.confirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                >
                  <Ionicons
                    name={showPasswords.confirm ? 'eye-off' : 'eye'}
                    size={22}
                    color={iconColor}
                  />
                </TouchableOpacity>
              </View>
              {formData.confirmPassword.length > 0 && formData.newPassword !== formData.confirmPassword && (
                <ThemedText style={[styles.hint, { color: errorColor }]}>
                  Les mots de passe ne correspondent pas
                </ThemedText>
              )}
              {formData.confirmPassword.length > 0 && formData.newPassword === formData.confirmPassword && (
                <View style={styles.matchContainer}>
                  <Ionicons name="checkmark-circle" size={16} color={BrandColors.primary[500]} />
                  <ThemedText style={[styles.hint, { color: BrandColors.primary[500] }]}>
                    Les mots de passe correspondent
                  </ThemedText>
                </View>
              )}
            </View>
          </Card>

          {/* Save Button */}
          <PrimaryButton
            title={isSaving ? 'Modification...' : 'Modifier le mot de passe'}
            onPress={handleSave}
            disabled={isSaving || !isFormValid}
            style={styles.saveButton}
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
    paddingBottom: 40,
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
  iconSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
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
  passwordContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 6,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  saveButton: {
    marginTop: 8,
  },
});
