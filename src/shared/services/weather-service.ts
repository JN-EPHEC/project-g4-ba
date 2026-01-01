/**
 * Service Météo utilisant l'API Open-Meteo (gratuite, sans clé API)
 * Documentation: https://open-meteo.com/
 */

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  humidity: number;
  windSpeed: number;
}

export interface DailyForecast {
  date: Date;
  tempMin: number;
  tempMax: number;
  weatherCode: number;
  precipitationProbability: number;
}

export interface WeatherForecast {
  current: WeatherData;
  daily: DailyForecast[];
  location?: string;
}

// Mapping des codes météo Open-Meteo vers des icônes et descriptions
const WEATHER_CODES: Record<number, { icon: string; description: string }> = {
  0: { icon: '☀️', description: 'Ensoleillé' },
  1: { icon: '🌤️', description: 'Peu nuageux' },
  2: { icon: '⛅', description: 'Partiellement nuageux' },
  3: { icon: '☁️', description: 'Nuageux' },
  45: { icon: '🌫️', description: 'Brouillard' },
  48: { icon: '🌫️', description: 'Brouillard givrant' },
  51: { icon: '🌧️', description: 'Bruine légère' },
  53: { icon: '🌧️', description: 'Bruine modérée' },
  55: { icon: '🌧️', description: 'Bruine dense' },
  56: { icon: '🌧️', description: 'Bruine verglaçante' },
  57: { icon: '🌧️', description: 'Bruine verglaçante dense' },
  61: { icon: '🌧️', description: 'Pluie légère' },
  63: { icon: '🌧️', description: 'Pluie modérée' },
  65: { icon: '🌧️', description: 'Pluie forte' },
  66: { icon: '🌧️', description: 'Pluie verglaçante' },
  67: { icon: '🌧️', description: 'Pluie verglaçante forte' },
  71: { icon: '🌨️', description: 'Neige légère' },
  73: { icon: '🌨️', description: 'Neige modérée' },
  75: { icon: '🌨️', description: 'Neige forte' },
  77: { icon: '🌨️', description: 'Grains de neige' },
  80: { icon: '🌦️', description: 'Averses légères' },
  81: { icon: '🌦️', description: 'Averses modérées' },
  82: { icon: '🌦️', description: 'Averses violentes' },
  85: { icon: '🌨️', description: 'Averses de neige légères' },
  86: { icon: '🌨️', description: 'Averses de neige fortes' },
  95: { icon: '⛈️', description: 'Orage' },
  96: { icon: '⛈️', description: 'Orage avec grêle légère' },
  99: { icon: '⛈️', description: 'Orage avec grêle forte' },
};

// Cache simple pour éviter trop de requêtes
const weatherCache: Map<string, { data: WeatherForecast; timestamp: number }> = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class WeatherService {
  private static readonly BASE_URL = 'https://api.open-meteo.com/v1/forecast';

  /**
   * Récupérer les prévisions météo pour une localisation
   */
  static async getForecast(
    latitude: number,
    longitude: number,
    days = 3
  ): Promise<WeatherForecast | null> {
    const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}`;

    // Vérifier le cache
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current: 'temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        forecast_days: days.toString(),
        timezone: 'auto',
      });

      const response = await fetch(`${this.BASE_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const forecast: WeatherForecast = {
        current: {
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day === 1,
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
        },
        daily: data.daily.time.map((date: string, index: number) => ({
          date: new Date(date),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          weatherCode: data.daily.weather_code[index],
          precipitationProbability: data.daily.precipitation_probability_max[index],
        })),
      };

      // Mettre en cache
      weatherCache.set(cacheKey, { data: forecast, timestamp: Date.now() });

      return forecast;
    } catch (error) {
      console.error('[WeatherService] Erreur:', error);
      return null;
    }
  }

  /**
   * Récupérer les coordonnées d'une ville (geocoding)
   * En cas d'erreur, retourne les coordonnées par défaut (Belgique)
   */
  static async getCoordinates(
    cityName: string
  ): Promise<{ latitude: number; longitude: number; name: string } | null> {
    try {
      const params = new URLSearchParams({
        name: cityName,
        count: '1',
        language: 'fr',
        format: 'json',
      });

      // Ajouter un timeout de 5 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?${params}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          name: result.name,
        };
      }

      // Pas de résultat, utiliser les coordonnées par défaut
      const defaultCoords = this.getDefaultCoordinates();
      return { ...defaultCoords, name: 'Belgique' };
    } catch (error) {
      console.error('[WeatherService] Erreur geocoding, utilisation des coordonnées par défaut:', error);
      // En cas d'erreur, retourner les coordonnées par défaut
      const defaultCoords = this.getDefaultCoordinates();
      return { ...defaultCoords, name: 'Belgique' };
    }
  }

  /**
   * Récupérer l'icône météo
   */
  static getWeatherIcon(code: number): string {
    return WEATHER_CODES[code]?.icon || '❓';
  }

  /**
   * Récupérer la description météo
   */
  static getWeatherDescription(code: number): string {
    return WEATHER_CODES[code]?.description || 'Inconnu';
  }

  /**
   * Déterminer si les conditions sont mauvaises (alerte)
   */
  static isBadWeather(code: number): boolean {
    // Codes indiquant de mauvaises conditions
    const badCodes = [65, 66, 67, 75, 77, 82, 86, 95, 96, 99];
    return badCodes.includes(code);
  }

  /**
   * Coordonnées par défaut (Belgique - Bruxelles)
   */
  static getDefaultCoordinates(): { latitude: number; longitude: number } {
    return { latitude: 50.85, longitude: 4.35 };
  }
}
