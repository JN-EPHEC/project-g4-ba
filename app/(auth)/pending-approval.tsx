import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export default function PendingApprovalScreen() {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={[styles.container, { backgroundColor: '#f9fafb' }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${BrandColors.accent[500]}20` }]}>
          <Ionicons name="time-outline" size={80} color={BrandColors.accent[500]} />
        </View>

        <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
          Inscription en attente
        </ThemedText>

        <ThemedText style={styles.description}>
          Ton compte a été créé avec succès ! 🎉
        </ThemedText>

        <View style={styles.infoBox}>
          <ThemedText style={styles.infoText}>
            Un animateur va valider ton inscription prochainement. Tu recevras une notification dès que ton compte sera activé.
          </ThemedText>
        </View>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: `${BrandColors.primary[500]}20` }]}>
              <Ionicons name="checkmark-circle" size={24} color={BrandColors.primary[500]} />
            </View>
            <ThemedText style={styles.stepText}>
              Compte créé
            </ThemedText>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: `${BrandColors.accent[500]}20` }]}>
              <Ionicons name="time" size={24} color={BrandColors.accent[500]} />
            </View>
            <ThemedText style={styles.stepText}>
              En attente de validation
            </ThemedText>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: '#9ca3af20' }]}>
              <Ionicons name="rocket" size={24} color="#9ca3af" />
            </View>
            <ThemedText style={styles.stepText}>
              Prêt à démarrer
            </ThemedText>
          </View>
        </View>

        <View style={styles.tipsContainer}>
          <ThemedText style={styles.tipsTitle}>
            En attendant...
          </ThemedText>
          <ThemedText style={styles.tipsText}>
            • Vérifie que ton email est correct{'\n'}
            • Prépare-toi pour ta première activité{'\n'}
            • La validation prend généralement 24-48h
          </ThemedText>
        </View>

        <PrimaryButton
          title="Retour à la connexion"
          onPress={() => router.push('/(auth)/login')}
          style={styles.button}
        />

        <ThemedText
          type="link"
          onPress={() => router.push('/(auth)/register')}
          style={[styles.link, { color: BrandColors.accent[500] }]}
        >
          Créer un autre compte
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#111827',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#374151',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    width: '100%',
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
  },
  stepDivider: {
    width: 30,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginBottom: 30,
  },
  tipsContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#92400e',
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#78350f',
  },
  button: {
    width: '100%',
    marginBottom: 16,
  },
  link: {
    fontSize: 16,
  },
});
