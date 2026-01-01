/**
 * LottieAnimation - Version Web (fallback)
 * lottie-react-native ne supporte pas le web, on affiche un ActivityIndicator
 */

import React, { forwardRef } from 'react';
import { View, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';

export interface LottieAnimationRef {
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export interface LottieAnimationProps {
  source: any;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: StyleProp<ViewStyle>;
  onAnimationFinish?: () => void;
  resizeMode?: 'cover' | 'contain' | 'center';
}

export const LottieAnimation = forwardRef<LottieAnimationRef, LottieAnimationProps>(
  ({ width = 150, height = 150, style }, ref) => {
    return (
      <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
        <ActivityIndicator size="large" color="#E8590C" />
      </View>
    );
  }
);

LottieAnimation.displayName = 'LottieAnimation';

export const LOTTIE_SOURCES = {
  loading: null,
  success: null,
  confetti: null,
  emptyState: null,
};

export function LoadingAnimation({ size = 80, ...props }: any) {
  return <LottieAnimation source={null} width={size} height={size} {...props} />;
}

export function SuccessAnimation({ size = 120, ...props }: any) {
  return <LottieAnimation source={null} width={size} height={size} {...props} />;
}

export function ConfettiAnimation(props: any) {
  return <LottieAnimation source={null} width={300} height={300} {...props} />;
}

export function EmptyStateAnimation({ size = 200, ...props }: any) {
  return <LottieAnimation source={null} width={size} height={size} {...props} />;
}

export default LottieAnimation;
