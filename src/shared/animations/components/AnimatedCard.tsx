/**
 * AnimatedCard - Carte avec animations d'entrée et d'interaction
 * Combine FadeInUp à l'entrée et scale au press
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  ViewStyle,
  StyleProp,
  PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DURATION, TRANSLATE, EASING, SPRING_CONFIG, SCALE } from '../constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AnimatedCardProps extends Omit<PressableProps, 'style'> {
  /** Style de la carte */
  style?: StyleProp<ViewStyle>;
  /** Contenu de la carte */
  children: React.ReactNode;
  /** Index pour l'animation staggered (0 = pas de délai) */
  index?: number;
  /** Délai entre chaque carte pour stagger (default: 50ms) */
  staggerDelay?: number;
  /** Animer l'entrée (default: true) */
  animateEntrance?: boolean;
  /** Animer le press (default: true si onPress défini) */
  animatePress?: boolean;
  /** Distance de translation pour l'entrée */
  translateY?: number;
  /** Durée de l'animation d'entrée */
  entranceDuration?: number;
  /** Activer le haptic feedback (default: true) */
  hapticEnabled?: boolean;
  /** Délai initial avant toute animation */
  initialDelay?: number;
}

export function AnimatedCard({
  style,
  children,
  index = 0,
  staggerDelay = 50,
  animateEntrance = true,
  animatePress,
  translateY = TRANSLATE.normal,
  entranceDuration = DURATION.normal,
  hapticEnabled = true,
  initialDelay = 0,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: AnimatedCardProps) {
  // Animation d'entrée
  const entranceProgress = useSharedValue(animateEntrance ? 0 : 1);

  // Animation de press
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);

  // Déterminer si on anime le press
  const shouldAnimatePress = animatePress ?? !!onPress;

  useEffect(() => {
    if (animateEntrance) {
      const delay = initialDelay + index * staggerDelay;
      entranceProgress.value = withDelay(
        delay,
        withTiming(1, {
          duration: entranceDuration,
          easing: EASING.easeOut,
        })
      );
    }
  }, [animateEntrance, index, staggerDelay, initialDelay, entranceDuration, entranceProgress]);

  const triggerHaptic = () => {
    if (hapticEnabled && shouldAnimatePress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressIn = (event: any) => {
    if (disabled) return;

    if (shouldAnimatePress) {
      scale.value = withSpring(SCALE.pressed, SPRING_CONFIG.snappy);
      shadowOpacity.value = withTiming(0.05, { duration: DURATION.fast });
      runOnJS(triggerHaptic)();
    }

    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (disabled) return;

    if (shouldAnimatePress) {
      scale.value = withSpring(1, SPRING_CONFIG.apple);
      shadowOpacity.value = withTiming(0.1, { duration: DURATION.fast });
    }

    onPressOut?.(event);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      entranceProgress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    const translateYValue = interpolate(
      entranceProgress.value,
      [0, 1],
      [translateY, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [
        { translateY: translateYValue },
        { scale: scale.value },
      ],
      shadowOpacity: shadowOpacity.value,
    };
  });

  return (
    <AnimatedPressable
      style={[styles.card, style, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || !onPress}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
});

export default AnimatedCard;
