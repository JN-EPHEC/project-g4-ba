import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type AvatarProps = {
  imageUrl?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle | ViewStyle[];
};

export function Avatar({ imageUrl, name, size = 'medium', style }: AvatarProps) {
  const backgroundColor = useThemeColor({ light: '#3b82f6', dark: '#60a5fa' }, 'tint');
  const textColor = '#ffffff';

  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 96,
  };

  const fontSizeMap = {
    small: 14,
    medium: 18,
    large: 24,
    xlarge: 36,
  };

  const avatarSize = sizeMap[size];
  const fontSize = fontSizeMap[size];

  const getInitials = (fullName?: string) => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <View
      style={[
        styles.avatar,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
          contentFit="cover"
        />
      ) : (
        <ThemedText
          style={[
            styles.initials,
            {
              fontSize,
              color: textColor,
            },
          ]}
        >
          {getInitials(name)}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  initials: {
    fontWeight: '600',
  },
});
