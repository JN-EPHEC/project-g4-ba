/**
 * LottieAnimation - Wrapper pour les animations Lottie
 * Simplifie l'utilisation des animations Lottie dans l'app
 * Note: Sur web, affiche un fallback car lottie-react-native ne supporte pas web
 */

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Platform, View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';

// Import conditionnel pour éviter l'erreur sur web
let LottieView: any = null;
if (Platform.OS !== 'web') {
  LottieView = require('lottie-react-native').default;
}

export interface LottieAnimationRef {
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export interface LottieAnimationProps {
  /** Source de l'animation (require ou URL) */
  source: any;
  /** Largeur de l'animation */
  width?: number;
  /** Hauteur de l'animation */
  height?: number;
  /** Lecture automatique (default: true) */
  autoPlay?: boolean;
  /** Boucle (default: true) */
  loop?: boolean;
  /** Vitesse de lecture (default: 1) */
  speed?: number;
  /** Style personnalisé */
  style?: StyleProp<ViewStyle>;
  /** Callback à la fin de l'animation */
  onAnimationFinish?: () => void;
  /** Redimensionnement (default: 'contain') */
  resizeMode?: 'cover' | 'contain' | 'center';
}

export const LottieAnimation = forwardRef<LottieAnimationRef, LottieAnimationProps>(
  (
    {
      source,
      width = 150,
      height = 150,
      autoPlay = true,
      loop = true,
      speed = 1,
      style,
      onAnimationFinish,
      resizeMode = 'contain',
    },
    ref
  ) => {
    const lottieRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      play: () => lottieRef.current?.play?.(),
      pause: () => lottieRef.current?.pause?.(),
      reset: () => lottieRef.current?.reset?.(),
    }));

    // Fallback pour web
    if (Platform.OS === 'web' || !LottieView) {
      return (
        <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
          <ActivityIndicator size="large" color="#E8590C" />
        </View>
      );
    }

    return (
      <LottieView
        ref={lottieRef}
        source={source}
        style={[{ width, height }, style]}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        resizeMode={resizeMode}
        onAnimationFinish={onAnimationFinish}
      />
    );
  }
);

LottieAnimation.displayName = 'LottieAnimation';

/**
 * Animations prédéfinies disponibles dans l'app
 * Note: Les requires sont lazy-loaded pour éviter les erreurs sur web
 */
export const LOTTIE_SOURCES = {
  get loading() {
    return Platform.OS !== 'web' ? require('@/assets/animations/loading.json') : null;
  },
  get success() {
    return Platform.OS !== 'web' ? require('@/assets/animations/success.json') : null;
  },
  get confetti() {
    return Platform.OS !== 'web' ? require('@/assets/animations/confetti.json') : null;
  },
  get emptyState() {
    return Platform.OS !== 'web' ? require('@/assets/animations/empty-state.json') : null;
  },
};

/**
 * Composants spécialisés pour les cas d'usage courants
 */

export function LoadingAnimation({
  size = 80,
  ...props
}: Omit<LottieAnimationProps, 'source'> & { size?: number }) {
  return (
    <LottieAnimation
      source={LOTTIE_SOURCES.loading}
      width={size}
      height={size}
      {...props}
    />
  );
}

export function SuccessAnimation({
  size = 120,
  onComplete,
  ...props
}: Omit<LottieAnimationProps, 'source' | 'loop'> & {
  size?: number;
  onComplete?: () => void;
}) {
  return (
    <LottieAnimation
      source={LOTTIE_SOURCES.success}
      width={size}
      height={size}
      loop={false}
      onAnimationFinish={onComplete}
      {...props}
    />
  );
}

export function ConfettiAnimation({
  onComplete,
  ...props
}: Omit<LottieAnimationProps, 'source' | 'loop'> & {
  onComplete?: () => void;
}) {
  return (
    <LottieAnimation
      source={LOTTIE_SOURCES.confetti}
      width={300}
      height={300}
      loop={false}
      onAnimationFinish={onComplete}
      {...props}
    />
  );
}

export function EmptyStateAnimation({
  size = 200,
  ...props
}: Omit<LottieAnimationProps, 'source'> & { size?: number }) {
  return (
    <LottieAnimation
      source={LOTTIE_SOURCES.emptyState}
      width={size}
      height={size}
      {...props}
    />
  );
}

export default LottieAnimation;
