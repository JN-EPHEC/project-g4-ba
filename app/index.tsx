import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';

/**
 * Écran de redirection initial
 * Redirige vers la page appropriée selon l'état d'authentification
 */
export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Utilisateur non connecté -> redirection vers login
      router.replace('/(auth)/login');
    } else {
      // Utilisateur connecté -> redirection selon le rôle
      switch (user.role) {
        case UserRole.SCOUT:
          router.replace('/(scout)/dashboard');
          break;
        case UserRole.PARENT:
          router.replace('/(parent)/dashboard');
          break;
        case UserRole.ANIMATOR:
          router.replace('/(animator)/dashboard');
          break;
        default:
          router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading]);

  // Afficher un loader pendant le chargement
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
