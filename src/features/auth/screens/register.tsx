import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Input, PrimaryButton, Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { UserRole } from '@/types';

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const iconColor = useThemeColor({}, 'icon');

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
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
            <ThemedText type="title" style={styles.title}>
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
              onPress={() => router.back()}
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
});
