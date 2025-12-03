import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/auth-context';
import { NotificationProvider } from '@/context/notification-context';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';

export const unstable_settings = {
  anchor: '(auth)',
};

function RootLayoutContent() {
  const { isDark } = useTheme();
  const navigationTheme = isDark
    ? DarkTheme
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: '#FFFFFF',
          text: '#000000',
        },
      };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(scout)" />
        <Stack.Screen name="(parent)" />
        <Stack.Screen name="(animator)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppThemeProvider>
          <RootLayoutContent />
        </AppThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
