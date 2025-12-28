import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';
import { UserService } from '@/services/user-service';
import { HealthService } from '@/services/health-service';
import { Parent, Scout, BloodType, Allergy, Medication, EmergencyContact } from '@/types';

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function HealthRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const parent = user as Parent;

  const [scout, setScout] = useState<Scout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [bloodType, setBloodType] = useState<BloodType | undefined>();
  const [insuranceName, setInsuranceName] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSigned, setIsSigned] = useState(false);

  // New item inputs
  const [newAllergyName, setNewAllergyName] = useState('');
  const [newMedicationName, setNewMedicationName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
  };

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      const scoutData = await UserService.getUserById(id);
      if (scoutData && scoutData.role === 'scout') {
        setScout(scoutData as Scout);

        const healthRecord = await HealthService.getHealthRecord(id);
        if (healthRecord) {
          setBloodType(healthRecord.bloodType);
          setInsuranceName(healthRecord.insuranceName || '');
          setInsuranceNumber(healthRecord.insuranceNumber || '');
          setAllergies(healthRecord.allergies || []);
          setMedications(healthRecord.medications || []);
          setEmergencyContacts(healthRecord.emergencyContacts || []);
          setAdditionalNotes(healthRecord.additionalNotes || '');
          setIsSigned(!!healthRecord.signedByParentId);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    load();
  }, [loadData]);

  const addAllergy = () => {
    if (!newAllergyName.trim()) return;
    setAllergies([...allergies, { name: newAllergyName.trim(), severity: 'moderate' }]);
    setNewAllergyName('');
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    if (!newMedicationName.trim()) return;
    setMedications([...medications, { name: newMedicationName.trim(), dosage: '', frequency: '' }]);
    setNewMedicationName('');
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const addEmergencyContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    setEmergencyContacts([
      ...emergencyContacts,
      {
        name: newContactName.trim(),
        phone: newContactPhone.trim(),
        relationship: newContactRelation.trim() || 'Contact',
        isPrimary: emergencyContacts.length === 0,
      },
    ]);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactRelation('');
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const handleSave = async (sign: boolean = false) => {
    if (!id || !parent) return;

    // Validation
    if (emergencyContacts.length === 0) {
      showAlert('Erreur', 'Veuillez ajouter au moins un contact d\'urgence.');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        bloodType,
        insuranceName: insuranceName.trim() || undefined,
        insuranceNumber: insuranceNumber.trim() || undefined,
        allergies,
        medications,
        emergencyContacts,
        additionalNotes: additionalNotes.trim() || undefined,
      };

      await HealthService.upsertHealthRecord(id, data, parent.id);

      if (sign) {
        await HealthService.signHealthRecord(
          id,
          parent.id,
          `${parent.firstName} ${parent.lastName}`
        );
        setIsSigned(true);
      }

      showAlert(
        'Succès',
        sign
          ? 'La fiche santé a été enregistrée et signée.'
          : 'La fiche santé a été enregistrée.',
        () => router.back()
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showAlert('Erreur', 'Impossible de sauvegarder la fiche santé.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!scout) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Scout introuvable</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(300)}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <ThemedText type="title" style={[styles.headerTitle, { color: BrandColors.primary[600] }]}>
              Fiche Santé
            </ThemedText>
            <View style={{ width: 40 }} />
          </View>
          <ThemedText style={[styles.subheader, { color: textSecondary }]}>
            {scout.firstName} {scout.lastName}
          </ThemedText>
        </Animated.View>

        {/* Blood Type */}
        <Animated.View entering={FadeInDown.duration(300).delay(50)}>
          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            GROUPE SANGUIN
          </ThemedText>
          <View style={styles.bloodTypeGrid}>
            {BLOOD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.bloodTypeButton,
                  {
                    backgroundColor: bloodType === type ? BrandColors.primary[500] : cardColor,
                    borderColor: bloodType === type ? BrandColors.primary[500] : cardBorder,
                  },
                ]}
                onPress={() => setBloodType(type)}
              >
                <ThemedText
                  style={[
                    styles.bloodTypeText,
                    { color: bloodType === type ? '#FFFFFF' : textColor },
                  ]}
                >
                  {type}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Insurance */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            ASSURANCE
          </ThemedText>
          <Card style={[styles.formCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: textSecondary }]}>
                Nom de l'assurance
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor, borderColor: cardBorder, color: textColor }]}
                value={insuranceName}
                onChangeText={setInsuranceName}
                placeholder="Ex: Mutualité Chrétienne"
                placeholderTextColor={textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: textSecondary }]}>
                Numéro d'affilié
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor, borderColor: cardBorder, color: textColor }]}
                value={insuranceNumber}
                onChangeText={setInsuranceNumber}
                placeholder="Ex: 123456789"
                placeholderTextColor={textSecondary}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Allergies */}
        <Animated.View entering={FadeInDown.duration(300).delay(150)}>
          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            ALLERGIES
          </ThemedText>
          <Card style={[styles.formCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            {allergies.map((allergy, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <ThemedText style={[styles.listItemText, { color: textColor }]}>
                  {allergy.name}
                </ThemedText>
                <TouchableOpacity onPress={() => removeAllergy(index)}>
                  <Ionicons name="close-circle" size={22} color={textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.addInput, { backgroundColor, borderColor: cardBorder, color: textColor }]}
                value={newAllergyName}
                onChangeText={setNewAllergyName}
                placeholder="Ajouter une allergie..."
                placeholderTextColor={textSecondary}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: BrandColors.primary[500] }]}
                onPress={addAllergy}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        {/* Medications */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            MÉDICAMENTS
          </ThemedText>
          <Card style={[styles.formCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            {medications.map((medication, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="medical" size={20} color={BrandColors.primary[500]} />
                <ThemedText style={[styles.listItemText, { color: textColor }]}>
                  {medication.name}
                </ThemedText>
                <TouchableOpacity onPress={() => removeMedication(index)}>
                  <Ionicons name="close-circle" size={22} color={textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addItemRow}>
              <TextInput
                style={[styles.addInput, { backgroundColor, borderColor: cardBorder, color: textColor }]}
                value={newMedicationName}
                onChangeText={setNewMedicationName}
                placeholder="Ajouter un médicament..."
                placeholderTextColor={textSecondary}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: BrandColors.primary[500] }]}
                onPress={addMedication}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        {/* Emergency Contacts */}
        <Animated.View entering={FadeInDown.duration(300).delay(250)}>
          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            CONTACTS D'URGENCE *
          </ThemedText>
          <Card style={[styles.formCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            {emergencyContacts.map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <View style={styles.contactInfo}>
                  <ThemedText style={[styles.contactName, { color: textColor }]}>
                    {contact.name}
                    {contact.isPrimary && (
                      <ThemedText style={{ color: BrandColors.primary[500] }}> (Principal)</ThemedText>
                    )}
                  </ThemedText>
                  <ThemedText style={[styles.contactDetails, { color: textSecondary }]}>
                    {contact.relationship} • {contact.phone}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => removeEmergencyContact(index)}>
                  <Ionicons name="close-circle" size={22} color={textSecondary} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={[styles.addContactForm, { borderTopColor: cardBorder }]}>
              <TextInput
                style={[styles.input, { backgroundColor, borderColor: cardBorder, color: textColor }]}
                value={newContactName}
                onChangeText={setNewContactName}
                placeholder="Nom du contact"
                placeholderTextColor={textSecondary}
              />
              <TextInput
                style={[styles.input, { backgroundColor, borderColor: cardBorder, color: textColor }]}
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                placeholder="Téléphone"
                placeholderTextColor={textSecondary}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, { backgroundColor, borderColor: cardBorder, color: textColor }]}
                value={newContactRelation}
                onChangeText={setNewContactRelation}
                placeholder="Relation (ex: Mère, Père, Oncle)"
                placeholderTextColor={textSecondary}
              />
              <TouchableOpacity
                style={[styles.addContactButton, { backgroundColor: BrandColors.primary[500] }]}
                onPress={addEmergencyContact}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <ThemedText style={styles.addContactButtonText}>Ajouter le contact</ThemedText>
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        {/* Additional Notes */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)}>
          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            NOTES ADDITIONNELLES
          </ThemedText>
          <Card style={[styles.formCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor, borderColor: cardBorder, color: textColor },
              ]}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Informations supplémentaires (ex: conditions médicales particulières, besoins spéciaux...)"
              placeholderTextColor={textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.duration(300).delay(350)}>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: cardColor, borderColor: cardBorder }]}
              onPress={() => handleSave(false)}
              disabled={isSaving}
            >
              <ThemedText style={[styles.saveButtonText, { color: textColor }]}>
                Enregistrer
              </ThemedText>
            </TouchableOpacity>

            <PrimaryButton
              title={isSigning => isSigned ? 'Déjà signé' : 'Enregistrer et Signer'}
              onPress={() => handleSave(true)}
              disabled={isSaving || isSigned}
              style={styles.signButton}
            />
          </View>

          {isSigned && (
            <View style={styles.signedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <ThemedText style={styles.signedText}>
                Fiche signée par {parent.firstName} {parent.lastName}
              </ThemedText>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={styles.savingText}>Enregistrement...</ThemedText>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
  },
  subheader: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    marginLeft: 4,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  bloodTypeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  bloodTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formCard: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.xl,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e520',
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e520',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  addContactForm: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  addContactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signButton: {
    flex: 1,
  },
  signedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  signedText: {
    color: '#10b981',
    fontSize: 14,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  savingText: {
    fontSize: 16,
  },
});
