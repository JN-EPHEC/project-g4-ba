import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useHealthRecord } from '@/src/features/health/hooks/use-health-record';
import {
  Scout,
  Allergy,
  AllergySeverity,
  Medication,
  EmergencyContact,
  BloodType,
  HealthRecordInput,
} from '@/types';
import { BrandColors } from '@/constants/theme';

// UUID simple pour les IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Options de groupe sanguin
const BLOOD_TYPES: { value: BloodType; label: string }[] = [
  { value: BloodType.A_POSITIVE, label: 'A+' },
  { value: BloodType.A_NEGATIVE, label: 'A-' },
  { value: BloodType.B_POSITIVE, label: 'B+' },
  { value: BloodType.B_NEGATIVE, label: 'B-' },
  { value: BloodType.AB_POSITIVE, label: 'AB+' },
  { value: BloodType.AB_NEGATIVE, label: 'AB-' },
  { value: BloodType.O_POSITIVE, label: 'O+' },
  { value: BloodType.O_NEGATIVE, label: 'O-' },
];

// Options de sévérité
const SEVERITY_OPTIONS: { value: AllergySeverity; label: string; color: string }[] = [
  { value: AllergySeverity.LIGHT, label: 'Léger', color: '#d97706' },
  { value: AllergySeverity.MODERATE, label: 'Modéré', color: '#ea580c' },
  { value: AllergySeverity.SEVERE, label: 'Sévère', color: '#dc2626' },
];

