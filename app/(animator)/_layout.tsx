import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/auth-context';
import { useNotifications } from '@/context/notification-context';
import { UserRole } from '@/types';

export default function AnimatorLayout() {
  const { user, isLoading } = useAuth();
  const { pendingChallengesCount, pendingScoutsCount } = useNotifications();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const totalNotifications = pendingChallengesCount + pendingScoutsCount;

  // Rediriger vers login si l'utilisateur n'est pas connecté ou n'est pas un animateur
  useEffect(() => {
    if (!isLoading && (!user || user.role !== UserRole.ANIMATOR)) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarStyle: {
          backgroundColor,
        },
        headerShown: false,
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
        name="documents"
        options={{
          title: 'Documents',
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
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      {/* Routes cachées - accessibles via navigation programmatique */}
      <Tabs.Screen
        name="challenges"
        options={{
          href: null, // Cache l'onglet de la barre de navigation
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
    </Tabs>
  );
}
