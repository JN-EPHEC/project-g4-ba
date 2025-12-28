import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { DocumentService } from '@/services/document-service';
import { Animator, DocumentType } from '@/types';

const DOCUMENT_TYPES = [
  { value: DocumentType.AUTHORIZATION, label: 'Autorisation', icon: 'shield-checkmark', color: '#f59e0b' },
  { value: DocumentType.MEDICAL, label: 'Médical', icon: 'medkit', color: '#ef4444' },
  { value: DocumentType.GENERAL, label: 'Général', icon: 'document-text', color: BrandColors.primary[500] },
  { value: DocumentType.PAYMENT, label: 'Paiement', icon: 'card', color: '#8b5cf6' },
];

export default function CreateAuthorizationScreen() {
  const { user } = useAuth();
  const animator = user as Animator;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DocumentType>(DocumentType.AUTHORIZATION);
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // +30 jours
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showAlert('Erreur', 'Veuillez entrer un titre pour le document');
      return;
    }

    if (!animator?.unitId) {
      showAlert('Erreur', 'Vous devez être assigné à une unité');
      return;
    }

    try {
      setIsCreating(true);

      await DocumentService.createDocument(
        title.trim(),
        description.trim(),
        type,
        '', // fileUrl - pas de fichier pour l'instant
        animator.id,
        animator.unitId,
        undefined, // scoutId - document pour toute l'unité
        requiresSignature,
        hasExpiry ? expiryDate : undefined
      );

      showAlert('Succès', 'Le document a été créé avec succès');
      router.back();
    } catch (error) {
      console.error('Erreur lors de la création du document:', error);
      showAlert('Erreur', 'Impossible de créer le document');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
            Nouvelle autorisation
          </ThemedText>
        </View>

        {/* Titre */}
        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: textColor }]}>Titre *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: cardColor, borderColor: cardBorder, color: textColor }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Autorisation de sortie"
            placeholderTextColor={textSecondary}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: textColor }]}>Description</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: cardColor, borderColor: cardBorder, color: textColor }
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez le document..."
            placeholderTextColor={textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Type de document */}
        <View style={styles.field}>
          <ThemedText style={[styles.label, { color: textColor }]}>Type de document</ThemedText>
          <View style={styles.typeGrid}>
            {DOCUMENT_TYPES.map((docType) => (
              <TouchableOpacity
                key={docType.value}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: type === docType.value ? `${docType.color}15` : cardColor,
                    borderColor: type === docType.value ? docType.color : cardBorder,
                  }
                ]}
                onPress={() => setType(docType.value)}
              >
                <Ionicons
                  name={docType.icon as any}
                  size={24}
                  color={type === docType.value ? docType.color : textSecondary}
                />
                <ThemedText
                  style={[
                    styles.typeLabel,
                    { color: type === docType.value ? docType.color : textSecondary }
                  ]}
                >
                  {docType.label}
                </ThemedText>
                {type === docType.value && (
                  <View style={[styles.typeCheck, { backgroundColor: docType.color }]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Options */}
        <Card style={[styles.optionsCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Ionicons name="create" size={20} color={BrandColors.primary[500]} />
              <View style={styles.optionText}>
                <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                  Nécessite une signature
                </ThemedText>
                <ThemedText style={[styles.optionDescription, { color: textSecondary }]}>
                  Les parents devront signer ce document
                </ThemedText>
              </View>
            </View>
            <Switch
              value={requiresSignature}
              onValueChange={setRequiresSignature}
              trackColor={{ false: cardBorder, true: BrandColors.primary[300] }}
              thumbColor={requiresSignature ? BrandColors.primary[500] : '#f4f3f4'}
            />
          </View>

          <View style={[styles.optionDivider, { backgroundColor: cardBorder }]} />

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Ionicons name="calendar" size={20} color={BrandColors.primary[500]} />
              <View style={styles.optionText}>
                <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                  Date d'expiration
                </ThemedText>
                <ThemedText style={[styles.optionDescription, { color: textSecondary }]}>
                  Le document expire après cette date
                </ThemedText>
              </View>
            </View>
            <Switch
              value={hasExpiry}
              onValueChange={setHasExpiry}
              trackColor={{ false: cardBorder, true: BrandColors.primary[300] }}
              thumbColor={hasExpiry ? BrandColors.primary[500] : '#f4f3f4'}
            />
          </View>

          {hasExpiry && (
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor, borderColor: cardBorder }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={textSecondary} />
              <ThemedText style={{ color: textColor }}>
                {expiryDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>
            </TouchableOpacity>
          )}
        </Card>

        {showDatePicker && (
          <DateTimePicker
            value={expiryDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Bouton créer */}
        <PrimaryButton
          title={isCreating ? 'Création...' : 'Créer le document'}
          onPress={handleCreate}
          disabled={isCreating || !title.trim()}
          style={styles.createButton}
        />

        {isCreating && (
          <ActivityIndicator
            size="small"
            color={BrandColors.primary[500]}
            style={styles.loadingIndicator}
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
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  typeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsCard: {
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionText: {
    flex: 1,
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  optionDivider: {
    height: 1,
    marginVertical: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  createButton: {
    marginTop: 8,
  },
  loadingIndicator: {
    marginTop: 16,
  },
});
