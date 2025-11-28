import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing
} from 'react-native-reanimated';

interface ConfettiProps {
  count?: number;
}

function ConfettiPiece({
  delay,
  duration,
  randomX,
  randomRotation,
  randomColor
}: {
  delay: number;
  duration: number;
  randomX: number;
  randomRotation: number;
  randomColor: string;
}) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    translateY.value = withDelay(
      delay,
      withTiming(600, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    translateX.value = withDelay(
      delay,
      withTiming(randomX, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    rotate.value = withDelay(
      delay,
      withTiming(randomRotation, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    scale.value = withDelay(
      delay,
      withTiming(0.5, { duration, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: randomColor,
          left: `${Math.random() * 100}%`,
        },
        animatedStyle,
      ]}
    />
  );
}

export function Confetti({ count = 50 }: ConfettiProps) {
  const confettiPieces = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {confettiPieces.map((i) => {
        const randomX = Math.random() * 400 - 200;
        const randomRotation = Math.random() * 720 - 360;
        const randomDelay = Math.random() * 300;
        const randomDuration = 2000 + Math.random() * 1000;
        const randomColor = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'][
          Math.floor(Math.random() * 8)
        ];

        return (
          <ConfettiPiece
            key={i}
            delay={randomDelay}
            duration={randomDuration}
            randomX={randomX}
            randomRotation={randomRotation}
            randomColor={randomColor}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    top: 0,
  },
});
