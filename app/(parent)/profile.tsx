import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';

import { AvatarUploader } from '@/components/avatar-uploader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { Parent } from '@/types';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const parent = user as Parent;

  const handleLogout = () => {
    console.log('🔘 Bouton Déconnexion cliqué!');

    // Version simplifiée qui fonctionne toujours
    const confirmLogout = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');

    if (confirmLogout) {
      console.log('✅ Confirmation de déconnexion');

      // Appeler logout en arrière-plan
      logout().catch(error => {
        console.error('❌ Erreur lors de la déconnexion:', error);
      });

      // Recharger immédiatement la page
      console.log('🔄 Rechargement de la page...');
      if (typeof window !== 'undefined') {
        window.location.href = '/(auth)/login';
      }
    } else {
      console.log('❌ Déconnexion annulée');
    }
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
              currentAvatarUrl={parent?.profilePicture}
              userName={parent ? `${parent.firstName} ${parent.lastName}` : undefined}
              size="xlarge"
            />
            <ThemedText type="title" style={styles.name}>
              {parent?.firstName} {parent?.lastName}
            </ThemedText>
            <ThemedText style={styles.email}>{parent?.email}</ThemedText>
          </View>
        </Card>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.logoutButtonText}>Déconnexion</ThemedText>
        </TouchableOpacity>
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
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
