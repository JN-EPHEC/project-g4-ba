import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AvatarUploader } from '@/components/avatar-uploader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Animator } from '@/types';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const animator = user as Animator;
  const iconColor = useThemeColor({}, 'icon');

  // États pour les paramètres
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

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
              currentAvatarUrl={animator?.profilePicture}
              userName={animator ? `${animator.firstName} ${animator.lastName}` : undefined}
              size="xlarge"
            />
            <ThemedText type="title" style={styles.name}>
              {animator?.firstName} {animator?.lastName}
            </ThemedText>
            <ThemedText style={styles.email}>{animator?.email}</ThemedText>
          </View>
        </Card>

        {/* Panneau Paramètres */}
        <Card style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingsHeader}
            onPress={() => setSettingsExpanded(!settingsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.settingsHeaderLeft}>
              <Ionicons name="settings-outline" size={24} color={iconColor} />
              <ThemedText type="defaultSemiBold">Paramètres</ThemedText>
            </View>
            <Ionicons
              name={settingsExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={iconColor}
            />
          </TouchableOpacity>

          {settingsExpanded && (
            <View style={styles.settingsContent}>
              {/* Notifications Push */}
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="notifications-outline" size={20} color={iconColor} />
                  <View style={styles.settingItemText}>
                    <ThemedText type="defaultSemiBold">Notifications</ThemedText>
                    <ThemedText style={styles.settingItemDescription}>
                      Recevoir des notifications push
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#767577', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              {/* Notifications Email */}
              <View style={styles.settingItem}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="mail-outline" size={20} color={iconColor} />
                  <View style={styles.settingItemText}>
                    <ThemedText type="defaultSemiBold">Emails</ThemedText>
                    <ThemedText style={styles.settingItemDescription}>
                      Recevoir des notifications par email
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: '#767577', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              {/* À propos */}
              <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
                <View style={styles.settingItemLeft}>
                  <Ionicons name="information-circle-outline" size={20} color={iconColor} />
                  <View style={styles.settingItemText}>
                    <ThemedText type="defaultSemiBold">À propos</ThemedText>
                    <ThemedText style={styles.settingItemDescription}>
                      Version 1.0.0
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={iconColor} />
              </TouchableOpacity>
            </View>
          )}
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
  settingsCard: {
    padding: 0,
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsContent: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});
