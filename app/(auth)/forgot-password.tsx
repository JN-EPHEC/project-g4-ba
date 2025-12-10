import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Input, PrimaryButton, Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const iconColor = useThemeColor({}, 'icon');

  const validateEmail = () => {
    if (!email) {
      setError('L\'email est requis');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email invalide');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="mail-open-outline" size={64} color={BrandColors.primary[500]} />
            </View>
            <ThemedText type="title" style={[styles.successTitle, { color: BrandColors.primary[600] }]}>
              Email envoy
            </ThemedText>
            <ThemedText style={styles.successText}>
              Un email de rinitialisation a t envoy  {email}.
              Vrifiez votre bote de rception et suivez les instructions.
            </ThemedText>
            <ThemedText style={styles.spamNote}>
              Si vous ne recevez pas l'email, vrifiez vos spams.
            </ThemedText>
            <PrimaryButton
              title="Retour  la connexion"
              onPress={() => router.replace('/(auth)/login')}
              style={styles.backButton}
            />
          </View>
        </ScrollView>
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
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
              <Ionicons name="lock-open-outline" size={48} color={BrandColors.accent[500]} />
            </View>
            <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
              Mot de passe oubli ?
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Entrez votre adresse email et nous vous enverrons un lien pour rinitialiser votre mot de passe.
            </ThemedText>
          </View>

          <Card style={styles.card}>
            <Input
              label="Email"
              placeholder="votre.email@exemple.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              error={error}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              icon={<Ionicons name="mail-outline" size={20} color={iconColor} />}
            />

            <PrimaryButton
              title={isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
              onPress={handleResetPassword}
              disabled={isLoading}
              style={styles.submitButton}
            />
          </Card>

          <View style={styles.footer}>
            <Ionicons name="arrow-back" size={16} color={BrandColors.accent[500]} />
            <ThemedText
              type="link"
              onPress={() => router.back()}
              style={[styles.backLink, { color: BrandColors.accent[500] }]}
            >
              Retour  la connexion
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
  iconContainer: {
    marginBottom: 16,
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  backLink: {
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 24,
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  spamNote: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    minWidth: 200,
  },
});
