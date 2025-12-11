import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AvatarUploader } from '@/components/avatar-uploader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, ThemeSelector } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Animator } from '@/types';
import { TOTEM_ANIMALS } from '@/components/totem-selector';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const animator = user as Animator;
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');

  // États pour les paramètres
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [themeExpanded, setThemeExpanded] = useState(false);
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

  const handleEditProfile = () => {
    router.push('/(animator)/edit-profile');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.title}>
            Profil
          </ThemedText>
          <TouchableOpacity
            onPress={handleEditProfile}
            style={[styles.editButton, { backgroundColor: `${BrandColors.accent[500]}15` }]}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={20} color={BrandColors.accent[500]} />
            <ThemedText style={[styles.editButtonText, { color: BrandColors.accent[500] }]}>Modifier</ThemedText>
          </TouchableOpacity>
        </View>

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

            {/* Badge animateur */}
            <View style={[styles.roleBadge, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
              <Ionicons name="star" size={14} color={BrandColors.accent[500]} />
              <ThemedText style={[styles.roleText, { color: BrandColors.accent[500] }]}>
                {animator?.isUnitLeader ? 'Chef d\'unité' : 'Animateur'}
              </ThemedText>
            </View>

            {/* Nom de totem */}
            {(animator?.totemName || animator?.totemAnimal) && (
              <View style={[styles.totemBadge, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
                {animator?.totemAnimal ? (
                  <ThemedText style={styles.totemEmoji}>
                    {TOTEM_ANIMALS.find(a => a.name === animator.totemAnimal)?.emoji || '🐾'}
                  </ThemedText>
                ) : (
                  <Ionicons name="paw" size={14} color={BrandColors.primary[500]} />
                )}
                <ThemedText style={[styles.totemName, { color: BrandColors.primary[500] }]}>
                  {animator?.totemName || animator?.totemAnimal}
                </ThemedText>
              </View>
            )}

            <ThemedText style={styles.email}>{animator?.email}</ThemedText>
          </View>

          {/* Bio */}
          {animator?.bio && (
            <View style={[styles.bioSection, { borderTopColor: borderColor }]}>
              <ThemedText style={styles.bioText}>"{animator.bio}"</ThemedText>
            </View>
          )}

          {/* Infos */}
          {(animator?.phone || (animator?.specialties && animator.specialties.length > 0)) && (
            <View style={[styles.infoSection, { borderTopColor: borderColor }]}>
              {animator?.phone && (
                <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
                  <ThemedText style={styles.infoLabel}>Téléphone</ThemedText>
                  <ThemedText style={styles.infoValue}>{animator.phone}</ThemedText>
                </View>
              )}
              {animator?.specialties && animator.specialties.length > 0 && (
                <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
                  <ThemedText style={styles.infoLabel}>Spécialités</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {animator.specialties.join(', ')}
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Panneau Apparence */}
        <Card style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingsHeader}
            onPress={() => setThemeExpanded(!themeExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.settingsHeaderLeft}>
              <Ionicons name="color-palette-outline" size={24} color={iconColor} />
              <ThemedText type="defaultSemiBold">Apparence</ThemedText>
            </View>
            <Ionicons
              name={themeExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={iconColor}
            />
          </TouchableOpacity>

          {themeExpanded && (
            <View style={[styles.themeContent, { borderTopColor: borderColor }]}>
              <ThemeSelector />
            </View>
          )}
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
            <View style={[styles.settingsContent, { borderTopColor: borderColor }]}>
              {/* Notifications Push */}
              <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
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
                  trackColor={{ false: '#767577', true: tintColor }}
                  thumbColor="#fff"
                />
              </View>

              {/* Notifications Email */}
              <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
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
                  trackColor={{ false: '#767577', true: tintColor }}
                  thumbColor="#fff"
                />
              </View>

              {/* À propos */}
              <TouchableOpacity style={[styles.settingItem, { borderBottomColor: borderColor }]} activeOpacity={0.7}>
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
    paddingBottom: 100,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    marginBottom: 0,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#3b82f620',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  roleText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  totemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  totemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  totemEmoji: {
    fontSize: 16,
  },
  bioSection: {
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  bioText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
  },
  infoSection: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
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
    maxWidth: '60%',
    textAlign: 'right',
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
  themeContent: {
    padding: 16,
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
