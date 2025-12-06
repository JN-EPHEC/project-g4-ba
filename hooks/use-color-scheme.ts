import { useTheme } from '@/context/theme-context';

/**
 * Hook qui retourne le schéma de couleur actuel basé sur le contexte de thème.
 * Remplace useColorScheme de react-native pour utiliser notre système de thème personnalisé.
 */
export function useColorScheme(): 'light' | 'dark' {
  try {
    const { colorScheme } = useTheme();
    console.log('🎨 useColorScheme retourne:', colorScheme);
    return colorScheme;
  } catch (error) {
    // Fallback si le ThemeProvider n'est pas encore monté
    console.warn('⚠️ useColorScheme fallback vers dark:', error);
    return 'dark';
  }
}
