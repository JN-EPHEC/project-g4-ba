import React from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Avatar, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { Animator } from '@/types';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const animator = user as Animator;

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Profil
        </ThemedText>

        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              name={animator ? `${animator.firstName} ${animator.lastName}` : undefined}
              imageUrl={animator?.profilePicture}
              size="xlarge"
            />
            <ThemedText type="title" style={styles.name}>
              {animator?.firstName} {animator?.lastName}
            </ThemedText>
            <ThemedText style={styles.email}>{animator?.email}</ThemedText>
          </View>
        </Card>

        <PrimaryButton
          title="Déconnexion"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    marginBottom: 20,
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
  },
  name: {
    marginTop: 16,
    fontSize: 24,
  },
  email: {
    marginTop: 4,
    opacity: 0.7,
  },
  logoutButton: {
    marginTop: 20,
  },
});
