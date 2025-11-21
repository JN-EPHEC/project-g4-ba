import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton } from '@/components/ui';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapPickerProps {
  initialLocation?: Location;
  onLocationSelect: (location: Location) => void;
  onCancel?: () => void;
  height?: number;
}

export function MapPicker({
  initialLocation,
  onLocationSelect,
  onCancel,
  height = 400,
}: MapPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    initialLocation || null
  );
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.latitude || 50.8503, // Bruxelles par défaut
    longitude: initialLocation?.longitude || 4.3517,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const tintColor = useThemeColor({}, 'tint');

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    } else {
      Alert.alert('Erreur', 'Veuillez sélectionner un emplacement sur la carte');
    }
  };

  const handleCurrentLocation = () => {
    // Pour le web, on ne peut pas utiliser la géolocalisation directement
    // Il faudrait utiliser une API de géolocalisation
    Alert.alert(
      'Géolocalisation',
      'La géolocalisation automatique n\'est pas disponible sur cette plateforme. Veuillez sélectionner manuellement un emplacement sur la carte.'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Sélectionner un emplacement</ThemedText>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color={tintColor} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.mapContainer, { height }]}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title="Emplacement sélectionné"
            />
          )}
        </MapView>

        <View style={styles.mapOverlay}>
          <View style={styles.markerContainer}>
            <Ionicons name="location" size={32} color={tintColor} />
          </View>
        </View>
      </View>

      {selectedLocation && (
        <View style={styles.locationInfo}>
          <ThemedText style={styles.locationText}>
            Latitude: {selectedLocation.latitude.toFixed(6)}
          </ThemedText>
          <ThemedText style={styles.locationText}>
            Longitude: {selectedLocation.longitude.toFixed(6)}
          </ThemedText>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleCurrentLocation}
          style={[styles.actionButton, { backgroundColor: tintColor + '20' }]}
        >
          <Ionicons name="locate" size={20} color={tintColor} />
          <ThemedText style={[styles.actionText, { color: tintColor }]}>
            Ma position
          </ThemedText>
        </TouchableOpacity>
        <PrimaryButton
          title="Confirmer"
          onPress={handleConfirm}
          style={styles.confirmButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButton: {
    padding: 4,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  markerContainer: {
    marginTop: -32, // Ajuster pour centrer le marqueur
  },
  locationInfo: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
  },
});

