import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';

export default function AuthScreen() {
  const { login, isLoading } = useAuth();

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      const userData = await login(email, password);
      console.log('🔐 ============================================');
      console.log('🔐 Connexion réussie - userData:', JSON.stringify(userData, null, 2));
      console.log('🔐 Rôle de l\'utilisateur:', userData.role);
      console.log('🔐 Type du rôle:', typeof userData.role);
      console.log('🔐 UserRole.ANIMATOR:', UserRole.ANIMATOR);
      console.log('🔐 Comparaison animator:', userData.role === UserRole.ANIMATOR, 'ou', userData.role === 'animator');
      console.log('🔐 Comparaison scout:', userData.role === UserRole.SCOUT, 'ou', userData.role === 'scout');
      console.log('🔐 Comparaison parent:', userData.role === UserRole.PARENT, 'ou', userData.role === 'parent');

      // Petite pause pour s'assurer que l'état est bien mis à jour dans le contexte
      await new Promise(resolve => setTimeout(resolve, 100));

      // Rediriger directement vers le bon dashboard selon le rôle
      if (userData.role === UserRole.ANIMATOR || userData.role === 'animator') {
        console.log('🔐 >>> REDIRECTION vers /(animator)/dashboard');
        router.replace('/(animator)/dashboard');
      } else if (userData.role === UserRole.SCOUT || userData.role === 'scout') {
        console.log('🔐 >>> REDIRECTION vers /(scout)/dashboard');
        router.replace('/(scout)/dashboard');
      } else if (userData.role === UserRole.PARENT || userData.role === 'parent') {
        console.log('🔐 >>> REDIRECTION vers /(parent)/dashboard');
        router.replace('/(parent)/dashboard');
      } else {
        console.log('🔐 >>> Rôle inconnu:', userData.role, '- redirection vers /');
        router.replace('/');
      }
      console.log('🔐 ============================================');
    } catch (error: any) {
      console.error('❌ Erreur de connexion:', error);
      setError(error.message || 'Erreur de connexion');
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleSignUp = () => {
    // Aller vers l'onboarding avant l'inscription
    router.push('/(auth)/onboarding');
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    Alert.alert(
      'Bientôt disponible',
      `La connexion avec ${provider === 'google' ? 'Google' : 'Apple'} sera disponible prochainement.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header vert */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.headerTitle}>WeCamp</Text>
        <Text style={styles.headerSubtitle}>Connectez-vous pour continuer</Text>
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Formulaire de connexion */}
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="votre.email@exemple.com"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>

        {/* Lien S'inscrire */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    backgroundColor: '#2D5A3D',
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2D5A3D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPassword: {
    color: '#D97B4A',
    fontSize: 14,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signUpText: {
    fontSize: 15,
    color: '#6B7280',
  },
  signUpLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D97B4A',
  },
});
