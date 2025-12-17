import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Input, PrimaryButton, Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { UserRole } from '@/types';
import { BrandColors } from '@/constants/theme';

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: new Date(2010, 0, 1), // Date par défaut
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const iconColor = useThemeColor({}, 'icon');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, dateOfBirth: selectedDate });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    // Vérifier que la date de naissance est valide (entre 5 et 100 ans)
    const today = new Date();
    const age = today.getFullYear() - formData.dateOfBirth.getFullYear();
    if (age < 5 || age > 100) {
      newErrors.dateOfBirth = 'La date de naissance doit correspondre à un âge entre 5 et 100 ans';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // Rediriger vers la sélection du rôle
    router.push({
      pathname: '/(auth)/role-selection',
      params: {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth.toISOString(),
      },
    });
  };

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
          <View style={styles.header}>
            {/* Logo avec icône nature */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoIcon, { backgroundColor: BrandColors.accent[500] }]}>
                <Ionicons name="people" size={32} color="#FFFFFF" />
              </View>
            </View>
            <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
              Créer un compte
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Rejoignez WeCamp
            </ThemedText>
          </View>

          <Card style={styles.card}>
            <Input
              label="Prénom"
              placeholder="Jean"
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              error={errors.firstName}
              autoComplete="given-name"
              icon={<Ionicons name="person-outline" size={20} color={iconColor} />}
            />

            <Input
              label="Nom"
              placeholder="Dupont"
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              error={errors.lastName}
              autoComplete="family-name"
              icon={<Ionicons name="person-outline" size={20} color={iconColor} />}
            />

            {/* Date de naissance */}
            <View style={styles.datePickerContainer}>
              <ThemedText style={styles.dateLabel}>Date de naissance</ThemedText>
              <TouchableOpacity
                style={[styles.dateButton, errors.dateOfBirth ? styles.dateButtonError : null]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color={iconColor} />
                <ThemedText style={styles.dateText}>
                  {formatDate(formData.dateOfBirth)}
                </ThemedText>
              </TouchableOpacity>
              {errors.dateOfBirth ? (
                <ThemedText style={styles.errorText}>{errors.dateOfBirth}</ThemedText>
              ) : null}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.dateOfBirth}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
              />
            )}

            <Input
              label="Email"
              placeholder="votre.email@exemple.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon={<Ionicons name="mail-outline" size={20} color={iconColor} />}
            />

            <Input
              label="Mot de passe"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              error={errors.password}
              secureTextEntry
              autoComplete="password-new"
              icon={<Ionicons name="lock-closed-outline" size={20} color={iconColor} />}
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              error={errors.confirmPassword}
              secureTextEntry
              autoComplete="password-new"
              icon={<Ionicons name="lock-closed-outline" size={20} color={iconColor} />}
            />

            <PrimaryButton
              title={isLoading ? 'Inscription...' : 'Continuer'}
              onPress={handleRegister}
              disabled={isLoading}
              style={styles.registerButton}
            />
          </Card>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Déjà un compte ?{' '}
            </ThemedText>
            <ThemedText
              type="link"
              onPress={() => router.push('/(auth)/login')}
              style={{ color: BrandColors.accent[500] }}
            >
              Se connecter
            </ThemedText>
          </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    marginBottom: 24,
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    backgroundColor: '#2A2A2A',
  },
  dateButtonError: {
    borderColor: '#ef4444',
  },
  dateText: {
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});
