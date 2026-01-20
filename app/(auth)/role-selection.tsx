import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { UserRole } from '@/types';
import { BrandColors } from '@/constants/theme';

type RoleOption = {
  role: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const roleOptions: RoleOption[] = [
  {
    role: UserRole.SCOUT,
    title: 'Je suis scout',
    description: 'Participe aux activités et relève des défis',
    icon: 'flash',
    color: BrandColors.accent[500], // Orange terracotta
  },
  {
    role: UserRole.PARENT,
    title: 'Je suis parent',
    description: 'Suis les activités de mon enfant',
    icon: 'people',
    color: BrandColors.primary[500], // Vert forêt
  },
  {
    role: UserRole.ANIMATOR,
    title: 'Je suis animateur',
    description: 'Gère mon unité et crée des activités',
    icon: 'star',
    color: BrandColors.primary[600], // Vert forêt foncé
  },
];

export default function RoleSelectionScreen() {
  const params = useLocalSearchParams();
  const { register, isLoading, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const tintColor = useThemeColor({}, 'tint');

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Sélectionne ton rôle', 'Choisis un rôle pour continuer ton inscription.');
      return;
    }

    // Si c'est un scout, rediriger vers la sélection d'unité
    if (selectedRole === UserRole.SCOUT) {
      router.push({
        pathname: '/(auth)/unit-selection',
        params: {
          email: params.email as string,
          password: params.password as string,
          firstName: params.firstName as string,
          lastName: params.lastName as string,
          dateOfBirth: params.dateOfBirth as string,
          role: selectedRole,
          consentGivenAt: params.consentGivenAt as string,
          consentVersion: params.consentVersion as string,
        },
      });
      return;
    }

    // Si c'est un animateur, rediriger vers la sélection de fédération + code d'accès
    if (selectedRole === UserRole.ANIMATOR) {
      router.push({
        pathname: '/(auth)/animator-unit-selection',
        params: {
          email: params.email as string,
          password: params.password as string,
          firstName: params.firstName as string,
          lastName: params.lastName as string,
          dateOfBirth: params.dateOfBirth as string,
          role: selectedRole,
          consentGivenAt: params.consentGivenAt as string,
          consentVersion: params.consentVersion as string,
        },
      });
      return;
    }

    try {
      // La fonction register retourne maintenant l'utilisateur créé
      const registeredUser = await register(
        params.email as string,
        params.password as string,
        params.firstName as string,
        params.lastName as string,
        selectedRole
      );

      // Utiliser le rôle de l'utilisateur retourné, ou le rôle sélectionné en fallback
      const roleToUse = registeredUser?.role || selectedRole;

      // Redirection basée sur le rôle
      switch (roleToUse) {
        case UserRole.PARENT:
          router.push('/(parent)/dashboard');
          break;
        case UserRole.ANIMATOR:
          router.push('/(animator)/dashboard');
          break;
        default:
          Alert.alert('Erreur', 'Impossible de déterminer ton rôle.', [
            { text: 'OK', style: 'default', onPress: () => router.push('/(auth)/login') }
          ]);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Impossible de créer ton compte';
      Alert.alert('Erreur', errorMessage, [{ text: 'OK', style: 'default' }]);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          {/* Icône nature */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: BrandColors.primary[500] }]}>
              <Ionicons name="compass" size={32} color="#FFFFFF" />
            </View>
          </View>
          <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
            Qui es-tu ?
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Sélectionne ton rôle pour personnaliser ton expérience
          </ThemedText>
        </View>

        <View style={styles.rolesContainer}>
          {roleOptions.map((option) => (
            <Pressable
              key={option.role}
              onPress={() => setSelectedRole(option.role)}
            >
              <Card
                style={[
                  styles.roleCard,
                  selectedRole === option.role && {
                    borderWidth: 2,
                    borderColor: tintColor,
                  },
                ].filter(Boolean) as ViewStyle[]}
              >
                <View style={styles.roleHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: option.color + '20' },
                    ]}
                  >
                    <Ionicons
                      name={option.icon}
                      size={32}
                      color={option.color}
                    />
                  </View>
                  {selectedRole === option.role && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={tintColor}
                    />
                  )}
                </View>

                <ThemedText type="subtitle" style={styles.roleTitle}>
                  {option.title}
                </ThemedText>
                <ThemedText style={styles.roleDescription}>
                  {option.description}
                </ThemedText>
              </Card>
            </Pressable>
          ))}
        </View>

        <PrimaryButton
          title={isLoading ? 'Création du compte...' : 'Continuer'}
          onPress={handleContinue}
          disabled={isLoading || !selectedRole}
          style={styles.continueButton}
        />

        <View style={styles.footer}>
          <ThemedText
            type="link"
            onPress={() => router.back()}
            style={{ color: BrandColors.accent[500] }}
          >
            Retour
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  rolesContainer: {
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    padding: 20,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  continueButton: {
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
  },
});
