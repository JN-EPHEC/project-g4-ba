import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, Input, PrimaryButton, LocationInput } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { EventService } from '@/services/event-service';
import { StorageService } from '@/src/shared/services/storage-service';
import { EventType, Animator } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';

// Helper pour formater la date
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return 'Sélectionner une date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function CreateEventScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
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
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const iconColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

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

  const pickImage = async () => {
    try {
      // Demander la permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos');
        return;
      }

      // Ouvrir le sélecteur d'images
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
        newErrors.startDate = 'Format de date invalide (utilisez YYYY-MM-DD)';
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    } else {
      const end = new Date(formData.endDate);
      if (isNaN(end.getTime())) {
        newErrors.endDate = 'Format de date invalide (utilisez YYYY-MM-DD)';
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
    console.log('🔵 handleSubmit appelé');
    console.log('📝 FormData:', formData);
    console.log('👤 User complet:', user);
    console.log('👤 User.id:', user?.id);
    console.log('👤 Animator complet:', animator);
    console.log('🏢 UnitId:', animator?.unitId);

    if (!validateForm()) {
      console.log('❌ Validation échouée');
      return;
    }

    if (!user?.id) {
      console.log('❌ User manquant');
      alert('❌ Erreur\n\nUtilisateur non connecté');
      return;
    }

    // Vérifier si l'animateur a un unitId, sinon utiliser une valeur par défaut
    const unitId = animator?.unitId || 'default-unit';

    if (!animator?.unitId) {
      console.warn('⚠️ Pas de unitId pour cet animateur, utilisation de "default-unit"');
    }

    try {
      setIsLoading(true);
      console.log('⏳ Création de l\'événement en cours...');
      console.log('📤 Paramètres envoyés:', {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        location: formData.location,
        createdBy: user.id,
        unitId: unitId,
        requiresParentConfirmation: formData.requiresParentConfirmation,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        imageUrl: formData.imageUrl || undefined
      });

      await EventService.createEvent(
        formData.title,
        formData.description,
        formData.type,
        new Date(formData.startDate),
        new Date(formData.endDate),
        formData.location,
        user.id,
        unitId,
        formData.requiresParentConfirmation,
        formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        formData.imageUrl || undefined
      );

      console.log('✅ Événement créé avec succès');

      // Utiliser alert() au lieu de Alert.alert() pour le web
      alert('✅ Succès!\n\nL\'événement a été créé avec succès.');
      router.back();
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'événement:', error);
      alert(`❌ Erreur\n\nImpossible de créer l\'événement:\n${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
          <ThemedText type="title" style={styles.title}>
            Créer un événement
          </ThemedText>

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
              {isLoading ? 'Création...' : 'Créer l\'événement'}
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    marginBottom: 24,
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
    backgroundColor: '#E07B4C',
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
  // Styles pour le sélecteur d'image
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
  // Styles pour les sélecteurs de date
  dateSection: {
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
