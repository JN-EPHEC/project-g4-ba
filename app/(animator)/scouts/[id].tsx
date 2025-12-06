import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, PrimaryButton } from '@/components/ui';
import { RankBadge } from '@/components/rank-badge';
import { UserService } from '@/services/user-service';
import { Scout } from '@/types';

export default function ScoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scout, setScout] = useState<Scout | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadScout();
    }
  }, [id]);

  const loadScout = async () => {
    try {
      setLoading(true);
      const userData = await UserService.getUserById(id as string);
      if (userData && userData.role === 'scout') {
        setScout(userData as Scout);
      }
    } catch (error) {
      console.error('Erreur chargement scout:', error);
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirmation = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Êtes-vous sûr de vouloir supprimer ${scout?.firstName} ${scout?.lastName} de l'unité ?\n\nCette action est irréversible.`
      );
      if (confirmed) {
        handleDelete();
      }
    } else {
      Alert.alert(
        'Supprimer le scout',
        `Êtes-vous sûr de vouloir supprimer ${scout?.firstName} ${scout?.lastName} de l'unité ?\n\nCette action est irréversible.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: handleDelete },
        ]
      );
    }
  };

  const handleDelete = async () => {
    if (!scout) return;

    try {
      setDeleting(true);
      // Retirer le scout de l'unité (ne pas supprimer le compte, juste retirer de l'unité)
      await UserService.updateUser(scout.id, { unitId: '' });

      if (Platform.OS === 'web') {
        window.alert('Scout retiré de l\'unité avec succès');
      } else {
        Alert.alert('Succès', 'Scout retiré de l\'unité avec succès');
      }
      router.back();
    } catch (error) {
      console.error('Erreur suppression scout:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur lors de la suppression');
      } else {
        Alert.alert('Erreur', 'Impossible de supprimer le scout');
      }
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!scout) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <ThemedText style={styles.errorText}>Scout introuvable</ThemedText>
          <PrimaryButton title="Retour" onPress={() => router.back()} style={{ marginTop: 20 }} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header avec bouton retour */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>Profil Scout</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar et infos principales */}
        <View style={styles.profileSection}>
          {scout.profilePicture ? (
            <Image source={{ uri: scout.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <ThemedText style={styles.avatarText}>
                {scout.firstName.charAt(0)}{scout.lastName.charAt(0)}
              </ThemedText>
            </View>
          )}
          <ThemedText type="title" style={styles.name}>
            {scout.firstName} {scout.lastName}
          </ThemedText>
          {scout.totemName && (
            <ThemedText style={styles.totem}>
              🦊 {scout.totemName} {scout.totemAnimal ? `(${scout.totemAnimal})` : ''}
            </ThemedText>
          )}
          <RankBadge xp={scout.points || 0} size="large" />
        </View>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{scout.points || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Points</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {scout.dateOfBirth ? calculateAge(scout.dateOfBirth) : '-'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Ans</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {scout.validated ? '✓' : '⏳'}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Validé</ThemedText>
            </View>
          </View>
        </Card>

        {/* Informations */}
        <Card style={styles.infoCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Informations</ThemedText>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#888" />
            <ThemedText style={styles.infoText}>{scout.email}</ThemedText>
          </View>

          {scout.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#888" />
              <ThemedText style={styles.infoText}>{scout.phone}</ThemedText>
            </View>
          )}

          {scout.dateOfBirth && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#888" />
              <ThemedText style={styles.infoText}>
                Né(e) le {formatDate(scout.dateOfBirth)}
              </ThemedText>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#888" />
            <ThemedText style={styles.infoText}>
              Inscrit le {formatDate(scout.createdAt)}
            </ThemedText>
          </View>
        </Card>

        {/* Bio */}
        {scout.bio && (
          <Card style={styles.infoCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Bio</ThemedText>
            <ThemedText style={styles.bioText}>{scout.bio}</ThemedText>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <PrimaryButton
            title={deleting ? 'Suppression...' : 'Retirer de l\'unité'}
            variant="danger"
            onPress={showDeleteConfirmation}
            disabled={deleting}
            fullWidth
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#888',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '600',
  },
  name: {
    color: '#FFFFFF',
    marginBottom: 8,
  },
  totem: {
    color: '#888',
    fontSize: 16,
    marginBottom: 12,
  },
  statsCard: {
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#3A3A3A',
  },
  infoCard: {
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  sectionTitle: {
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  infoText: {
    color: '#CCCCCC',
    fontSize: 15,
    flex: 1,
  },
  bioText: {
    color: '#CCCCCC',
    fontSize: 15,
    lineHeight: 22,
  },
  actionsSection: {
    marginTop: 16,
  },
});
