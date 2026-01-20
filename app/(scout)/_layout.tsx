import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/auth-context';
import { UserRole, Scout } from '@/types';

export default function ScoutLayout() {
  const { user, isLoading } = useAuth();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  // Vérifier si le scout est validé
  const scout = user as Scout | null;
  const isScout = user && (user.role === UserRole.SCOUT || user.role === 'scout');
  const needsValidation = isScout && scout && !scout.validated;

  // Rediriger vers pending-approval si le scout n'est pas validé
  useEffect(() => {
    if (!isLoading && needsValidation) {
      console.log('🔵 ScoutLayout - Scout non validé, redirection vers pending-approval');
      router.replace('/(auth)/pending-approval');
    }
  }, [isLoading, needsValidation]);

  console.log('🔵 ScoutLayout - isLoading:', isLoading, 'user:', user?.email, 'role:', user?.role);

  // Ne pas rendre le layout si l'utilisateur n'est pas un scout
  if (isLoading) {
    console.log('🔵 ScoutLayout - En attente (isLoading)');
    return null;
  }

  if (!user) {
    console.log('🔵 ScoutLayout - Pas d\'utilisateur, return null');
    return null;
  }

  // Vérification stricte du rôle
  if (!isScout) {
    console.log('🔵 ScoutLayout - Mauvais rôle:', user.role, '- return null');
    return null;
  }

  // Attendre la redirection si le scout n'est pas validé
  if (needsValidation) {
    return null;
  }

  console.log('🔵 ScoutLayout - Rendu du layout scout pour:', user.email);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarStyle: {
          backgroundColor,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'shift' : 'fade',
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Événements',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Défis',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Plus',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
      {/* Routes cachées */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Accessible depuis Plus
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="health/edit"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="change-password"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="section"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="delete-account"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
