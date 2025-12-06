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

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });

  const iconColor = useThemeColor({}, 'icon');

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

    // Validation email
    if (!email) {
      newErrors.email = 'L\'email est requis';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
      isValid = false;
    }

    // Validation mot de passe
    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(email, password);

      // La redirection sera gérée automatiquement par app/index.tsx en fonction du rôle
      router.replace('/');
    } catch (error) {
      Alert.alert('Erreur', 'Identifiants incorrects');
    }
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
              WeCamp
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Connectez-vous pour continuer
            </ThemedText>
          </View>

          <Card style={styles.card}>
            <Input
              label="Email"
              placeholder="votre.email@exemple.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon={<Ionicons name="mail-outline" size={20} color={iconColor} />}
            />

            <Input
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              autoComplete="password"
              icon={<Ionicons name="lock-closed-outline" size={20} color={iconColor} />}
            />

            <PrimaryButton
              title={isLoading ? 'Connexion...' : 'Se connecter'}
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.loginButton}
            />

            <ThemedText
              type="link"
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassword}
            >
              Mot de passe oublié ?
            </ThemedText>
          </Card>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Pas encore de compte ?{' '}
            </ThemedText>
            <ThemedText
              type="link"
              onPress={() => router.push('/(auth)/register')}
            >
              S'inscrire
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
    fontSize: 42,
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
  loginButton: {
    marginTop: 8,
  },
  forgotPassword: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
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
