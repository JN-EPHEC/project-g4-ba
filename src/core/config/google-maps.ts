import Constants from 'expo-constants';

/**
 * Configuration Google Maps
 * La clé API doit être définie dans les variables d'environnement
 */
export const googleMapsConfig = {
  apiKey: Constants.expoConfig?.extra?.googleMapsApiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
};

// Vérifier que la clé est définie
if (!googleMapsConfig.apiKey) {
  console.warn('⚠️  Clé API Google Maps non définie');
  console.warn('📝 Ajoutez EXPO_PUBLIC_GOOGLE_MAPS_API_KEY dans votre fichier .env');
}

export default googleMapsConfig;