export default function EditHealthScreen() {
  const { user } = useAuth();
  const scout = user as Scout;
  const { healthRecord, loading, updateRecord } = useHealthRecord(scout?.id, scout?.id);

  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1a1a1a' }, 'surface');

  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [bloodType, setBloodType] = useState<BloodType | undefined>(undefined);
  const [insuranceName, setInsuranceName] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  // Modal states
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showBloodTypeModal, setShowBloodTypeModal] = useState(false);

  // Edit state for modals
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  // Load existing data
  useEffect(() => {
    if (healthRecord) {
      setBloodType(healthRecord.bloodType);
      setInsuranceName(healthRecord.insuranceName || '');
      setInsuranceNumber(healthRecord.insuranceNumber || '');
      setAdditionalNotes(healthRecord.additionalNotes || '');
      setAllergies(healthRecord.allergies || []);
      setMedications(healthRecord.medications || []);
      setEmergencyContacts(healthRecord.emergencyContacts || []);
    }
  }, [healthRecord]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const data: HealthRecordInput = {
        bloodType,
        insuranceName: insuranceName.trim() || undefined,
        insuranceNumber: insuranceNumber.trim() || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
        allergies,
        medications,
        emergencyContacts,
      };

      await updateRecord(data);

      Alert.alert('Succès', 'Ta fiche santé a été mise à jour !', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour ta fiche santé');
    } finally {
      setIsSaving(false);
    }
  };

  // Allergy handlers
  const handleAddAllergy = (allergy: Allergy) => {
    if (editingAllergy) {
      setAllergies(allergies.map((a) => (a.id === editingAllergy.id ? allergy : a)));
    } else {
      setAllergies([...allergies, { ...allergy, id: generateId() }]);
    }
    setEditingAllergy(null);
    setShowAllergyModal(false);
  };

  const handleDeleteAllergy = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer cette allergie ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setAllergies(allergies.filter((a) => a.id !== id)) },
    ]);
  };

  // Medication handlers
  const handleAddMedication = (medication: Medication) => {
    if (editingMedication) {
      setMedications(medications.map((m) => (m.id === editingMedication.id ? medication : m)));
    } else {
      setMedications([...medications, { ...medication, id: generateId() }]);
    }
    setEditingMedication(null);
    setShowMedicationModal(false);
  };

  const handleDeleteMedication = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer ce médicament ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setMedications(medications.filter((m) => m.id !== id)) },
    ]);
  };

  // Contact handlers
  const handleAddContact = (contact: EmergencyContact) => {
    let updatedContacts = [...emergencyContacts];

    if (contact.isPrimary) {
      // Remove primary from others
      updatedContacts = updatedContacts.map((c) => ({ ...c, isPrimary: false }));
    }

    if (editingContact) {
      updatedContacts = updatedContacts.map((c) => (c.id === editingContact.id ? contact : c));
    } else {
      updatedContacts.push({ ...contact, id: generateId() });
    }

    // Ensure at least one primary
    if (!updatedContacts.some((c) => c.isPrimary) && updatedContacts.length > 0) {
      updatedContacts[0].isPrimary = true;
    }

    setEmergencyContacts(updatedContacts);
    setEditingContact(null);
    setShowContactModal(false);
  };

  const handleDeleteContact = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer ce contact ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          const updated = emergencyContacts.filter((c) => c.id !== id);
          // Ensure at least one primary
          if (!updated.some((c) => c.isPrimary) && updated.length > 0) {
            updated[0].isPrimary = true;
          }
          setEmergencyContacts(updated);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Chargement...</ThemedText>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>
              Modifier ma fiche santé
            </ThemedText>
            <View style={styles.placeholder} />
          </View>

          {/* Informations générales */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionIcon}>🏥</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Informations générales
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Groupe sanguin</ThemedText>
              <TouchableOpacity
                style={[styles.selector, { borderColor }]}
                onPress={() => setShowBloodTypeModal(true)}
              >
                <ThemedText style={bloodType ? {} : styles.placeholder}>
                  {bloodType || 'Sélectionner...'}
                </ThemedText>
                <Ionicons name="chevron-down" size={20} color={iconColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Nom de la mutuelle</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                value={insuranceName}
                onChangeText={setInsuranceName}
                placeholder="Ex: Mutualité Chrétienne"
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Numéro d'affiliation</ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }]}
                value={insuranceNumber}
                onChangeText={setInsuranceNumber}
                placeholder="Ex: 123-456-789"
                placeholderTextColor="#888"
              />
            </View>
          </Card>

          {/* Allergies */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionIcon}>🚨</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Allergies
              </ThemedText>
            </View>

            {allergies.map((allergy) => (
              <View key={allergy.id} style={[styles.listItem, { borderColor }]}>
                <View style={styles.listItemContent}>
                  <View style={styles.listItemHeader}>
                    <ThemedText type="defaultSemiBold">{allergy.name}</ThemedText>
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor:
                            allergy.severity === AllergySeverity.SEVERE
                              ? '#fecaca'
                              : allergy.severity === AllergySeverity.MODERATE
                              ? '#fed7aa'
                              : '#fef3c7',
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.severityText,
                          {
                            color:
                              allergy.severity === AllergySeverity.SEVERE
                                ? '#dc2626'
                                : allergy.severity === AllergySeverity.MODERATE
                                ? '#ea580c'
                                : '#d97706',
                          },
                        ]}
                      >
                        {SEVERITY_OPTIONS.find((s) => s.value === allergy.severity)?.label}
                      </ThemedText>
                    </View>
                  </View>
                  {allergy.description && (
                    <ThemedText color="secondary" style={styles.listItemDesc}>
                      {allergy.description}
                    </ThemedText>
                  )}
                  {allergy.requiresEpiPen && (
                    <View style={styles.epipenBadge}>
                      <ThemedText style={styles.epipenText}>💉 EpiPen requis</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingAllergy(allergy);
                      setShowAllergyModal(true);
                    }}
                  >
                    <Ionicons name="pencil" size={20} color={iconColor} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteAllergy(allergy.id)}>
                    <Ionicons name="trash" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingAllergy(null);
                setShowAllergyModal(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color={BrandColors.primary[500]} />
              <ThemedText style={[styles.addButtonText, { color: BrandColors.primary[500] }]}>
                Ajouter une allergie
              </ThemedText>
            </TouchableOpacity>
          </Card>

          {/* Médicaments */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionIcon}>💊</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Médicaments
              </ThemedText>
            </View>

            {medications.map((medication) => (
              <View key={medication.id} style={[styles.listItem, { borderColor }]}>
                <View style={styles.listItemContent}>
                  <View style={styles.listItemHeader}>
                    <ThemedText type="defaultSemiBold">{medication.name}</ThemedText>
                    {medication.isVital && (
                      <View style={styles.vitalBadge}>
                        <ThemedText style={styles.vitalText}>VITAL</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText color="secondary" style={styles.listItemDesc}>
                    {medication.dosage} - {medication.frequency}
                  </ThemedText>
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingMedication(medication);
                      setShowMedicationModal(true);
                    }}
                  >
                    <Ionicons name="pencil" size={20} color={iconColor} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteMedication(medication.id)}>
                    <Ionicons name="trash" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingMedication(null);
                setShowMedicationModal(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color={BrandColors.primary[500]} />
              <ThemedText style={[styles.addButtonText, { color: BrandColors.primary[500] }]}>
                Ajouter un médicament
              </ThemedText>
            </TouchableOpacity>
          </Card>

          {/* Contacts d'urgence */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionIcon}>📞</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Contacts d'urgence
              </ThemedText>
            </View>

            {emergencyContacts.map((contact) => (
              <View key={contact.id} style={[styles.listItem, { borderColor }]}>
                <View style={styles.listItemContent}>
                  <View style={styles.listItemHeader}>
                    <ThemedText type="defaultSemiBold">{contact.name}</ThemedText>
                    {contact.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <ThemedText style={styles.primaryText}>Principal</ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText color="secondary" style={styles.listItemDesc}>
                    {contact.relation} • {contact.phone}
                  </ThemedText>
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingContact(contact);
                      setShowContactModal(true);
                    }}
                  >
                    <Ionicons name="pencil" size={20} color={iconColor} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteContact(contact.id)}>
                    <Ionicons name="trash" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingContact(null);
                setShowContactModal(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color={BrandColors.primary[500]} />
              <ThemedText style={[styles.addButtonText, { color: BrandColors.primary[500] }]}>
                Ajouter un contact
              </ThemedText>
            </TouchableOpacity>
          </Card>

          {/* Notes additionnelles */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionIcon}>📝</ThemedText>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Notes additionnelles
              </ThemedText>
            </View>

            <TextInput
              style={[styles.textArea, { borderColor, color: textColor }]}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Informations complémentaires utiles pour les animateurs..."
              placeholderTextColor="#888"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <ThemedText style={styles.charCount}>{additionalNotes.length}/500</ThemedText>
          </Card>

          {/* Bouton Sauvegarder */}
          <PrimaryButton
            title={isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            onPress={handleSave}
            disabled={isSaving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Blood Type Modal */}
      <Modal visible={showBloodTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Groupe sanguin
            </ThemedText>
            {BLOOD_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.modalOption,
                  { borderColor },
                  bloodType === type.value && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setBloodType(type.value);
                  setShowBloodTypeModal(false);
                }}
              >
                <ThemedText>{type.label}</ThemedText>
                {bloodType === type.value && (
                  <Ionicons name="checkmark" size={20} color={BrandColors.primary[500]} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowBloodTypeModal(false)}
            >
              <ThemedText color="secondary">Annuler</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Allergy Modal */}
      <AllergyModal
        visible={showAllergyModal}
        onClose={() => {
          setShowAllergyModal(false);
          setEditingAllergy(null);
        }}
        onSave={handleAddAllergy}
        initialData={editingAllergy}
      />

      {/* Medication Modal */}
      <MedicationModal
        visible={showMedicationModal}
        onClose={() => {
          setShowMedicationModal(false);
          setEditingMedication(null);
        }}
        onSave={handleAddMedication}
        initialData={editingMedication}
      />

      {/* Contact Modal */}
      <ContactModal
        visible={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setEditingContact(null);
        }}
        onSave={handleAddContact}
        initialData={editingContact}
      />
    </ThemedView>
  );
}

// Allergy Modal Component
function AllergyModal({
  visible,
  onClose,
  onSave,
  initialData,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (allergy: Allergy) => void;
  initialData: Allergy | null;
}) {
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState<AllergySeverity>(AllergySeverity.LIGHT);
  const [description, setDescription] = useState('');
  const [requiresEpiPen, setRequiresEpiPen] = useState(false);

  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1a1a1a' }, 'surface');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSeverity(initialData.severity);
      setDescription(initialData.description || '');
      setRequiresEpiPen(initialData.requiresEpiPen);
    } else {
      setName('');
      setSeverity(AllergySeverity.LIGHT);
      setDescription('');
      setRequiresEpiPen(false);
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'allergie est requis');
      return;
    }
    onSave({
      id: initialData?.id || '',
      name: name.trim(),
      severity,
      description: description.trim() || undefined,
      requiresEpiPen,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.formModal, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {initialData ? 'Modifier l\'allergie' : 'Ajouter une allergie'}
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Nom de l'allergie *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Arachides, Gluten, Pénicilline..."
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Sévérité</ThemedText>
            <View style={styles.severitySelector}>
              {SEVERITY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.severityOption,
                    { borderColor: option.color },
                    severity === option.value && { backgroundColor: option.color + '20' },
                  ]}
                  onPress={() => setSeverity(option.value)}
                >
                  <ThemedText style={{ color: option.color }}>{option.label}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Description (optionnel)</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Réactions, précautions..."
              placeholderTextColor="#888"
            />
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setRequiresEpiPen(!requiresEpiPen)}
          >
            <View style={[styles.checkbox, { borderColor }, requiresEpiPen && styles.checkboxChecked]}>
              {requiresEpiPen && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <ThemedText>Nécessite un EpiPen</ThemedText>
          </TouchableOpacity>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <ThemedText color="secondary">Annuler</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveButton} onPress={handleSave}>
              <ThemedText style={styles.modalSaveText}>Enregistrer</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Medication Modal Component
function MedicationModal({
  visible,
  onClose,
  onSave,
  initialData,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (medication: Medication) => void;
  initialData: Medication | null;
}) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [isVital, setIsVital] = useState(false);

  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1a1a1a' }, 'surface');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDosage(initialData.dosage);
      setFrequency(initialData.frequency);
      setIsVital(initialData.isVital);
    } else {
      setName('');
      setDosage('');
      setFrequency('');
      setIsVital(false);
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!name.trim() || !dosage.trim() || !frequency.trim()) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }
    onSave({
      id: initialData?.id || '',
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      isVital,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.formModal, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {initialData ? 'Modifier le médicament' : 'Ajouter un médicament'}
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Nom du médicament *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Ventoline, Insuline..."
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Dosage *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={dosage}
              onChangeText={setDosage}
              placeholder="Ex: 100mg, 2 bouffées..."
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Fréquence *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={frequency}
              onChangeText={setFrequency}
              placeholder="Ex: 2x/jour, si besoin..."
              placeholderTextColor="#888"
            />
          </View>

          <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsVital(!isVital)}>
            <View style={[styles.checkbox, { borderColor }, isVital && styles.checkboxCheckedVital]}>
              {isVital && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <ThemedText>Médicament vital</ThemedText>
          </TouchableOpacity>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <ThemedText color="secondary">Annuler</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveButton} onPress={handleSave}>
              <ThemedText style={styles.modalSaveText}>Enregistrer</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Contact Modal Component
function ContactModal({
  visible,
  onClose,
  onSave,
  initialData,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (contact: EmergencyContact) => void;
  initialData: EmergencyContact | null;
}) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1a1a1a' }, 'surface');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRelation(initialData.relation);
      setPhone(initialData.phone);
      setIsPrimary(initialData.isPrimary);
    } else {
      setName('');
      setRelation('');
      setPhone('');
      setIsPrimary(false);
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!name.trim() || !relation.trim() || !phone.trim()) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }
    onSave({
      id: initialData?.id || '',
      name: name.trim(),
      relation: relation.trim(),
      phone: phone.trim(),
      isPrimary,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.formModal, { backgroundColor: cardBg }]}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            {initialData ? 'Modifier le contact' : 'Ajouter un contact'}
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Nom *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Marie Dupont"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Relation *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={relation}
              onChangeText={setRelation}
              placeholder="Ex: Mère, Père, Tuteur..."
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Téléphone *</ThemedText>
            <TextInput
              style={[styles.input, { borderColor, color: textColor }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Ex: +32 470 12 34 56"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsPrimary(!isPrimary)}>
            <View style={[styles.checkbox, { borderColor }, isPrimary && styles.checkboxChecked]}>
              {isPrimary && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <ThemedText>Contact principal (pour appel d'urgence)</ThemedText>
          </TouchableOpacity>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <ThemedText color="secondary">Annuler</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveButton} onPress={handleSave}>
              <ThemedText style={styles.modalSaveText}>Enregistrer</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
  },
  placeholder: {
    width: 40,
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
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 0,
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
    backgroundColor: '#2A2A2A',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#2A2A2A',
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#2A2A2A',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  listItemContent: {
    flex: 1,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  listItemDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 12,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  epipenBadge: {
    marginTop: 6,
  },
  epipenText: {
    fontSize: 12,
    color: '#dc2626',
  },
  vitalBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vitalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  primaryBadge: {
    backgroundColor: BrandColors.primary[500] + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.primary[500],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  formModal: {
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: BrandColors.primary[500] + '10',
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalSaveButton: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: BrandColors.primary[500],
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '600',
  },
  severitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  severityOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BrandColors.primary[500],
    borderColor: BrandColors.primary[500],
  },
  checkboxCheckedVital: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
});
