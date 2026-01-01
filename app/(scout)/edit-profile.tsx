import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AvatarUploader } from '@/components/avatar-uploader';
import { Card, PrimaryButton } from '@/components/ui';
import { TotemSelector, TOTEM_ANIMALS } from '@/components/totem-selector';
import { TotemImageGenerator } from '@/components/totem-image-generator';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Scout } from '@/types';
import { BrandColors } from '@/constants/theme';
import { Spacing } from '@/constants/design-tokens';

export default function EditProfileScreen() {
  const { user, updateUser, isLoading } = useAuth();
  const scout = user as Scout;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  // Forcer explicitement les couleurs selon le thème
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const inputBackground = isDark ? '#2A2A2A' : '#F5F5F5';
  const placeholderColor = isDark ? '#6B7280' : '#9CA3AF';

  const [formData, setFormData] = useState({
    firstName: scout?.firstName || '',
    lastName: scout?.lastName || '',
    bio: scout?.bio || '',
    phone: scout?.phone || '',
    totemName: scout?.totemName || '',
    totemAnimal: scout?.totemAnimal || '',
    totemEmoji: scout?.totemEmoji || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      await updateUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        bio: formData.bio.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        totemName: formData.totemName.trim() || undefined,
        totemAnimal: formData.totemAnimal.trim() || undefined,
        totemEmoji: formData.totemEmoji.trim() || undefined,
      });

      Alert.alert('Succès', 'Ton profil a été mis à jour !', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour ton profil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>
              Modifier mon profil
            </ThemedText>
            <View style={styles.placeholder} />
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <AvatarUploader
              currentAvatarUrl={scout?.profilePicture}
              userName={scout ? `${scout.firstName} ${scout.lastName}` : undefined}
              size="xlarge"
            />
            <ThemedText style={styles.avatarHint}>
              Appuie sur la photo pour la changer
            </ThemedText>
          </View>

          {/* Informations de base */}
          <Card style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Informations de base
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Prénom</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="Ton prénom"
                placeholderTextColor={placeholderColor}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nom</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="Ton nom"
                placeholderTextColor={placeholderColor}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Téléphone</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Ton numéro de téléphone"
                placeholderTextColor={placeholderColor}
                keyboardType="phone-pad"
              />
            </View>
          </Card>

          {/* Bio */}
          <Card style={styles.card}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              À propos de moi
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Bio</ThemedText>
              <TextInput
                style={[styles.textArea, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Écris quelque chose sur toi..."
                placeholderTextColor={placeholderColor}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
              <ThemedText style={styles.charCount}>
                {formData.bio.length}/300
              </ThemedText>
            </View>
          </Card>

          {/* Totem */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="paw" size={24} color={BrandColors.accent[500]} />
              <ThemedText type="subtitle" style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Mon totem
              </ThemedText>
            </View>

            <ThemedText style={[styles.totemHint, { marginBottom: Spacing.md }]}>
              Choisis ton animal totem ! Il représente tes qualités et ton esprit scout.
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Animal totem</ThemedText>
              <TotemSelector
                selectedAnimal={formData.totemAnimal}
                onSelectAnimal={(animal) => setFormData(prev => ({ ...prev, totemAnimal: animal }))}
                selectedEmoji={formData.totemEmoji}
                onSelectEmoji={(emoji) => setFormData(prev => ({ ...prev, totemEmoji: emoji }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nom de totem (surnom)</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBackground }]}
                value={formData.totemName}
                onChangeText={(text) => setFormData({ ...formData, totemName: text })}
                placeholder={formData.totemAnimal ? `Ex: ${formData.totemAnimal} Rusé` : 'Ex: Aigle Rusé'}
                placeholderTextColor={placeholderColor}
              />
              <ThemedText style={styles.totemHint}>
                Combine ton animal avec un adjectif qui te caractérise
              </ThemedText>
            </View>

            {/* Génération d'image par IA */}
            {scout?.id && (formData.totemAnimal || formData.totemEmoji) && (() => {
              // Trouver le nom de l'animal soit directement, soit via l'emoji
              let animalName = formData.totemAnimal;
              if (!animalName && formData.totemEmoji) {
                const foundAnimal = TOTEM_ANIMALS.find(a => a.emoji === formData.totemEmoji);
                if (foundAnimal) {
                  animalName = foundAnimal.name;
                }
              }

              if (!animalName) return null;

              return (
                <TotemImageGenerator
                  key={animalName}
                  animalName={animalName}
                  userId={scout.id}
                  currentTotemImage={scout?.profilePicture}
                  onImageGenerated={async (imageUrl) => {
                    // Mettre à jour la photo de profil avec l'image générée
                    await updateUser({ profilePicture: imageUrl });
                  }}
                />
              );
            })()}
          </Card>

          {/* Bouton Sauvegarder */}
          <PrimaryButton
            title={isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            onPress={handleSave}
            disabled={isSaving || !formData.firstName.trim() || !formData.lastName.trim()}
            style={styles.saveButton}
          />
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
    paddingBottom: 40,
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
  title: {
    fontSize: 20,
  },
  placeholder: {
    width: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.6,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  totemHint: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 8,
  },
  saveButton: {
    marginTop: 8,
  },
});
