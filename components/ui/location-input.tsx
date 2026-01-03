import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Spacing, Radius } from '@/constants/design-tokens';

// Interface pour les résultats Nominatim
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
}

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

export function LocationInput({
  value,
  onChangeText,
  placeholder = 'Rechercher une adresse...',
  error,
  label,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Theme colors
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Debounce timer ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Recherche d'adresses avec debounce
  const handleLocationChange = useCallback((text: string) => {
    onChangeText(text);
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
        setSuggestions(results);
        setIsSearching(false);
      }, 400);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  }, [onChangeText]);

  // Sélection d'une suggestion
  const handleSelectSuggestion = (suggestion: NominatimResult) => {
    onChangeText(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: textColor }]}>{label}</Text>}

      <View style={styles.inputContainer}>
        <Ionicons
          name="location"
          size={20}
          color={textSecondary}
          style={styles.locationIcon}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: cardColor,
              borderColor: error ? '#FF3B30' : cardBorder,
              color: textColor,
            },
          ]}
          value={value}
          onChangeText={handleLocationChange}
          placeholder={placeholder}
          placeholderTextColor={textSecondary}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
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

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
          {suggestions.map((suggestion) => (
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
      {showSuggestions && !isSearching && value.length >= 3 && suggestions.length === 0 && (
        <View style={[styles.noResultsContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
          <Text style={[styles.noResultsText, { color: textSecondary }]}>
            Aucune adresse trouvée
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 1,
  },
  input: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    paddingLeft: Spacing.xl + Spacing.md,
    fontSize: 16,
    borderWidth: 1,
  },
  searchingIndicator: {
    position: 'absolute',
    right: Spacing.md,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 2,
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
});
