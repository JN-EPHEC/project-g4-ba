import { useTheme } from '@/context/theme-context';

/**
 * Hook qui retourne le schéma de couleur actuel basé sur le contexte de thème.
 * Version web - utilise notre système de thème personnalisé.
 */
export function useColorScheme(): 'light' | 'dark' {
  try {
    const { colorScheme } = useTheme();
    return colorScheme;
  } catch {
    return 'light';
  }
}
