import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { EmergencyContact } from '@/types';

interface EmergencyCallButtonProps {
  contact: EmergencyContact | null;
  onPress?: () => void;
}

export function EmergencyCallButton({ contact, onPress }: EmergencyCallButtonProps) {
  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!contact) {
      if (Platform.OS === 'web') {
        window.alert('Aucun contact d\'urgence principal défini');
      } else {
        Alert.alert(
          'Aucun contact',
          'Aucun contact d\'urgence principal n\'a été défini.'
        );
      }
      return;
    }

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
          Alert.alert(
            'Appel impossible',
            `Impossible d'ouvrir l'application téléphone.\n\nNuméro: ${contact.phone}`
          );
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'appel:', error);
      if (Platform.OS === 'web') {
        window.alert(`Numéro: ${contact.phone}`);
      } else {
        Alert.alert('Erreur', `Impossible de passer l'appel.\n\nNuméro: ${contact.phone}`);
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Ionicons name="call" size={22} color="#FFFFFF" />
      <ThemedText style={styles.buttonText}>Appel d'urgence</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    marginBottom: 24,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
