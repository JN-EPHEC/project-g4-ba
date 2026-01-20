import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';

export default function ParentLayout() {
  const { user, isLoading } = useAuth();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  console.log('🟣 ParentLayout - isLoading:', isLoading, 'user:', user?.email, 'role:', user?.role);

  // Ne pas rendre le layout si l'utilisateur n'est pas un parent
  // La redirection sera gérée par le composant index.tsx ou welcome.tsx
  if (isLoading) {
    console.log('🟣 ParentLayout - En attente (isLoading)');
    return null; // Attendre que l'auth soit chargée
  }

  if (!user) {
    // Pas connecté - ne pas rendre, laisser le flux d'auth gérer
    console.log('🟣 ParentLayout - Pas d\'utilisateur, return null');
    return null;
  }

  // Vérification stricte du rôle - doit être exactement PARENT
  if (user.role !== UserRole.PARENT && user.role !== 'parent') {
    // Mauvais rôle - ne pas rendre ce layout
    console.log('🟣 ParentLayout - Mauvais rôle:', user.role, '- return null');
    return null;
  }

  console.log('🟣 ParentLayout - Rendu du layout parent pour:', user.email);

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
        name="scouts"
        options={{
          title: 'Mes Scouts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
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
        name="challenges"
        options={{
          href: null, // Accessible depuis Plus
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Accessible depuis Plus
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="scouts/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="scouts/[id]/health"
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
