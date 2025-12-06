import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { WidgetCard } from './widget-card';
import { WeatherService, WeatherForecast } from '@/src/shared/services/weather-service';

interface WeatherWidgetProps {
  location?: string; // Nom de la ville ou coordonnées
  latitude?: number;
  longitude?: number;
  delay?: number;
}

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export function WeatherWidget({
  location,
  latitude,
  longitude,
  delay = 0,
}: WeatherWidgetProps) {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [locationName, setLocationName] = useState<string>(location || 'Belgique');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(async () => {
    try {
      setError(null);
      let coords = { latitude: latitude || 0, longitude: longitude || 0 };

      // Si pas de coordonnées fournies, utiliser le geocoding ou les valeurs par défaut
      if (!latitude || !longitude) {
        if (location) {
          const geoResult = await WeatherService.getCoordinates(location);
          if (geoResult) {
            coords = { latitude: geoResult.latitude, longitude: geoResult.longitude };
            setLocationName(geoResult.name);
          } else {
            coords = WeatherService.getDefaultCoordinates();
          }
        } else {
          coords = WeatherService.getDefaultCoordinates();
        }
      }

      const weatherData = await WeatherService.getForecast(coords.latitude, coords.longitude, 4);

      if (weatherData) {
        setForecast(weatherData);
      } else {
        setError('Impossible de charger la météo');
      }
    } catch (err) {
      console.error('[WeatherWidget] Erreur:', err);
      setError('Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, location]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  if (isLoading) {
    return (
      <WidgetCard
        title="Météo"
        icon="partly-sunny"
        iconColor="#06b6d4"
        delay={delay}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#06b6d4" />
        </View>
      </WidgetCard>
    );
  }

  if (error || !forecast) {
    return (
      <WidgetCard
        title="Météo"
        icon="partly-sunny"
        iconColor="#06b6d4"
        delay={delay}
      >
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline" size={32} color="#666" />
          <ThemedText style={styles.errorText}>{error || 'Données indisponibles'}</ThemedText>
        </View>
      </WidgetCard>
    );
  }

  const isBadWeather = WeatherService.isBadWeather(forecast.current.weatherCode);

  return (
    <WidgetCard
      title={`Météo • ${locationName}`}
      icon="partly-sunny"
      iconColor="#06b6d4"
      delay={delay}
    >
      {/* Météo actuelle */}
      <View style={styles.currentWeather}>
        <View style={styles.currentMain}>
          <ThemedText style={styles.currentIcon}>
            {WeatherService.getWeatherIcon(forecast.current.weatherCode)}
          </ThemedText>
          <ThemedText style={styles.currentTemp}>{forecast.current.temperature}°</ThemedText>
        </View>
        <View style={styles.currentDetails}>
          <ThemedText style={styles.currentDescription}>
            {WeatherService.getWeatherDescription(forecast.current.weatherCode)}
          </ThemedText>
          <View style={styles.currentStats}>
            <View style={styles.statItem}>
              <Ionicons name="water" size={14} color="#06b6d4" />
              <ThemedText style={styles.statText}>{forecast.current.humidity}%</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flag" size={14} color="#06b6d4" />
              <ThemedText style={styles.statText}>{forecast.current.windSpeed} km/h</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Alerte si mauvais temps */}
      {isBadWeather && (
        <View style={styles.alert}>
          <Ionicons name="warning" size={16} color="#ef4444" />
          <ThemedText style={styles.alertText}>
            Conditions météo défavorables prévues
          </ThemedText>
        </View>
      )}

      {/* Prévisions */}
      <View style={styles.forecast}>
        {forecast.daily.slice(1).map((day, index) => (
          <View key={index} style={styles.forecastDay}>
            <ThemedText style={styles.forecastDayName}>
              {DAYS_FR[day.date.getDay()]}
            </ThemedText>
            <ThemedText style={styles.forecastIcon}>
              {WeatherService.getWeatherIcon(day.weatherCode)}
            </ThemedText>
            <ThemedText style={styles.forecastTemp}>
              {day.tempMax}° / {day.tempMin}°
            </ThemedText>
            {day.precipitationProbability > 30 && (
              <View style={styles.rainIndicator}>
                <Ionicons name="rainy" size={10} color="#06b6d4" />
                <ThemedText style={styles.rainText}>{day.precipitationProbability}%</ThemedText>
              </View>
            )}
          </View>
        ))}
      </View>
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorState: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#666',
    fontSize: 14,
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  currentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentIcon: {
    fontSize: 40,
  },
  currentTemp: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  currentDetails: {
    flex: 1,
    gap: 4,
  },
  currentDescription: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  currentStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#999',
    fontSize: 12,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef444420',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  alertText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  forecast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  forecastDay: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  forecastDayName: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  forecastIcon: {
    fontSize: 24,
  },
  forecastTemp: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  rainIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rainText: {
    color: '#06b6d4',
    fontSize: 10,
  },
});
