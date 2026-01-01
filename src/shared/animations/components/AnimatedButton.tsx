/**
 * AnimatedButton - Bouton avec animations style Apple
 * Scale au press avec feedback haptique
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SPRING_CONFIG, SCALE } from '../constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface AnimatedButtonProps {
  /** Texte du bouton */
  title: string;
  /** Action au press */
  onPress: () => void;
  /** Variante du bouton */
  variant?: ButtonVariant;
  /** Taille du bouton */
  size?: ButtonSize;
  /** Désactivé */
  disabled?: boolean;
  /** En chargement */
  loading?: boolean;
  /** Style personnalisé du container */
  style?: StyleProp<ViewStyle>;
  /** Style personnalisé du texte */
  textStyle?: StyleProp<TextStyle>;
  /** Icône à gauche */
  leftIcon?: React.ReactNode;
  /** Icône à droite */
  rightIcon?: React.ReactNode;
  /** Prend toute la largeur */
  fullWidth?: boolean;
  /** Activer le haptic feedback (default: true) */
  hapticEnabled?: boolean;
}

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
  hapticEnabled = true,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticEnabled]);

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    scale.value = withSpring(SCALE.buttonPressed, SPRING_CONFIG.snappy);
    runOnJS(triggerHaptic)();
  }, [disabled, loading, scale, triggerHaptic]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;
    scale.value = withSpring(1, SPRING_CONFIG.apple);
  }, [disabled, loading, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonStyles = getButtonStyles(variant, size, disabled, fullWidth);
  const textStyles = getTextStyles(variant, size, disabled);

  return (
    <AnimatedPressable
      style={[buttonStyles, style, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : '#E8590C'}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[textStyles, textStyle]}>{title}</Text>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
}

function getButtonStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  fullWidth: boolean
): ViewStyle {
  const baseStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth && { width: '100%' }),
  };

  // Tailles
  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    small: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    medium: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
    large: { paddingHorizontal: 24, paddingVertical: 18, borderRadius: 16 },
  };

  // Variantes
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: '#E8590C',
    },
    secondary: {
      backgroundColor: '#FFF4ED',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: '#E8590C',
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
}

function getTextStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean
): TextStyle {
  const baseStyle: TextStyle = {
    fontWeight: '600',
  };

  // Tailles de texte
  const sizeStyles: Record<ButtonSize, TextStyle> = {
    small: { fontSize: 14 },
    medium: { fontSize: 16 },
    large: { fontSize: 18 },
  };

  // Couleurs selon variante
  const variantStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: '#FFFFFF' },
    secondary: { color: '#E8590C' },
    outline: { color: '#E8590C' },
    ghost: { color: '#E8590C' },
  };

  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
}

export default AnimatedButton;
