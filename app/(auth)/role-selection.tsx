import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Alert, type ViewStyle } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton, Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { UserRole } from '@/types';

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
    title: 'Scout',
    description: 'Participe aux activités, relève des défis et gagne des points',
    icon: 'flash',
    color: '#3b82f6',
  },
  {
    role: UserRole.PARENT,
    title: 'Parent',
    description: 'Suit les activités de ses scouts et valide les défis',
    icon: 'people',
    color: '#8b5cf6',
  },
  {
    role: UserRole.ANIMATOR,
    title: 'Animateur',
    description: 'Crée des activités, gère l\'unité et anime les scouts',
    icon: 'star',
    color: '#f59e0b',
  },
];

export default function RoleSelectionScreen() {
  const params = useLocalSearchParams();
  const { register, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const tintColor = useThemeColor({}, 'tint');

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Sélection requise', 'Veuillez choisir un rôle pour continuer');
      return;
    }

    console.log('🔵 [ROLE SELECTION] Données d\'inscription:');
    console.log('  - Email:', params.email);
    console.log('  - Prénom:', params.firstName);
    console.log('  - Nom:', params.lastName);
    console.log('  - Rôle:', selectedRole);

    try {
      console.log('🔵 [ROLE SELECTION] Appel de la fonction register...');

      await register(
        params.email as string,
        params.password as string,
        params.firstName as string,
        params.lastName as string,
        selectedRole
      );

      console.log('✅ [ROLE SELECTION] Inscription réussie!');

      // Redirection basée sur le rôle
      console.log('🔵 [ROLE SELECTION] Redirection vers le dashboard...');
      switch (selectedRole) {
        case UserRole.SCOUT:
          router.replace('/(scout)/dashboard');
          break;
        case UserRole.PARENT:
          router.replace('/(parent)/dashboard');
          break;
        case UserRole.ANIMATOR:
          router.replace('/(animator)/dashboard');
          break;
      }
    } catch (error: any) {
      console.error('❌ [ROLE SELECTION] Erreur lors de l\'inscription:', error);
      console.error('❌ [ROLE SELECTION] Message d\'erreur:', error.message);
      console.error('❌ [ROLE SELECTION] Stack:', error.stack);

      const errorMessage = error.message || 'Une erreur est survenue lors de l\'inscription';
      Alert.alert('Erreur d\'inscription', errorMessage);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Choisissez votre rôle
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Vous pourrez le modifier plus tard dans les paramètres
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
          title={isLoading ? 'Inscription...' : 'Continuer'}
          onPress={handleContinue}
          disabled={isLoading || !selectedRole}
          style={styles.continueButton}
        />

        <View style={styles.footer}>
          <ThemedText
            type="link"
            onPress={() => router.back()}
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
