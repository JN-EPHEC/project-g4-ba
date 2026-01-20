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
import DateTimePicker from '@react-native-community/datetimepicker';

// Convertir une Date en string YYYY-MM-DD
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formater la date pour l'affichage
const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return 'Sélectionner une date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function EditEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
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

  // Date picker states
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const iconColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Charger l'événement existant
  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) {
        router.back();
        return;
      }

      try {
        setLoadingEvent(true);
        const eventData = await EventService.getEventById(eventId);

        if (!eventData) {
          if (Platform.OS === 'web') {
            window.alert('Erreur: Événement non trouvé');
          } else {
            Alert.alert('Erreur', 'Événement non trouvé');
          }
          router.back();
          return;
        }

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
        if (Platform.OS === 'web') {
          window.alert('Erreur: Impossible de charger l\'événement');
        } else {
          Alert.alert('Erreur', 'Impossible de charger l\'événement');
        }
        router.back();
      } finally {
        setLoadingEvent(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Permission requise: Nous avons besoin de la permission pour accéder à vos photos');
        } else {
          Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos');
        }
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
      if (Platform.OS === 'web') {
        window.alert('Erreur: Impossible de sélectionner l\'image');
      } else {
        Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
      }
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) return;

    try {
      setIsUploadingImage(true);
      const imageUrl = await StorageService.uploadEventImage(uri, user.id);
      setFormData({ ...formData, imageUrl });
      // Confirmation de l'upload
      if (Platform.OS === 'web') {
        window.alert('Image uploadée avec succès !');
      } else {
        Alert.alert('Succès', 'Image uploadée avec succès !');
      }
    } catch (error) {
      console.error('Erreur upload image:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur: Impossible d\'uploader l\'image');
      } else {
        Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
      }
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
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
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
    if (!validateForm() || !eventId) return;

    try {
      setIsLoading(true);

      const updateData: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        location: formData.location,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        requiresParentConfirmation: formData.requiresParentConfirmation,
      };

      if (formData.maxParticipants) {
        updateData.maxParticipants = parseInt(formData.maxParticipants);
      } else {
        updateData.maxParticipants = null;
      }

      if (formData.imageUrl) {
        updateData.imageUrl = formData.imageUrl;
      } else {
        updateData.imageUrl = null;
      }

      await EventService.updateEvent(eventId, updateData);

      if (Platform.OS === 'web') {
        window.alert('Événement modifié avec succès !');
        router.back();
      } else {
        Alert.alert('Succès', 'Événement modifié avec succès !', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      if (Platform.OS === 'web') {
        window.alert(`Erreur: Impossible de modifier l'événement: ${error?.message || error}`);
      } else {
        Alert.alert('Erreur', `Impossible de modifier l'événement: ${error?.message || error}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setFormData({ ...formData, startDate: formatDateForInput(selectedDate) });
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setFormData({ ...formData, endDate: formatDateForInput(selectedDate) });
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
                <TouchableOpacity
                  key={type}
                  onPress={() => setFormData({ ...formData, type })}
                  style={[
                    styles.typeButton,
                    { backgroundColor: formData.type === type ? BrandColors.primary[500] : cardColor, borderColor: BrandColors.primary[500] },
                  ]}
                >
                  <ThemedText style={[styles.typeButtonText, { color: formData.type === type ? '#FFFFFF' : textColor }]}>
                    {type === EventType.CAMP ? 'Camp'
                      : type === EventType.MEETING ? 'Réunion'
                      : type === EventType.ACTIVITY ? 'Activité'
                      : type === EventType.TRAINING ? 'Formation'
                      : 'Autre'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <LocationInput
              label="Lieu *"
              placeholder="Rechercher une adresse..."
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              error={errors.location}
            />

            {/* Date de début */}
            <View style={styles.dateSection}>
              <ThemedText style={styles.label}>Date de début *</ThemedText>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: cardColor, borderColor: errors.startDate ? '#ef4444' : NeutralColors.gray[300] }]}
                onPress={() => setShowStartPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={iconColor} />
                <ThemedText style={{ color: formData.startDate ? textColor : textSecondary }}>
                  {formatDateDisplay(formData.startDate)}
                </ThemedText>
              </TouchableOpacity>
              {errors.startDate && (
                <ThemedText style={styles.errorText}>{errors.startDate}</ThemedText>
              )}
            </View>

            {/* Date de fin */}
            <View style={styles.dateSection}>
              <ThemedText style={styles.label}>Date de fin *</ThemedText>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: cardColor, borderColor: errors.endDate ? '#ef4444' : NeutralColors.gray[300] }]}
                onPress={() => setShowEndPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={iconColor} />
                <ThemedText style={{ color: formData.endDate ? textColor : textSecondary }}>
                  {formatDateDisplay(formData.endDate)}
                </ThemedText>
              </TouchableOpacity>
              {errors.endDate && (
                <ThemedText style={styles.errorText}>{errors.endDate}</ThemedText>
              )}
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={formData.startDate ? new Date(formData.startDate) : new Date()}
                mode="date"
                display="default"
                onChange={onStartDateChange}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={formData.endDate ? new Date(formData.endDate) : new Date()}
                mode="date"
                display="default"
                onChange={onEndDateChange}
              />
            )}

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

            <TouchableOpacity
              style={[
                styles.checkboxButton,
                { backgroundColor: formData.requiresParentConfirmation ? BrandColors.primary[500] : cardColor, borderColor: BrandColors.primary[500] }
              ]}
              onPress={() => setFormData({ ...formData, requiresParentConfirmation: !formData.requiresParentConfirmation })}
            >
              <Ionicons
                name={formData.requiresParentConfirmation ? 'checkbox' : 'square-outline'}
                size={24}
                color={formData.requiresParentConfirmation ? '#FFFFFF' : BrandColors.primary[500]}
              />
              <ThemedText style={[styles.checkboxText, { color: formData.requiresParentConfirmation ? '#FFFFFF' : textColor }]}>
                Confirmation parentale requise
              </ThemedText>
            </TouchableOpacity>
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateSection: {
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkboxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  checkboxText: {
    fontSize: 15,
    fontWeight: '500',
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
