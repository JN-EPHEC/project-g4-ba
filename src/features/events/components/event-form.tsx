import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventType } from '@/types';

interface EventFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (eventData: EventFormData) => Promise<void>;
}

export interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  location: string;
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
}

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: 'meeting', label: 'Réunion', icon: '📋' },
  { value: 'camp', label: 'Camp', icon: '⛺' },
  { value: 'activity', label: 'Activité', icon: '🎯' },
  { value: 'training', label: 'Formation', icon: '📚' },
];

// Fonction pour formater une date en JJ/MM/AAAA
const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Fonction pour formater une heure en HH:MM
const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Fonction pour obtenir les valeurs par défaut
const getDefaultDates = () => {
  const now = new Date();
  // Arrondir à l'heure suivante
  now.setMinutes(0);
  now.setSeconds(0);
  now.setHours(now.getHours() + 1);

  const endDate = new Date(now);
  endDate.setHours(endDate.getHours() + 2); // 2 heures après le début par défaut

  return {
    startDate: formatDate(now),
    startTime: formatTime(now),
    endDate: formatDate(endDate),
    endTime: formatTime(endDate),
  };
};

export function EventForm({ visible, onClose, onSubmit }: EventFormProps) {
  const defaults = getDefaultDates();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('activity');
  const [location, setLocation] = useState('');
  const [startDateStr, setStartDateStr] = useState(defaults.startDate);
  const [startTimeStr, setStartTimeStr] = useState(defaults.startTime);
  const [endDateStr, setEndDateStr] = useState(defaults.endDate);
  const [endTimeStr, setEndTimeStr] = useState(defaults.endTime);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    const newDefaults = getDefaultDates();
    setTitle('');
    setDescription('');
    setType('activity');
    setLocation('');
    setStartDateStr(newDefaults.startDate);
    setStartTimeStr(newDefaults.startTime);
    setEndDateStr(newDefaults.endDate);
    setEndTimeStr(newDefaults.endTime);
    setMaxParticipants('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
    // Format attendu: DD/MM/YYYY et HH:MM
    const dateParts = dateStr.split('/');
    const timeParts = timeStr.split(':');

    if (dateParts.length !== 3 || timeParts.length !== 2) {
      return null;
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
      return null;
    }

    return new Date(year, month, day, hours, minutes);
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }
    if (!location.trim()) {
      setError('Le lieu est requis');
      return;
    }
    if (!startDateStr || !startTimeStr) {
      setError('La date et heure de début sont requises');
      return;
    }
    if (!endDateStr || !endTimeStr) {
      setError('La date et heure de fin sont requises');
      return;
    }

    const startDate = parseDateTime(startDateStr, startTimeStr);
    const endDate = parseDateTime(endDateStr, endTimeStr);

    if (!startDate) {
      setError('Format de date de début invalide (JJ/MM/AAAA HH:MM)');
      return;
    }
    if (!endDate) {
      setError('Format de date de fin invalide (JJ/MM/AAAA HH:MM)');
      return;
    }
    if (endDate <= startDate) {
      setError('La date de fin doit être après la date de début');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        type,
        location: location.trim(),
        startDate,
        endDate,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
      });
      handleClose();
    } catch (err) {
      setError('Erreur lors de la création de l\'événement');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvel événement</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Création...' : 'Créer'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Réunion de rentrée"
              placeholderTextColor="#999"
            />
          </View>

          {/* Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type d'événement *</Text>
            <View style={styles.typeGrid}>
              {EVENT_TYPES.map((eventType) => (
                <TouchableOpacity
                  key={eventType.value}
                  style={[
                    styles.typeButton,
                    type === eventType.value && styles.typeButtonSelected,
                  ]}
                  onPress={() => setType(eventType.value)}
                >
                  <Text style={styles.typeIcon}>{eventType.icon}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      type === eventType.value && styles.typeLabelSelected,
                    ]}
                  >
                    {eventType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez l'événement..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lieu *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Ex: Local scout, 12 rue des Scouts"
              placeholderTextColor="#999"
            />
          </View>

          {/* Start Date/Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date et heure de début *</Text>
            <View style={styles.dateTimeRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={startDateStr}
                onChangeText={setStartDateStr}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor="#999"
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={startTimeStr}
                onChangeText={setStartTimeStr}
                placeholder="HH:MM"
                placeholderTextColor="#999"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* End Date/Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date et heure de fin *</Text>
            <View style={styles.dateTimeRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={endDateStr}
                onChangeText={setEndDateStr}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor="#999"
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={endTimeStr}
                onChangeText={setEndTimeStr}
                placeholder="HH:MM"
                placeholderTextColor="#999"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Max Participants */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre max. de participants (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.numberInput]}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              placeholder="Illimité"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    gap: 20,
  },
  errorContainer: {
    backgroundColor: '#FF3B3020',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3A3A3A',
    gap: 8,
  },
  typeButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f620',
  },
  typeIcon: {
    fontSize: 18,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999999',
  },
  typeLabelSelected: {
    color: '#3b82f6',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },
  numberInput: {
    width: 150,
  },
});
