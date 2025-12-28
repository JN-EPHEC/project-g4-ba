import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { UserRole, Scout } from '@/types';
import { BrandColors } from '@/constants/theme';

/**
 * Écran de redirection initial
 * Redirige vers la page appropriée selon l'état d'authentification
 */
export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Éviter les redirections multiples
    if (hasRedirected.current) return;

    console.log('🔄 IndexScreen - isLoading:', isLoading, 'user:', user?.email || 'null');

    if (isLoading) {
      console.log('⏳ En attente de la restauration de session Firebase...');
      return;
    }

    // Marquer comme redirigé pour éviter les doubles redirections
    hasRedirected.current = true;

    if (!user) {
      console.log('👤 Aucun utilisateur connecté -> redirection vers welcome');
      router.replace('/(auth)/welcome');
    } else {
      console.log('✅ Utilisateur connecté:', user.email, '- Rôle:', user.role);
      // Utilisateur connecté -> redirection selon le rôle
      switch (user.role) {
        case UserRole.SCOUT:
          // Vérifier si le scout est validé par un animateur
          const scout = user as Scout;
          if (!scout.validated) {
            console.log('⏳ Scout non validé -> redirection vers pending-approval');
            router.replace('/(auth)/pending-approval');
          } else {
            router.replace('/(scout)/dashboard');
          }
          break;
        case UserRole.PARENT:
          router.replace('/(parent)/dashboard');
          break;
        case UserRole.ANIMATOR:
          router.replace('/(animator)/dashboard');
          break;
        default:
          router.replace('/(auth)/welcome');
      }
    }
  }, [user, isLoading]);

  // Afficher un loader pendant le chargement
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>⛺</Text>
        </View>
      </View>
      <Text style={styles.title}>WeCamp</Text>
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.primary[700],
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
});
