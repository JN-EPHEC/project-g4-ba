/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // Prefer app ThemeContext (if present) so toggling theme updates Themed components.
  const ctx = useContext(ThemeContext);
  let theme: 'light' | 'dark' = (useColorScheme() ?? 'light') as 'light' | 'dark';

  if (ctx) {
    // Use the app mode (light/dark) from ThemeContext when available
    theme = ctx.mode;
  }
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
