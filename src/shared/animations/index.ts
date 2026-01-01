/**
 * Système d'animations - Style Apple
 * Export centralisé de tous les composants et hooks
 */

// Constantes
export * from './constants';

// Hooks
export { useAnimatedPress } from './hooks/useAnimatedPress';
export type { UseAnimatedPressOptions, UseAnimatedPressReturn } from './hooks/useAnimatedPress';

export { useStaggeredList, useStaggeredItem } from './hooks/useStaggeredList';
export type { UseStaggeredListOptions, UseStaggeredListReturn } from './hooks/useStaggeredList';

// Composants
export { AnimatedPressable } from './components/AnimatedPressable';
export type { AnimatedPressableProps } from './components/AnimatedPressable';

export { AnimatedCard } from './components/AnimatedCard';
export type { AnimatedCardProps } from './components/AnimatedCard';

export { AnimatedButton } from './components/AnimatedButton';
export type { AnimatedButtonProps, ButtonVariant, ButtonSize } from './components/AnimatedButton';

// Lottie - Import séparément pour éviter les problèmes sur web
// import { LottieAnimation, LoadingAnimation, ... } from '@/src/shared/animations/components/LottieAnimation';
// Note: lottie-react-native n'est pas supporté sur web
