import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui';
import { Scout, BloodType } from '@/types';
import { BrandColors } from '@/constants/theme';

interface HealthHeaderCardProps {
  scout: Scout;
  bloodType?: BloodType;
  insuranceName?: string;
  insuranceNumber?: string;
}

export function HealthHeaderCard({
  scout,
  bloodType,
  insuranceName,
  insuranceNumber,
}: HealthHeaderCardProps) {
  const calculateAge = (dateOfBirth: Date): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(scout.dateOfBirth);
  const totemDisplay = scout.totemName
    ? `${scout.totemAnimal || ''} ${scout.totemName}`.trim()
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.profileRow}>
        <View style={styles.avatarContainer}>
          {scout.totemEmoji ? (
            <View style={styles.emojiAvatar}>
              <ThemedText style={styles.emojiText}>{scout.totemEmoji}</ThemedText>
            </View>
          ) : (
            <Avatar
              name={`${scout.firstName} ${scout.lastName}`}
              imageUrl={scout.profilePicture}
              size="large"
            />
          )}
        </View>
        <View style={styles.profileInfo}>
          <ThemedText style={styles.name}>
            {scout.firstName} {scout.lastName}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {totemDisplay ? `${totemDisplay} · ` : ''}{age} ans
          </ThemedText>
        </View>
      </View>

      <View style={styles.infoRow}>
        {bloodType && (
          <View style={styles.infoCard}>
            <ThemedText style={styles.infoValue}>{bloodType}</ThemedText>
            <ThemedText style={styles.infoLabel}>Groupe sanguin</ThemedText>
          </View>
        )}
        {insuranceName && (
          <View style={[styles.infoCard, styles.infoCardLarge]}>
            <ThemedText style={styles.infoValue}>{insuranceName}</ThemedText>
            <ThemedText style={styles.infoLabel}>
              {insuranceNumber ? `N° ${insuranceNumber}` : 'Mutuelle'}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BrandColors.primary[600],
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  emojiAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 36,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    minWidth: 100,
  },
  infoCardLarge: {
    flex: 1,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
