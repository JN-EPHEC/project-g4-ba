import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AvatarUploader } from '@/components/avatar-uploader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, ThemeSelector } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Scout } from '@/types';
import { RankProgressBar } from '@/components/rank-progress-bar';
import { TOTEM_ANIMALS } from '@/components/totem-selector';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const scout = user as Scout;
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  const [themeExpanded, setThemeExpanded] = useState(false);

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
    router.push('/(scout)/edit-profile');
  };

  // Calculer l'âge
  const getAge = () => {
    if (!scout?.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(scout.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
              currentAvatarUrl={scout?.profilePicture}
              userName={scout ? `${scout.firstName} ${scout.lastName}` : undefined}
              size="xlarge"
            />
            <ThemedText type="title" style={styles.name}>
              {scout?.firstName} {scout?.lastName}
            </ThemedText>

            {/* Nom de totem */}
            {(scout?.totemName || scout?.totemAnimal) && (
              <View style={[styles.totemBadge, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
                {scout?.totemAnimal ? (
                  <ThemedText style={styles.totemEmoji}>
                    {TOTEM_ANIMALS.find(a => a.name === scout.totemAnimal)?.emoji || '🐾'}
                  </ThemedText>
                ) : (
                  <Ionicons name="paw" size={14} color={BrandColors.accent[500]} />
                )}
                <ThemedText style={[styles.totemName, { color: BrandColors.accent[500] }]}>
                  {scout?.totemName || scout?.totemAnimal}
                </ThemedText>
              </View>
            )}

            <ThemedText style={styles.email}>{scout?.email}</ThemedText>
          </View>

          {/* Bio */}
          {scout?.bio && (
            <View style={[styles.bioSection, { borderTopColor: borderColor }]}>
              <ThemedText style={styles.bioText}>"{scout.bio}"</ThemedText>
            </View>
          )}

          {/* Barre de progression XP */}
          <View style={[styles.rankSection, { borderTopColor: borderColor, borderBottomColor: borderColor }]}>
            <RankProgressBar xp={scout?.points || 0} />
          </View>

          <View style={styles.infoSection}>
            <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
              <ThemedText style={styles.infoLabel}>Rôle</ThemedText>
              <ThemedText style={styles.infoValue}>Scout</ThemedText>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
              <ThemedText style={styles.infoLabel}>Points</ThemedText>
              <ThemedText style={styles.infoValue}>{scout?.points || 0}</ThemedText>
            </View>
            {getAge() && (
              <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
                <ThemedText style={styles.infoLabel}>Âge</ThemedText>
                <ThemedText style={styles.infoValue}>{getAge()} ans</ThemedText>
              </View>
            )}
            {scout?.totemAnimal && (
              <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
                <ThemedText style={styles.infoLabel}>Animal totem</ThemedText>
                <View style={styles.totemInfoValue}>
                  <ThemedText style={styles.totemEmoji}>
                    {TOTEM_ANIMALS.find(a => a.name === scout.totemAnimal)?.emoji || '🐾'}
                  </ThemedText>
                  <ThemedText style={styles.infoValue}>{scout.totemAnimal}</ThemedText>
                </View>
              </View>
            )}
            {scout?.phone && (
              <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
                <ThemedText style={styles.infoLabel}>Téléphone</ThemedText>
                <ThemedText style={styles.infoValue}>{scout.phone}</ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Fiche Santé */}
        <Card style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingsHeader}
            onPress={() => router.push('/(scout)/health')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsHeaderLeft}>
              <Ionicons name="medkit-outline" size={24} color={BrandColors.primary[500]} />
              <ThemedText type="defaultSemiBold">Fiche Santé</ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={iconColor}
            />
          </TouchableOpacity>
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

        {/* Sécurité */}
        <Card style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingsHeader}
            onPress={() => router.push('/(scout)/change-password')}
            activeOpacity={0.7}
          >
            <View style={styles.settingsHeaderLeft}>
              <Ionicons name="lock-closed-outline" size={24} color={iconColor} />
              <ThemedText type="defaultSemiBold">Changer le mot de passe</ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={iconColor}
            />
          </TouchableOpacity>
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
  profileCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  rankSection: {
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    marginTop: 16,
    fontSize: 24,
  },
  totemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  totemName: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  totemEmoji: {
    fontSize: 16,
  },
  totemInfoValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  email: {
    marginTop: 8,
    opacity: 0.7,
  },
  bioSection: {
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    marginBottom: 0,
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
    gap: 12,
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
  themeContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
});
