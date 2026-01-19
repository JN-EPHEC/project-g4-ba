import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { AvatarUploader } from '@/components/avatar-uploader';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, ThemeSelector } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Scout } from '@/types';
import { RankProgressBar } from '@/components/rank-progress-bar';
import { TOTEM_ANIMALS } from '@/components/totem-selector';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { Radius } from '@/constants/design-tokens';
import { UserService } from '@/services/user-service';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const scout = user as Scout;
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);

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

  const handleEditProfile = () => {
    router.push('/(scout)/edit-profile');
  };

  const handleCopyCode = async () => {
    if (!scout?.linkCode) return;
    try {
      await Clipboard.setStringAsync(scout.linkCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  const handleRegenerateCode = async () => {
    console.log('🔘 Bouton régénération cliqué!');

    if (!scout?.id) {
      console.log('❌ Pas de scout ID');
      return;
    }

    // Demander confirmation
    const confirmMessage = 'Voulez-vous générer un nouveau code ?\nL\'ancien code ne fonctionnera plus.';
    let confirmed = false;

    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      // Sur mobile, on utilise une Promise pour attendre la réponse
      confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Nouveau code',
          confirmMessage,
          [
            { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Générer', onPress: () => resolve(true) },
          ]
        );
      });
    }

    if (!confirmed) {
      console.log('❌ Annulé par l\'utilisateur');
      return;
    }

    console.log('🔄 Début régénération code pour scout:', scout.id);
    setIsRegeneratingCode(true);

    try {
      // Ajouter un timeout de 10 secondes
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: la connexion prend trop de temps')), 10000);
      });

      const newCode = await Promise.race([
        UserService.regenerateLinkCode(scout.id),
        timeoutPromise
      ]);
      console.log('✅ Nouveau code généré:', newCode);

      // Mettre à jour l'utilisateur local avec le nouveau code
      await updateUser({ linkCode: newCode });
      console.log('✅ State utilisateur mis à jour');

      if (Platform.OS === 'web') {
        window.alert(`Nouveau code généré avec succès !\n\nNouveau code: ${newCode}`);
      } else {
        Alert.alert('Succès', `Nouveau code généré avec succès !\n\nNouveau code: ${newCode}`);
      }
    } catch (error) {
      console.error('❌ Erreur régénération:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur lors de la génération du code');
      } else {
        Alert.alert('Erreur', 'Impossible de générer un nouveau code');
      }
    } finally {
      setIsRegeneratingCode(false);
    }
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

            {/* Info récompenses unité */}
            <View style={[styles.rewardsInfo, { backgroundColor: `${BrandColors.accent[500]}10` }]}>
              <Ionicons name="gift-outline" size={16} color={BrandColors.accent[500]} />
              <ThemedText style={[styles.rewardsInfoText, { color: BrandColors.accent[600] }]}>
                Tes points s'ajoutent au solde de ton unité pour débloquer des récompenses !
              </ThemedText>
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

        {/* Code de liaison pour les parents */}
        <Card style={styles.linkCodeCard}>
          <View style={styles.linkCodeHeader}>
            <View style={styles.linkCodeIconContainer}>
              <Ionicons name="key" size={24} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.linkCodeHeaderText}>
              <ThemedText type="defaultSemiBold">Code de liaison parent</ThemedText>
              <ThemedText style={styles.linkCodeDescription}>
                Partagez ce code avec vos parents pour qu'ils puissent vous suivre sur l'app.
              </ThemedText>
            </View>
          </View>

          <View style={styles.linkCodeDisplay}>
            <ThemedText style={styles.linkCodeText}>
              {scout?.linkCode || 'Chargement...'}
            </ThemedText>
            <TouchableOpacity
              style={[styles.copyButton, codeCopied && styles.copyButtonSuccess]}
              onPress={handleCopyCode}
              activeOpacity={0.7}
            >
              <Ionicons
                name={codeCopied ? 'checkmark' : 'copy-outline'}
                size={20}
                color={codeCopied ? '#FFFFFF' : BrandColors.primary[500]}
              />
              <ThemedText style={[styles.copyButtonText, codeCopied && styles.copyButtonTextSuccess]}>
                {codeCopied ? 'Copié !' : 'Copier'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={handleRegenerateCode}
            disabled={isRegeneratingCode}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={16} color={NeutralColors.gray[500]} />
            <ThemedText style={styles.regenerateButtonText}>
              {isRegeneratingCode ? 'Génération...' : 'Générer un nouveau code'}
            </ThemedText>
          </TouchableOpacity>
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
  rewardsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  rewardsInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  // Link Code Styles
  linkCodeCard: {
    padding: 20,
    marginBottom: 20,
  },
  linkCodeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  linkCodeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BrandColors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkCodeHeaderText: {
    flex: 1,
  },
  linkCodeDescription: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 4,
    lineHeight: 18,
  },
  linkCodeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NeutralColors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  linkCodeText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.primary[50],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyButtonSuccess: {
    backgroundColor: BrandColors.primary[500],
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.primary[500],
  },
  copyButtonTextSuccess: {
    color: '#FFFFFF',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  regenerateButtonText: {
    fontSize: 13,
    color: NeutralColors.gray[500],
  },
});
