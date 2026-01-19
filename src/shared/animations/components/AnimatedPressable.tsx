/**
 * AnimatedPressable - Composant pressable avec animations style Apple
 * Remplace TouchableOpacity avec des animations plus fluides
 *
 * Note: Utilise Animated.View wrappé dans Pressable au lieu de
 * Animated.createAnimatedComponent(Pressable) pour éviter le bug
 * "View config getter callback for component `input`"
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
    <Pressable
      onPressIn={onPressInHandler}
      onPressOut={onPressOutHandler}
      disabled={disabled}
      {...props}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default AnimatedPressable;
