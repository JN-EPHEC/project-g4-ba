/**
 * AnimatedPressable - Composant pressable avec animations style Apple
 * Remplace TouchableOpacity avec des animations plus fluides
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useAnimatedPress, UseAnimatedPressOptions } from '../hooks/useAnimatedPress';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  /** Style du composant */
  style?: StyleProp<ViewStyle>;
  /** Options d'animation */
  animationOptions?: UseAnimatedPressOptions;
  /** Contenu du composant */
  children: React.ReactNode;
}

export function AnimatedPressable({
  style,
  animationOptions,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: AnimatedPressableProps) {
  const {
    animatedStyle,
    handlePressIn,
    handlePressOut,
  } = useAnimatedPress({
    ...animationOptions,
    disabled: disabled ?? false,
  });

  const onPressInHandler = useCallback(
    (event: any) => {
      handlePressIn();
      onPressIn?.(event);
    },
    [handlePressIn, onPressIn]
  );

  const onPressOutHandler = useCallback(
    (event: any) => {
      handlePressOut();
      onPressOut?.(event);
    },
    [handlePressOut, onPressOut]
  );

  return (
    <AnimatedPressableComponent
      style={[style, animatedStyle]}
      onPressIn={onPressInHandler}
      onPressOut={onPressOutHandler}
      disabled={disabled}
      {...props}
    >
      {children}
    </AnimatedPressableComponent>
  );
}

export default AnimatedPressable;
