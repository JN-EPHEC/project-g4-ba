/**
 * AnimatedPressable - Composant pressable avec animations style Apple
 * Remplace TouchableOpacity avec des animations plus fluides
 *
 * Note: Utilise Animated.View wrappé dans Pressable au lieu de
 * Animated.createAnimatedComponent(Pressable) pour éviter le bug
 * "View config getter callback for component `input`"
 */

import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  StyleSheet,
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

// Propriétés de layout qui doivent être sur le Pressable parent
const LAYOUT_PROPS = ['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical', 'position', 'top', 'bottom', 'left', 'right', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight'];

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

  // Séparer les styles de layout (pour Pressable) des styles visuels (pour Animated.View)
  const { pressableStyle, innerStyle } = useMemo(() => {
    const flatStyle = StyleSheet.flatten(style) || {};
    const pressable: ViewStyle = {};
    const inner: ViewStyle = {};

    Object.keys(flatStyle).forEach((key) => {
      if (LAYOUT_PROPS.includes(key)) {
        (pressable as any)[key] = (flatStyle as any)[key];
      } else {
        (inner as any)[key] = (flatStyle as any)[key];
      }
    });

    return { pressableStyle: pressable, innerStyle: inner };
  }, [style]);

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
      style={pressableStyle}
      onPressIn={onPressInHandler}
      onPressOut={onPressOutHandler}
      disabled={disabled}
      {...props}
    >
      <Animated.View style={[innerStyle, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default AnimatedPressable;
