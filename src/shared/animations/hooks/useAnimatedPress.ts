/**
 * Hook pour les interactions tactiles animées
 * Gère le scale, l'opacité et le feedback haptique
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DURATION, SCALE, OPACITY, SPRING_CONFIG, EASING } from '../constants';

export interface UseAnimatedPressOptions {
  /** Valeur de scale au press (default: 0.98) */
  scaleValue?: number;
  /** Valeur d'opacité au press (default: 1) */
  opacityValue?: number;
  /** Activer le feedback haptique (default: true) */
  hapticEnabled?: boolean;
  /** Type de feedback haptique */
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
  /** Utiliser un ressort au lieu d'un timing (default: true) */
  useSpring?: boolean;
  /** Durée de l'animation si timing (default: 150ms) */
  duration?: number;
  /** Désactivé */
  disabled?: boolean;
}

export interface UseAnimatedPressReturn {
  /** Style animé à appliquer au composant */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /** Handler pour onPressIn */
  handlePressIn: () => void;
  /** Handler pour onPressOut */
  handlePressOut: () => void;
  /** Valeur partagée du scale */
  scale: ReturnType<typeof useSharedValue<number>>;
  /** Valeur partagée de l'opacité */
  opacity: ReturnType<typeof useSharedValue<number>>;
}

export function useAnimatedPress(
  options: UseAnimatedPressOptions = {}
): UseAnimatedPressReturn {
  const {
    scaleValue = SCALE.pressed,
    opacityValue = 1,
    hapticEnabled = true,
    hapticType = 'light',
    useSpring: useSpringAnim = true,
    duration = DURATION.fast,
    disabled = false,
  } = options;

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (!hapticEnabled) return;

    switch (hapticType) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        Haptics.selectionAsync();
        break;
    }
  }, [hapticEnabled, hapticType]);

  const handlePressIn = useCallback(() => {
    if (disabled) return;

    if (useSpringAnim) {
      scale.value = withSpring(scaleValue, SPRING_CONFIG.snappy);
    } else {
      scale.value = withTiming(scaleValue, {
        duration,
        easing: EASING.easeOut,
      });
    }

    if (opacityValue !== 1) {
      opacity.value = withTiming(opacityValue, {
        duration,
        easing: EASING.easeOut,
      });
    }

    runOnJS(triggerHaptic)();
  }, [disabled, useSpringAnim, scaleValue, opacityValue, duration, triggerHaptic, scale, opacity]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    if (useSpringAnim) {
      scale.value = withSpring(1, SPRING_CONFIG.apple);
    } else {
      scale.value = withTiming(1, {
        duration,
        easing: EASING.easeOut,
      });
    }

    if (opacityValue !== 1) {
      opacity.value = withTiming(1, {
        duration,
        easing: EASING.easeOut,
      });
    }
  }, [disabled, useSpringAnim, opacityValue, duration, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
    scale,
    opacity,
  };
}

export default useAnimatedPress;
