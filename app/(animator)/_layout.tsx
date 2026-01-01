import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { UserRole } from '@/types';
import { DURATION } from '@/src/shared/animations';

export default function AnimatorLayout() {
  const { user, isLoading } = useAuth();
  const { pendingChallengesCount, pendingScoutsCount } = useNotifications();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const totalNotifications = pendingChallengesCount + pendingScoutsCount;

  // Ne pas rendre le layout si l'utilisateur n'est pas un animateur
  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Vérification stricte du rôle - doit être exactement ANIMATOR
  if (user.role !== UserRole.ANIMATOR && user.role !== 'animator') {
    return null;
  }

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
        name="messages"
        options={{
          title: 'Messagerie',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
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
        name="documents"
        options={{
          title: 'Docs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: 'Gestion',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
          tabBarBadge: totalNotifications > 0 ? totalNotifications : undefined,
        }}
      />
      {/* Routes cachées - accessibles via navigation programmatique */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Accessible depuis Gestion
        }}
      />
      <Tabs.Screen
        name="scouts"
        options={{
          href: null, // Cache l'onglet de la barre de navigation
        }}
      />
      <Tabs.Screen
        name="scouts/[id]"
        options={{
          href: null, // Cache l'onglet de la barre de navigation
        }}
      />
      <Tabs.Screen
        name="validate-scouts"
        options={{
          href: null, // Cache l'onglet de la barre de navigation
        }}
      />
      <Tabs.Screen
        name="validate-challenges"
        options={{
          href: null, // Cache l'onglet de la barre de navigation
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null, // Cache l'onglet de la barre de navigation
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null, // Cache l'onglet de la barre de navigation
        }}
      />
      <Tabs.Screen
        name="change-password"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="unit-overview"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="documents/authorizations/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="documents/authorizations/create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="documents/authorizations/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
