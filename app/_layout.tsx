import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

// Import global CSS for web
if (Platform.OS === 'web') {
  require('../global.css');
}

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { ThemeProvider } from '@/context/theme-context';
import { Colors, BrandColors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(auth)',
};

// Thèmes personnalisés basés sur notre palette
const WeCampLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: BrandColors.primary[500],
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: BrandColors.accent[500],
  },
};

const WeCampDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: BrandColors.primary[400],
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: BrandColors.accent[400],
  },
};

function AppContent() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? WeCampDarkTheme : WeCampLightTheme;

  return (
    <NavigationThemeProvider value={theme} key={colorScheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(scout)" />
        <Stack.Screen name="(parent)" />
        <Stack.Screen name="(animator)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
