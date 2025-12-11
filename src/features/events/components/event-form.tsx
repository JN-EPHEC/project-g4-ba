import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventType } from '@/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Spacing, Radius } from '@/constants/design-tokens';

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

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const EVENT_TYPES: { value: EventType; label: string; icon: IoniconsName }[] = [
  { value: 'meeting', label: 'Réunion', icon: 'people' },
  { value: 'camp', label: 'Camp', icon: 'bonfire' },
  { value: 'activity', label: 'Activité', icon: 'compass' },
  { value: 'training', label: 'Formation', icon: 'school' },
];

// Interface pour les résultats Nominatim
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

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
  now.setMinutes(0);
  now.setSeconds(0);
  now.setHours(now.getHours() + 1);

  const endDate = new Date(now);
  endDate.setHours(endDate.getHours() + 2);

  return {
    startDate: formatDate(now),
    startTime: formatTime(now),
    endDate: formatDate(endDate),
    endTime: formatTime(endDate),
  };
};

// Recherche d'adresses via Nominatim (OpenStreetMap)
async function searchAddresses(query: string): Promise<NominatimResult[]> {
  if (query.length < 3) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=fr,be,ch,lu`,
      {
        headers: {
          'Accept-Language': 'fr',
          'User-Agent': 'WeCamp-App/1.0',
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data;
  } catch {
    return [];
  }
}

export function EventForm({ visible, onClose, onSubmit }: EventFormProps) {
  const defaults = getDefaultDates();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('activity');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [startDateStr, setStartDateStr] = useState(defaults.startDate);
  const [startTimeStr, setStartTimeStr] = useState(defaults.startTime);
  const [endDateStr, setEndDateStr] = useState(defaults.endDate);
  const [endTimeStr, setEndTimeStr] = useState(defaults.endTime);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debounce timer ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetForm = () => {
    const newDefaults = getDefaultDates();
    setTitle('');
    setDescription('');
    setType('activity');
    setLocation('');
    setLocationSuggestions([]);
    setShowSuggestions(false);
    setStartDateStr(newDefaults.startDate);
    setStartTimeStr(newDefaults.startTime);
    setEndDateStr(newDefaults.endDate);
    setEndTimeStr(newDefaults.endTime);
    setMaxParticipants('');
    setError('');
  };

  // Recherche d'adresses avec debounce
  const handleLocationChange = useCallback((text: string) => {
    setLocation(text);
    setShowSuggestions(true);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce la recherche (400ms)
    if (text.length >= 3) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchAddresses(text);
        setLocationSuggestions(results);
        setIsSearching(false);
      }, 400);
    } else {
      setLocationSuggestions([]);
      setIsSearching(false);
    }
  }, []);

  // Sélection d'une suggestion
  const handleSelectSuggestion = (suggestion: NominatimResult) => {
    setLocation(suggestion.display_name);
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
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
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: cardColor, borderBottomColor: cardBorder }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Nouvel événement</Text>
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

        <ScrollView style={styles.form} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Titre *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: cardColor, borderColor: cardBorder, color: textColor }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Réunion de rentrée"
              placeholderTextColor={textSecondary}
            />
          </View>

          {/* Type */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Type d'événement *</Text>
            <View style={styles.typeGrid}>
              {EVENT_TYPES.map((eventType) => {
                const isSelected = type === eventType.value;
                return (
                  <TouchableOpacity
                    key={eventType.value}
                    style={[
                      styles.typeButton,
                      { backgroundColor: cardColor, borderColor: cardBorder },
                      isSelected && styles.typeButtonSelected,
                    ]}
                    onPress={() => setType(eventType.value)}
                  >
                    <Ionicons
                      name={eventType.icon}
                      size={18}
                      color={isSelected ? BrandColors.primary[500] : textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: textSecondary },
                        isSelected && styles.typeLabelSelected,
                      ]}
                    >
                      {eventType.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: cardColor, borderColor: cardBorder, color: textColor }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez l'événement..."
              placeholderTextColor={textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Location with Autocomplete */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Lieu *</Text>
            <View style={styles.locationInputContainer}>
              <Ionicons
                name="location"
                size={20}
                color={textSecondary}
                style={styles.locationIcon}
              />
              <TextInput
                style={[styles.input, styles.locationInput, { backgroundColor: cardColor, borderColor: cardBorder, color: textColor }]}
                value={location}
                onChangeText={handleLocationChange}
                placeholder="Rechercher une adresse..."
                placeholderTextColor={textSecondary}
                onFocus={() => location.length >= 3 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {isSearching && (
                <ActivityIndicator
                  size="small"
                  color={BrandColors.primary[500]}
                  style={styles.searchingIndicator}
                />
              )}
            </View>

            {/* Suggestions dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
                {locationSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.place_id}
                    style={[styles.suggestionItem, { borderBottomColor: cardBorder }]}
                    onPress={() => handleSelectSuggestion(suggestion)}
                  >
                    <Ionicons name="location-outline" size={18} color={textSecondary} />
                    <Text
                      style={[styles.suggestionText, { color: textColor }]}
                      numberOfLines={2}
                    >
                      {suggestion.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Message si pas de résultat */}
            {showSuggestions && !isSearching && location.length >= 3 && locationSuggestions.length === 0 && (
              <View style={[styles.noResultsContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
                <Text style={[styles.noResultsText, { color: textSecondary }]}>
                  Aucune adresse trouvée
                </Text>
              </View>
            )}
          </View>

          {/* Start Date/Time */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Date et heure de début *</Text>
            <View style={styles.dateTimeRow}>
              <TextInput
                style={[styles.input, styles.dateInput, { backgroundColor: cardColor, borderColor: cardBorder, color: textColor }]}
                value={startDateStr}
                onChangeText={setStartDateStr}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor={textSecondary}
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={[styles.input, styles.timeInput, { backgroundColor: cardColor, borderColor: cardBorder, color: textColor }]}
                value={startTimeStr}
                onChangeText={setStartTimeStr}
                placeholder="HH:MM"
                placeholderTextColor={textSecondary}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* End Date/Time */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Date et heure de fin *</Text>
            <View style={styles.dateTimeRow}>
              <TextInput
                style={[styles.input, styles.dateInput, { backgroundColor: cardColor, borderColor: cardBorder, color: textColor }]}
                value={endDateStr}
                onChangeText={setEndDateStr}
                placeholder="JJ/MM/AAAA"
                placeholderTextColor={textSecondary}
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={[styles.input, styles.timeInput, { backgroundColor: cardColor, borderColor: cardBorder, color: textColor }]}
                value={endTimeStr}
                onChangeText={setEndTimeStr}
                placeholder="HH:MM"
                placeholderTextColor={textSecondary}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Max Participants */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textColor }]}>Nombre max. de participants (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.numberInput, { backgroundColor: cardColor, borderColor: cardBorder, color: textColor }]}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              placeholder="Illimité"
              placeholderTextColor={textSecondary}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: BrandColors.primary[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
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
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  errorContainer: {
    backgroundColor: '#FF3B3020',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  typeButtonSelected: {
    borderColor: BrandColors.primary[500],
    backgroundColor: `${BrandColors.primary[500]}15`,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeLabelSelected: {
    color: BrandColors.primary[500],
  },
  locationInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 1,
  },
  locationInput: {
    flex: 1,
    paddingLeft: Spacing.xl + Spacing.md,
  },
  searchingIndicator: {
    position: 'absolute',
    right: Spacing.md,
  },
  suggestionsContainer: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
  },
  noResultsContainer: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: Spacing.xs,
    padding: Spacing.md,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
