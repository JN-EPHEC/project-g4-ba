import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { router } from 'expo-router';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/auth-context';
import { UserRole, Scout } from '@/types';

export default function ScoutLayout() {
  const { user, isLoading } = useAuth();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  console.log('🔵 ScoutLayout - isLoading:', isLoading, 'user:', user?.email, 'role:', user?.role);

  // Ne pas rendre le layout si l'utilisateur n'est pas un scout
  // La redirection sera gérée par le composant index.tsx ou welcome.tsx
  if (isLoading) {
    console.log('🔵 ScoutLayout - En attente (isLoading)');
    return null; // Attendre que l'auth soit chargée
  }

  if (!user) {
    // Pas connecté - ne pas rendre, laisser le flux d'auth gérer
    console.log('🔵 ScoutLayout - Pas d\'utilisateur, return null');
    return null;
  }

  // Vérification stricte du rôle - doit être exactement SCOUT
  if (user.role !== UserRole.SCOUT && user.role !== 'scout') {
    // Mauvais rôle - ne pas rendre ce layout
    console.log('🔵 ScoutLayout - Mauvais rôle:', user.role, '- return null');
    return null;
  }

  // Vérifier si le scout est validé par un animateur
  const scout = user as Scout;
  if (!scout.validated) {
    console.log('🔵 ScoutLayout - Scout non validé, redirection vers pending-approval');
    router.replace('/(auth)/pending-approval');
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
    </Tabs>
  );
}
