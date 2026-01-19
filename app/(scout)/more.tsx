import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Scout, Section, SECTION_COLORS, SECTION_EMOJIS } from '@/types';
import { SectionService } from '@/services/section-service';

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const scout = user as Scout;
  const iconColor = useThemeColor({}, 'icon');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const [section, setSection] = useState<Section | null>(null);

  // Charger les données de la section
  useFocusEffect(
    useCallback(() => {
      const loadSection = async () => {
        if (scout?.sectionId) {
          try {
            const sectionData = await SectionService.getSectionById(scout.sectionId);
            setSection(sectionData);
          } catch (error) {
            console.error('Erreur chargement section:', error);
          }
        }
      };
      loadSection();
    }, [scout?.sectionId])
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const sectionColor = section ? (SECTION_COLORS[section.sectionType] || BrandColors.primary[500]) : BrandColors.primary[500];
  const sectionEmoji = section ? (SECTION_EMOJIS[section.sectionType] || '🏕️') : '🏕️';

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Plus
        </ThemedText>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Mon compte
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(scout)/profile')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="person" size={24} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Mon profil</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Voir et modifier mes informations
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(scout)/section')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${sectionColor}15` }]}>
              <Text style={styles.sectionEmojiIcon}>{sectionEmoji}</Text>
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Ma section</ThemedText>
              <ThemedText style={[styles.actionDescription, section && { color: sectionColor }]}>
                {section ? section.name : 'Voir ma section'}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(scout)/leaderboard')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
              <Ionicons name="podium" size={24} color={BrandColors.accent[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Classement</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Voir le classement des scouts
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(scout)/health')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#ef444415' }]}>
              <Ionicons name="heart" size={24} color="#ef4444" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Fiche Santé</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Mes informations médicales
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
          Ressources
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(scout)/documents')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="folder-open" size={24} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Documents</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Accéder aux documents partagés
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
          Sécurité
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(scout)/change-password')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="lock-closed" size={24} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Changer le mot de passe</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Modifier mon mot de passe
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
          Confidentialite
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="document-text" size={24} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Politique de confidentialite</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Consulter nos engagements RGPD
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(scout)/delete-account')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#ef444415' }]}>
              <Ionicons name="trash" size={24} color="#ef4444" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold" style={{ color: '#ef4444' }}>
                Supprimer mon compte
              </ThemedText>
              <ThemedText style={styles.actionDescription}>
                Effacer toutes mes donnees
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
        </TouchableOpacity>

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
          Compte
        </ThemedText>

        <TouchableOpacity onPress={handleLogout}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#ef444415' }]}>
              <Ionicons name="log-out" size={24} color="#ef4444" />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold" style={{ color: '#ef4444' }}>
                Déconnexion
              </ThemedText>
              <ThemedText style={styles.actionDescription}>
                Se déconnecter de l'application
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={iconColor} />
          </Card>
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
  },
  title: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  actionCard: {
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  sectionEmojiIcon: {
    fontSize: 24,
  },
});
