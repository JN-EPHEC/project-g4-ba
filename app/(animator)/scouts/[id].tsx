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
import { HealthService } from '@/services/health-service';
import { Scout, HealthRecord, AllergySeverity } from '@/types';
import { BrandColors } from '@/constants/theme';

export default function ScoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scout, setScout] = useState<Scout | null>(null);
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadScout();
      loadHealthRecord();
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

  const loadHealthRecord = async () => {
    try {
      const record = await HealthService.getHealthRecord(id as string);
      setHealthRecord(record);
    } catch (error) {
      console.error('Erreur chargement fiche santé:', error);
    }
  };

  const getSeverityLabel = (severity: AllergySeverity) => {
    switch (severity) {
      case AllergySeverity.LIGHT: return 'Léger';
      case AllergySeverity.MODERATE: return 'Modéré';
      case AllergySeverity.SEVERE: return 'Sévère';
      default: return severity;
    }
  };

  const getSeverityColor = (severity: AllergySeverity) => {
    switch (severity) {
      case AllergySeverity.LIGHT: return '#d97706';
      case AllergySeverity.MODERATE: return '#ea580c';
      case AllergySeverity.SEVERE: return '#dc2626';
      default: return '#888';
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

        {/* Fiche Santé */}
        <Card style={styles.infoCard}>
          <View style={styles.healthHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>🏥 Fiche Santé</ThemedText>
            {healthRecord && HealthService.isHealthRecordComplete(healthRecord) ? (
              <View style={styles.healthBadgeComplete}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <ThemedText style={styles.healthBadgeTextComplete}>Complète</ThemedText>
              </View>
            ) : healthRecord && HealthService.hasBasicHealthInfo(healthRecord) ? (
              <View style={styles.healthBadgePending}>
                <Ionicons name="time" size={16} color="#f59e0b" />
                <ThemedText style={styles.healthBadgeTextPending}>En attente signature</ThemedText>
              </View>
            ) : (
              <View style={styles.healthBadgeMissing}>
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <ThemedText style={styles.healthBadgeTextMissing}>Manquante</ThemedText>
              </View>
            )}
          </View>

          {!healthRecord ? (
            <View style={styles.healthEmpty}>
              <Ionicons name="document-text-outline" size={48} color="#555" />
              <ThemedText style={styles.healthEmptyText}>
                Ce scout n'a pas encore rempli sa fiche santé
              </ThemedText>
            </View>
          ) : (
            <>
              {/* Groupe sanguin & Mutuelle */}
              {(healthRecord.bloodType || healthRecord.insuranceName) && (
                <View style={styles.healthSection}>
                  {healthRecord.bloodType && (
                    <View style={styles.healthInfoRow}>
                      <ThemedText style={styles.healthLabel}>Groupe sanguin</ThemedText>
                      <ThemedText style={styles.healthValue}>{healthRecord.bloodType}</ThemedText>
                    </View>
                  )}
                  {healthRecord.insuranceName && (
                    <View style={styles.healthInfoRow}>
                      <ThemedText style={styles.healthLabel}>Mutuelle</ThemedText>
                      <ThemedText style={styles.healthValue}>
                        {healthRecord.insuranceName}
                        {healthRecord.insuranceNumber && ` (${healthRecord.insuranceNumber})`}
                      </ThemedText>
                    </View>
                  )}
                </View>
              )}

              {/* Allergies */}
              {healthRecord.allergies && healthRecord.allergies.length > 0 && (
                <View style={styles.healthSection}>
                  <ThemedText style={styles.healthSectionTitle}>🚨 Allergies</ThemedText>
                  {healthRecord.allergies.map((allergy, index) => (
                    <View key={allergy.id || index} style={styles.healthItem}>
                      <View style={styles.healthItemHeader}>
                        <ThemedText style={styles.healthItemName}>{allergy.name}</ThemedText>
                        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(allergy.severity) + '20' }]}>
                          <ThemedText style={[styles.severityText, { color: getSeverityColor(allergy.severity) }]}>
                            {getSeverityLabel(allergy.severity)}
                          </ThemedText>
                        </View>
                        {allergy.requiresEpiPen && (
                          <View style={styles.epipenBadge}>
                            <ThemedText style={styles.epipenText}>💉 EpiPen</ThemedText>
                          </View>
                        )}
                      </View>
                      {allergy.description && (
                        <ThemedText style={styles.healthItemDesc}>{allergy.description}</ThemedText>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Médicaments */}
              {healthRecord.medications && healthRecord.medications.length > 0 && (
                <View style={styles.healthSection}>
                  <ThemedText style={styles.healthSectionTitle}>💊 Médicaments</ThemedText>
                  {healthRecord.medications.map((med, index) => (
                    <View key={med.id || index} style={styles.healthItem}>
                      <View style={styles.healthItemHeader}>
                        <ThemedText style={styles.healthItemName}>{med.name}</ThemedText>
                        {med.isVital && (
                          <View style={styles.vitalBadge}>
                            <ThemedText style={styles.vitalText}>VITAL</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={styles.healthItemDesc}>
                        {med.dosage} - {med.frequency}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {/* Contacts d'urgence */}
              {healthRecord.emergencyContacts && healthRecord.emergencyContacts.length > 0 && (
                <View style={styles.healthSection}>
                  <ThemedText style={styles.healthSectionTitle}>📞 Contacts d'urgence</ThemedText>
                  {healthRecord.emergencyContacts.map((contact, index) => (
                    <View key={contact.id || index} style={styles.healthItem}>
                      <View style={styles.healthItemHeader}>
                        <ThemedText style={styles.healthItemName}>{contact.name}</ThemedText>
                        {contact.isPrimary && (
                          <View style={styles.primaryBadge}>
                            <ThemedText style={styles.primaryText}>Principal</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={styles.healthItemDesc}>
                        {contact.relation} • {contact.phone}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {/* Notes */}
              {healthRecord.additionalNotes && (
                <View style={styles.healthSection}>
                  <ThemedText style={styles.healthSectionTitle}>📝 Notes</ThemedText>
                  <ThemedText style={styles.healthNotes}>{healthRecord.additionalNotes}</ThemedText>
                </View>
              )}

              {/* Signature */}
              {healthRecord.signedByParentName && (
                <View style={styles.signatureSection}>
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  <ThemedText style={styles.signatureText}>
                    Signé par {healthRecord.signedByParentName}
                    {healthRecord.signedAt && ` le ${formatDate(healthRecord.signedAt)}`}
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </Card>

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

  // ==================== FICHE SANTÉ ====================
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthBadgeComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22c55e20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeTextComplete: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  healthBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeTextPending: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  healthBadgeMissing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dc262620',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthBadgeTextMissing: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  healthEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  healthEmptyText: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  healthSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  healthSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  healthInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  healthLabel: {
    color: '#888',
    fontSize: 14,
  },
  healthValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  healthItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  healthItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  healthItemName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  healthItemDesc: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  epipenBadge: {
    backgroundColor: '#dc262620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  epipenText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '600',
  },
  vitalBadge: {
    backgroundColor: '#dc262620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vitalText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '700',
  },
  primaryBadge: {
    backgroundColor: BrandColors.primary[500] + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryText: {
    color: BrandColors.primary[500],
    fontSize: 11,
    fontWeight: '600',
  },
  healthNotes: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  signatureSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  signatureText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '500',
  },
});
