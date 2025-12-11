import React from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';
import { useHealthRecord } from '@/src/features/health/hooks/use-health-record';
import {
  HealthHeaderCard,
  EmergencyCallButton,
  AllergyCard,
  MedicationCard,
  EmergencyContactCard,
  HealthInfoFooter,
} from '@/src/features/health/components';
import { HealthService } from '@/services/health-service';
import { Scout } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

export default function HealthScreen() {
  const { user } = useAuth();
  const scout = user as Scout;
  const { healthRecord, loading, error } = useHealthRecord(scout?.id, scout?.id);
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const primaryContact = healthRecord
    ? HealthService.getPrimaryEmergencyContact(healthRecord)
    : null;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText color="secondary" style={styles.loadingText}>
            Chargement de la fiche santé...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
          <ThemedText color="error" style={styles.errorText}>
            {error}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={tintColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Fiche Santé
        </ThemedText>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/(scout)/health/edit')}
        >
          <ThemedText style={[styles.editButtonText, { color: tintColor }]}>
            Modifier
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card with profile info */}
        <HealthHeaderCard
          scout={scout}
          bloodType={healthRecord?.bloodType}
          insuranceName={healthRecord?.insuranceName}
          insuranceNumber={healthRecord?.insuranceNumber}
        />

        {/* Emergency Call Button */}
        <EmergencyCallButton contact={primaryContact} />

        {/* Allergies Section */}
        {healthRecord && healthRecord.allergies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionIcon}>🚨</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Allergies
              </ThemedText>
            </View>
            {healthRecord.allergies.map((allergy) => (
              <AllergyCard key={allergy.id} allergy={allergy} />
            ))}
          </View>
        )}

        {/* Medications Section */}
        {healthRecord && healthRecord.medications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionIcon}>💊</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Médicaments
              </ThemedText>
            </View>
            {healthRecord.medications.map((medication) => (
              <MedicationCard key={medication.id} medication={medication} />
            ))}
          </View>
        )}

        {/* Emergency Contacts Section */}
        {healthRecord && healthRecord.emergencyContacts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionIcon}>📞</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Contacts d'urgence
              </ThemedText>
            </View>
            {healthRecord.emergencyContacts.map((contact) => (
              <EmergencyContactCard key={contact.id} contact={contact} />
            ))}
          </View>
        )}

        {/* Empty State */}
        {!healthRecord && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>📋</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              Fiche santé non remplie
            </ThemedText>
            <ThemedText color="secondary" style={styles.emptyText}>
              Complétez votre fiche santé pour aider les animateurs en cas d'urgence.
            </ThemedText>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/(scout)/health/edit')}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <ThemedText style={styles.createButtonText}>
                Remplir ma fiche
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer with metadata */}
        {healthRecord && (
          <HealthInfoFooter
            lastUpdatedAt={healthRecord.lastUpdatedAt}
            signedByParentName={healthRecord.signedByParentName}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary[500],
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
