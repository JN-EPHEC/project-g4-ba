import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  backgroundColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Bienvenue dans WeCamp',
    description: "L'application qui simplifie la gestion de votre mouvement de jeunesse",
    emoji: '⛺',
    color: '#2D5A3D',
    backgroundColor: '#E8F5E9',
  },
  {
    id: '2',
    title: 'Organisez vos activités',
    description: 'Planifiez événements, camps et réunions en quelques clics',
    emoji: '📅',
    color: '#D97B4A',
    backgroundColor: '#FFF3E0',
  },
  {
    id: '3',
    title: 'Communiquez facilement',
    description: 'Échangez avec les scouts, parents et animateurs au même endroit',
    emoji: '💬',
    color: '#E5A84B',
    backgroundColor: '#FFF8E1',
  },
  {
    id: '4',
    title: 'Motivez vos scouts',
    description: 'Défis, badges et classements pour une aventure gamifiée',
    emoji: '⭐',
    color: '#7C5CBF',
    backgroundColor: '#F3E5F5',
  },
];

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const finishOnboarding = () => {
    // Aller vers l'écran d'inscription après l'onboarding
    router.replace('/(auth)/register');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={[styles.slide, { width }]}>
      {/* Cercle avec icône */}
      <View style={styles.iconWrapper}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: item.backgroundColor },
          ]}
        >
          <View style={styles.iconInnerCircle}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
        </View>
        {/* Bordure pointillée */}
        <View
          style={[
            styles.dashedBorder,
            { borderColor: item.color + '40' },
          ]}
        />
      </View>

      {/* Titre */}
      <Text style={styles.title}>{item.title}</Text>

      {/* Description */}
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const currentSlide = SLIDES[currentIndex];
  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Bouton Passer */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Pagination et bouton */}
      <View style={styles.footer}>
        {/* Indicateurs (dots) */}
        <View style={styles.pagination}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                index === currentIndex
                  ? [styles.dotActive, { backgroundColor: slide.color }]
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Bouton Suivant / C'est parti */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: currentSlide.color },
            isLastSlide && styles.nextButtonLast,
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? "C'est parti !" : 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 48,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dashedBorder: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },
  nextButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonLast: {
    // Style spécial pour le dernier bouton si nécessaire
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
