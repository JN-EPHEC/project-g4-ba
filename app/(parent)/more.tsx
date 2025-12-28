import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { BrandColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const { parentPendingDocumentsCount } = useNotifications();
  const iconColor = useThemeColor({}, 'icon');

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>
          Plus
        </ThemedText>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Mon compte
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(parent)/profile')}>
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

        <ThemedText type="subtitle" style={[styles.sectionTitle, { marginTop: 24 }]}>
          Ressources
        </ThemedText>

        <TouchableOpacity onPress={() => router.push('/(parent)/documents')}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: `${BrandColors.primary[500]}15` }]}>
              <Ionicons name="document-text" size={24} color={BrandColors.primary[500]} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText type="defaultSemiBold">Documents</ThemedText>
              <ThemedText style={styles.actionDescription}>
                {parentPendingDocumentsCount > 0
                  ? `${parentPendingDocumentsCount} document${parentPendingDocumentsCount > 1 ? 's' : ''} à signer`
                  : 'Accéder aux documents partagés'}
              </ThemedText>
            </View>
            <View style={styles.actionRight}>
              {parentPendingDocumentsCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{parentPendingDocumentsCount}</ThemedText>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={iconColor} />
            </View>
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
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
