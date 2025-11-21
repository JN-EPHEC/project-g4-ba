import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AvatarUploader } from '@/components/avatar-uploader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { Scout } from '@/types';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const scout = user as Scout;

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
            <AvatarUploader
              currentAvatarUrl={scout?.profilePicture}
              userName={scout ? `${scout.firstName} ${scout.lastName}` : undefined}
              size="xlarge"
            />
            <ThemedText type="title" style={styles.name}>
              {scout?.firstName} {scout?.lastName}
            </ThemedText>
            <ThemedText style={styles.email}>{scout?.email}</ThemedText>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Rôle</ThemedText>
              <ThemedText style={styles.infoValue}>Scout</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Points</ThemedText>
              <ThemedText style={styles.infoValue}>{scout?.points || 0}</ThemedText>
            </View>
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
    marginBottom: 24,
  },
  name: {
    marginTop: 16,
    fontSize: 24,
  },
  email: {
    marginTop: 4,
    opacity: 0.7,
  },
  infoSection: {
    width: '100%',
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e520',
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 20,
  },
});
