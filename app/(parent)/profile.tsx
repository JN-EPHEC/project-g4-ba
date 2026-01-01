import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AvatarUploader } from '@/components/avatar-uploader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, ThemeSelector } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Parent } from '@/types';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const parent = user as Parent;
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const [themeExpanded, setThemeExpanded] = useState(false);

  const handleEditProfile = () => {
    router.push('/(parent)/edit-profile');
  };

  const handleLogout = () => {
    console.log('🔘 Bouton Déconnexion cliqué!');

    const doLogout = async () => {
      try {
        console.log('✅ Confirmation de déconnexion');
        await logout();
        console.log('🔄 Redirection vers login...');
        router.replace('/(auth)/auth');
      } catch (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
      }
    };

    // Sur web, utiliser confirm, sinon Alert.alert
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        doLogout();
      }
    } else {
      Alert.alert(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Déconnexion', style: 'destructive', onPress: doLogout },
        ]
      );
    }
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
              currentAvatarUrl={parent?.profilePicture}
              userName={parent ? `${parent.firstName} ${parent.lastName}` : undefined}
              size="xlarge"
            />
            <ThemedText type="title" style={styles.name}>
              {parent?.firstName} {parent?.lastName}
            </ThemedText>

            {/* Badge parent */}
            <View style={[styles.roleBadge, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="people" size={14} color={BrandColors.primary[500]} />
              <ThemedText style={[styles.roleText, { color: BrandColors.primary[500] }]}>Parent</ThemedText>
            </View>

            <ThemedText style={styles.email}>{parent?.email}</ThemedText>
          </View>

          {/* Bio */}
          {parent?.bio && (
            <View style={[styles.bioSection, { borderTopColor: borderColor }]}>
              <ThemedText style={styles.bioText}>"{parent.bio}"</ThemedText>
            </View>
          )}

          {/* Infos */}
          {parent?.phone && (
            <View style={[styles.infoSection, { borderTopColor: borderColor }]}>
              <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
                <ThemedText style={styles.infoLabel}>Téléphone</ThemedText>
                <ThemedText style={styles.infoValue}>{parent.phone}</ThemedText>
              </View>
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
    backgroundColor: '#10b98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  roleText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: 8,
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
  themeContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
});
