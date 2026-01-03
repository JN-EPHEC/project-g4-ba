import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/context/auth-context';
import { UserRole } from '@/types';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { user, isLoading } = useAuth();

  // Si l'utilisateur est connecté, rediriger vers le dashboard approprié
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      console.log('🔄 WelcomeScreen - Utilisateur déjà connecté, redirection vers dashboard');
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
        case UserRole.WECAMP_ADMIN:
          router.replace('/(wecamp)/dashboard');
          break;
      }
    }
  }, [user, isLoading]);

  // "Commencer" → vers l'onboarding (slides d'introduction)
  const handleStart = () => {
    router.push('/(auth)/onboarding');
  };

  // "J'ai déjà un compte" → directement vers la connexion
  const handleLogin = () => {
    router.push('/(auth)/auth');
  };

  // Admin WeCamp → connexion admin
  const handleAdmin = () => {
    router.push('/(auth)/admin-login');
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Si l'utilisateur est connecté, ne rien afficher (la redirection est en cours)
  if (user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cercles décoratifs en arrière-plan */}
      <Animated.View
        entering={FadeIn.duration(1000).delay(200)}
        style={[styles.decorativeCircle, styles.circleTopRight]}
      />
      <Animated.View
        entering={FadeIn.duration(1000).delay(400)}
        style={[styles.decorativeCircle, styles.circleBottomLeft]}
      />
      <Animated.View
        entering={FadeIn.duration(1000).delay(600)}
        style={[styles.decorativeCircle, styles.circleMiddle]}
      />

      {/* Éléments décoratifs (emojis) */}
      <Animated.Text
        entering={FadeIn.duration(800).delay(500)}
        style={[styles.decorEmoji, styles.emojiTree]}
      >
        🌲
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.duration(800).delay(700)}
        style={[styles.decorEmoji, styles.emojiTent]}
      >
        ⛺
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.duration(800).delay(900)}
        style={[styles.decorEmoji, styles.emojiFire]}
      >
        🔥
      </Animated.Text>
      <Animated.Text
        entering={FadeIn.duration(800).delay(1100)}
        style={[styles.decorEmoji, styles.emojiCompass]}
      >
        🧭
      </Animated.Text>

      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Logo Wecamp avec feuille */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(300)}
          style={styles.logoContainer}
        >
          <View style={styles.logoWrapper}>
            <View style={styles.leafAbove}>
              <Text style={styles.leafEmoji}>🌿</Text>
            </View>
            <Text style={styles.logoText}>Wecamp</Text>
          </View>
        </Animated.View>

        {/* Sous-titre / Slogan */}
        <Animated.Text
          entering={FadeInUp.duration(600).delay(500)}
          style={styles.slogan}
        >
          Scouting together
        </Animated.Text>

        {/* Description */}
        <Animated.Text
          entering={FadeInUp.duration(600).delay(700)}
          style={styles.subtitle}
        >
          L'aventure scoute, simplifiée
        </Animated.Text>
      </View>

      {/* Boutons */}
      <View style={styles.buttonsContainer}>
        <Animated.View entering={FadeInUp.duration(600).delay(900)}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Commencer</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(1100)}>
          <TouchableOpacity
            style={styles.loginLink}
            onPress={handleLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>J'ai déjà un compte</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(1300)}>
          <TouchableOpacity
            style={styles.adminLink}
            onPress={handleAdmin}
            activeOpacity={0.7}
          >
            <Text style={styles.adminLinkText}>Admin</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5A3D',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Cercles décoratifs
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circleTopRight: {
    width: width * 0.6,
    height: width * 0.6,
    top: -width * 0.15,
    right: -width * 0.15,
  },
  circleBottomLeft: {
    width: width * 0.5,
    height: width * 0.5,
    bottom: height * 0.15,
    left: -width * 0.2,
  },
  circleMiddle: {
    width: width * 0.3,
    height: width * 0.3,
    top: height * 0.35,
    right: -width * 0.1,
  },
  // Emojis décoratifs
  decorEmoji: {
    position: 'absolute',
    fontSize: 32,
    opacity: 0.7,
  },
  emojiTree: {
    top: height * 0.22,
    left: width * 0.08,
    fontSize: 28,
  },
  emojiTent: {
    top: height * 0.15,
    right: width * 0.12,
    fontSize: 24,
  },
  emojiFire: {
    bottom: height * 0.22,
    right: width * 0.1,
    fontSize: 26,
  },
  emojiCompass: {
    bottom: height * 0.35,
    left: width * 0.06,
    fontSize: 22,
    opacity: 0.5,
  },
  // Contenu principal
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  leafAbove: {
    marginBottom: -8,
    marginLeft: -80,
  },
  logoText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  leafEmoji: {
    fontSize: 32,
    transform: [{ rotate: '-45deg' }],
  },
  slogan: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  // Boutons
  buttonsContainer: {
    paddingHorizontal: 32,
    paddingBottom: 60,
    gap: 16,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#2D5A3D',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginLinkText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  adminLink: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  adminLinkText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '400',
  },
});
