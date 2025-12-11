import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { EmergencyContact } from '@/types';
import { BrandColors } from '@/constants/theme';

interface EmergencyContactCardProps {
  contact: EmergencyContact;
}

export function EmergencyContactCard({ contact }: EmergencyContactCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const handleCall = async () => {
    const phoneNumber = contact.phone.replace(/\s/g, '');
    const url = `tel:${phoneNumber}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        if (Platform.OS === 'web') {
          window.alert(`Numéro: ${contact.phone}`);
        } else {
          Alert.alert('Appel impossible', `Numéro: ${contact.phone}`);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'appel:', error);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: cardColor, borderColor: contact.isPrimary ? BrandColors.primary[500] : cardBorderColor },
        contact.isPrimary && styles.primaryContainer,
      ]}
    >
      <View style={styles.avatarContainer}>
        {contact.avatarEmoji ? (
          <View style={[styles.avatar, { backgroundColor: '#f3f4f6' }]}>
            <ThemedText style={styles.avatarEmoji}>{contact.avatarEmoji}</ThemedText>
          </View>
        ) : (
          <View style={[styles.avatar, { backgroundColor: BrandColors.primary[100] }]}>
            <ThemedText style={styles.avatarInitial}>
              {contact.name.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {contact.name}
          </ThemedText>
          {contact.isPrimary && (
            <View style={styles.primaryBadge}>
              <ThemedText style={styles.primaryBadgeText}>Principal</ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={[styles.relation, { color: textSecondary }]}>
          {contact.relation}
        </ThemedText>
        <ThemedText style={styles.phone}>{contact.phone}</ThemedText>
      </View>

      <TouchableOpacity
        style={styles.callButton}
        onPress={handleCall}
        activeOpacity={0.7}
      >
        <Ionicons name="call" size={22} color={BrandColors.primary[600]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  primaryContainer: {
    borderWidth: 2,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '600',
    color: BrandColors.primary[600],
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
  },
  primaryBadge: {
    backgroundColor: BrandColors.primary[600],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  relation: {
    fontSize: 14,
    marginBottom: 2,
  },
  phone: {
    fontSize: 15,
    fontWeight: '500',
    color: BrandColors.primary[600],
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandColors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
