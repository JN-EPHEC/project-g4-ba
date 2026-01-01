/**
 * Hook pour les animations de liste en cascade (stagger)
 * Fait apparaître les éléments un par un avec un délai
 */

import { useCallback, useEffect, useMemo } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { DURATION, STAGGER, TRANSLATE, EASING, SPRING_CONFIG } from '../constants';

export interface UseStaggeredListOptions {
  /** Nombre total d'items dans la liste */
  itemCount: number;
  /** Délai entre chaque item (default: 50ms) */
  staggerDelay?: number;
  /** Distance de translation Y pour l'entrée (default: 16) */
  translateY?: number;
  /** Durée de l'animation de chaque item (default: 250ms) */
  duration?: number;
  /** Utiliser un ressort au lieu d'un timing */
  useSpring?: boolean;
  /** Délai initial avant de commencer les animations */
  initialDelay?: number;
  /** Animation activée */
  enabled?: boolean;
}

export interface UseStaggeredItemOptions {
  /** Index de l'item dans la liste */
  index: number;
}

export interface UseStaggeredListReturn {
  /** Fonction pour obtenir le style animé d'un item */
  getItemStyle: (index: number) => ReturnType<typeof useAnimatedStyle>;
  /** Déclencher l'animation */
  animate: () => void;
  /** Réinitialiser l'animation */
  reset: () => void;
  /** Valeur d'animation globale */
  progress: ReturnType<typeof useSharedValue<number>>;
}

export function useStaggeredList(
  options: UseStaggeredListOptions
): UseStaggeredListReturn {
  const {
    itemCount,
    staggerDelay = STAGGER.normal,
    translateY = TRANSLATE.normal,
    duration = DURATION.normal,
    useSpring: useSpringAnim = false,
    initialDelay = 0,
    enabled = true,
  } = options;

  const progress = useSharedValue(0);

  const animate = useCallback(() => {
    if (!enabled) return;

    progress.value = 0;
    progress.value = withDelay(
      initialDelay,
      useSpringAnim
        ? withSpring(1, SPRING_CONFIG.gentle)
        : withTiming(1, {
            duration: duration + staggerDelay * itemCount,
            easing: EASING.easeOut,
          })
    );
  }, [enabled, initialDelay, useSpringAnim, duration, staggerDelay, itemCount, progress]);

  const reset = useCallback(() => {
    progress.value = 0;
  }, [progress]);

  // Déclencher l'animation au montage
  useEffect(() => {
    if (enabled && itemCount > 0) {
      animate();
    }
  }, [enabled, itemCount, animate]);

  const getItemStyle = useCallback(
    (index: number) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useAnimatedStyle(() => {
        // Calculer le progrès pour cet item spécifique
        const itemDelay = index * staggerDelay;
        const totalDuration = duration + staggerDelay * (itemCount - 1);
        const itemStart = itemDelay / totalDuration;
        const itemEnd = (itemDelay + duration) / totalDuration;

        const itemProgress = interpolate(
          progress.value,
          [itemStart, itemEnd],
          [0, 1],
          Extrapolation.CLAMP
        );

        const translateYValue = interpolate(
          itemProgress,
          [0, 1],
          [translateY, 0],
          Extrapolation.CLAMP
        );

        const opacityValue = interpolate(
          itemProgress,
          [0, 1],
          [0, 1],
          Extrapolation.CLAMP
        );

        return {
          opacity: opacityValue,
          transform: [{ translateY: translateYValue }],
        };
      });
    },
    [progress, staggerDelay, duration, itemCount, translateY]
  );

  return {
    getItemStyle,
    animate,
    reset,
    progress,
  };
}

/**
 * Hook simplifié pour un seul item dans une liste staggered
 */
export function useStaggeredItem(
  index: number,
  options: Omit<UseStaggeredListOptions, 'itemCount'> & { totalItems: number }
): ReturnType<typeof useAnimatedStyle> {
  const {
    totalItems,
    staggerDelay = STAGGER.normal,
    translateY = TRANSLATE.normal,
    duration = DURATION.normal,
    initialDelay = 0,
    enabled = true,
  } = options;

  const opacity = useSharedValue(0);
  const translate = useSharedValue(translateY);

  useEffect(() => {
    if (!enabled) return;

    const delay = initialDelay + index * staggerDelay;

    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: EASING.easeOut })
    );

    translate.value = withDelay(
      delay,
      withTiming(0, { duration, easing: EASING.easeOut })
    );
  }, [enabled, index, staggerDelay, initialDelay, duration, translateY, opacity, translate]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));
}

export default useStaggeredList;
