import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { WeatherService, WeatherForecast } from '@/src/shared/services/weather-service';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';

interface WeatherWidgetProps {
  location?: string;
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
      <Animated.View entering={FadeInDown.duration(400).delay(delay)}>
        <View style={styles.card}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        </View>
      </Animated.View>
    );
  }

  if (error || !forecast) {
    return (
      <Animated.View entering={FadeInDown.duration(400).delay(delay)}>
        <View style={styles.card}>
          <View style={styles.errorState}>
            <Ionicons name="cloud-offline" size={32} color="rgba(255,255,255,0.6)" />
            <ThemedText style={styles.errorText}>{error || 'Données indisponibles'}</ThemedText>
          </View>
        </View>
      </Animated.View>
    );
  }

  const isBadWeather = WeatherService.isBadWeather(forecast.current.weatherCode);

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay)}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="partly-sunny" size={16} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.headerTitle}>Météo • {locationName}</ThemedText>
        </View>

        {/* Current Weather */}
        <View style={styles.currentWeather}>
          <View style={styles.currentMain}>
            <ThemedText style={styles.currentTemp}>{forecast.current.temperature}°</ThemedText>
          </View>
          <View style={styles.currentDetails}>
            <ThemedText style={styles.currentDescription}>
              {WeatherService.getWeatherDescription(forecast.current.weatherCode)}
            </ThemedText>
            <View style={styles.currentStats}>
              <View style={styles.statItem}>
                <Ionicons name="water" size={14} color="#FFFFFF" />
                <ThemedText style={styles.statText}>{forecast.current.humidity}%</ThemedText>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flag" size={14} color="#FFFFFF" />
                <ThemedText style={styles.statText}>{forecast.current.windSpeed} km/h</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Alert si mauvais temps */}
        {isBadWeather && (
          <View style={styles.alert}>
            <Ionicons name="warning" size={14} color="#FFFFFF" />
            <ThemedText style={styles.alertText}>
              Conditions météo défavorables
            </ThemedText>
          </View>
        )}

        {/* Forecast */}
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
                  <Ionicons name="rainy" size={10} color={BrandColors.accent[500]} />
                  <ThemedText style={styles.rainText}>{day.precipitationProbability}%</ThemedText>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.primary[500],
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorState: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  currentMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currentTemp: {
    fontSize: 56,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  currentDetails: {
    flex: 1,
    gap: Spacing.xs,
  },
  currentDescription: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  currentStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  alertText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
  },
  forecast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  forecastDay: {
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  forecastDayName: {
    color: 'rgba(255,255,255,0.8)',
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
    color: BrandColors.accent[500],
    fontSize: 10,
    fontWeight: '600',
  },
});
