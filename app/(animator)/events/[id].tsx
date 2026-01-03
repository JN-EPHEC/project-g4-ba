import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Input, PrimaryButton, LocationInput } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { EventService } from '@/services/event-service';
import { StorageService } from '@/src/shared/services/storage-service';
import { EventType, Event } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';

// Convertir une Date en string YYYY-MM-DD
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: EventType.CAMP,
    location: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    requiresParentConfirmation: true,
    imageUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const iconColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Charger l'événement existant
  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        router.back();
        return;
      }

      try {
        setLoadingEvent(true);
        const eventData = await EventService.getEventById(id);

        if (!eventData) {
          Alert.alert('Erreur', 'Événement non trouvé');
          router.back();
          return;
        }

        // Note: La vérification des permissions est gérée par les règles Firestore
        // Tout animateur peut modifier tout événement (règles simplifiées temporaires)

        setEvent(eventData);
        setFormData({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          location: eventData.location,
          startDate: formatDateForInput(eventData.startDate),
          endDate: formatDateForInput(eventData.endDate),
          maxParticipants: eventData.maxParticipants?.toString() || '',
          requiresParentConfirmation: eventData.requiresParentConfirmation,
          imageUrl: eventData.imageUrl || '',
        });
      } catch (error) {
        console.error('Erreur chargement événement:', error);
        Alert.alert('Erreur', 'Impossible de charger l\'événement');
        router.back();
      } finally {
        setLoadingEvent(false);
      }
    };

    loadEvent();
  }, [id]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) return;

    try {
      setIsUploadingImage(true);
      const imageUrl = await StorageService.uploadEventImage(uri, user.id);
      setFormData({ ...formData, imageUrl });
    } catch (error) {
      console.error('Erreur upload image:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageUrl: '' });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Le lieu est requis';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est requise';
    } else {
      const start = new Date(formData.startDate);
      if (isNaN(start.getTime())) {
        newErrors.startDate = 'Format de date invalide';
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    } else {
      const end = new Date(formData.endDate);
      if (isNaN(end.getTime())) {
        newErrors.endDate = 'Format de date invalide';
      }
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        newErrors.endDate = 'La date de fin doit être après la date de début';
      }
    }

    if (formData.maxParticipants && parseInt(formData.maxParticipants) <= 0) {
      newErrors.maxParticipants = 'Le nombre doit être supérieur à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !id) return;

    try {
      setIsLoading(true);

      // Construire l'objet de mise à jour sans les valeurs undefined
      const updateData: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        location: formData.location,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        requiresParentConfirmation: formData.requiresParentConfirmation,
      };

      // Ajouter maxParticipants seulement si défini (sinon null pour supprimer)
      if (formData.maxParticipants) {
        updateData.maxParticipants = parseInt(formData.maxParticipants);
      } else {
        updateData.maxParticipants = null; // Utiliser null au lieu de undefined
      }

      // Ajouter imageUrl seulement si défini (sinon null)
      if (formData.imageUrl) {
        updateData.imageUrl = formData.imageUrl;
      } else {
        updateData.imageUrl = null;
      }

      console.log('📝 Mise à jour événement:', id);
      console.log('📝 Données:', updateData);

      await EventService.updateEvent(id, updateData);

      alert('Événement modifié avec succès !');
      router.replace('/(animator)/events');
    } catch (error: any) {
      console.error('❌ Erreur lors de la modification:', error);
      console.error('❌ Code erreur:', error?.code);
      console.error('❌ Message:', error?.message);
      alert(`Impossible de modifier l'événement: ${error?.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingEvent) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={styles.loadingText}>Chargement de l'événement...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>
              Modifier l'événement
            </ThemedText>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Titre de l'événement"
              placeholder="Ex: Camp d'été 2025"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              error={errors.title}
              icon={<Ionicons name="calendar-outline" size={20} color={iconColor} />}
            />

            <Input
              label="Description"
              placeholder="Décrivez l'événement..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              error={errors.description}
              multiline
              numberOfLines={4}
              style={styles.textArea}
              icon={<Ionicons name="document-text-outline" size={20} color={iconColor} />}
            />

            <ThemedText style={styles.label}>Type d'événement</ThemedText>
            <View style={styles.typeButtons}>
              {Object.values(EventType).map((type) => (
                <PrimaryButton
                  key={type}
                  title={
                    type === EventType.CAMP
                      ? 'Camp'
                      : type === EventType.MEETING
                      ? 'Réunion'
                      : type === EventType.ACTIVITY
                      ? 'Activité'
                      : type === EventType.TRAINING
                      ? 'Formation'
                      : 'Autre'
                  }
                  onPress={() => setFormData({ ...formData, type })}
                  style={[
                    styles.typeButton,
                    formData.type === type && styles.typeButtonActive,
                  ]}
                />
              ))}
            </View>

            <LocationInput
              label="Lieu *"
              placeholder="Rechercher une adresse..."
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              error={errors.location}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <ThemedText style={styles.label}>Date de début</ThemedText>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: errors.startDate ? '2px solid #ef4444' : '1px solid #d1d5db',
                    fontSize: 16,
                    width: '100%',
                    backgroundColor: '#fff',
                    color: '#000',
                  }}
                />
                {errors.startDate && (
                  <ThemedText style={styles.errorText}>{errors.startDate}</ThemedText>
                )}
              </View>

              <View style={styles.halfWidth}>
                <ThemedText style={styles.label}>Date de fin</ThemedText>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: errors.endDate ? '2px solid #ef4444' : '1px solid #d1d5db',
                    fontSize: 16,
                    width: '100%',
                    backgroundColor: '#fff',
                    color: '#000',
                  }}
                />
                {errors.endDate && (
                  <ThemedText style={styles.errorText}>{errors.endDate}</ThemedText>
                )}
              </View>
            </View>

            <Input
              label="Nombre maximum de participants (optionnel)"
              placeholder="Ex: 30"
              value={formData.maxParticipants}
              onChangeText={(text) => setFormData({ ...formData, maxParticipants: text })}
              error={errors.maxParticipants}
              keyboardType="numeric"
              icon={<Ionicons name="people-outline" size={20} color={iconColor} />}
            />

            {/* Image de fond */}
            <View style={styles.imageSection}>
              <ThemedText style={styles.imageLabel}>Image de fond (optionnel)</ThemedText>
              {formData.imageUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: formData.imageUrl }}
                    style={styles.imagePreview}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  >
                    <Ionicons name="close-circle" size={28} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.imagePicker, { backgroundColor: cardColor, borderColor: NeutralColors.gray[300] }]}
                  onPress={pickImage}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator size="large" color={BrandColors.primary[500]} />
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={40} color={textSecondary} />
                      <ThemedText style={[styles.imagePickerText, { color: textSecondary }]}>
                        Appuyer pour ajouter une photo
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.checkboxRow}>
              <PrimaryButton
                title={
                  formData.requiresParentConfirmation
                    ? '✓ Confirmation parentale requise'
                    : 'Confirmation parentale requise'
                }
                onPress={() =>
                  setFormData({
                    ...formData,
                    requiresParentConfirmation: !formData.requiresParentConfirmation,
                  })
                }
                style={[
                  styles.checkboxButton,
                  formData.requiresParentConfirmation && styles.checkboxButtonActive,
                ]}
              />
            </View>
          </Card>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.submitButtonText}>
              {isLoading ? 'Modification...' : 'Enregistrer les modifications'}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
  },
  formCard: {
    padding: 20,
    marginBottom: 20,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 8,
  },
  typeButtonActive: {
    opacity: 1,
  },
  checkboxRow: {
    marginTop: 8,
  },
  checkboxButton: {
    paddingVertical: 12,
  },
  checkboxButtonActive: {
    opacity: 1,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: BrandColors.primary[500],
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
  submitButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  imagePicker: {
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 14,
  },
});
