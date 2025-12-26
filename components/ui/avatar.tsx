import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { BrandColors } from '@/constants/theme';

// Palette de couleurs pour les avatars
const AVATAR_COLORS = [
  BrandColors.primary[500],   // Vert
  BrandColors.accent[500],    // Orange
  BrandColors.secondary[500], // Bleu-vert
  '#8B5CF6',                  // Violet
  '#EC4899',                  // Rose
  '#06B6D4',                  // Cyan
  '#F59E0B',                  // Ambre
  '#10B981',                  // Émeraude
];

// Génère une couleur consistante basée sur le nom
function getAvatarColor(name?: string): string {
  if (!name) return AVATAR_COLORS[0];

  // Hash simple du nom pour obtenir un index constant
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export type AvatarProps = {
  imageUrl?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle | ViewStyle[];
};

export function Avatar({ imageUrl, name, size = 'medium', style }: AvatarProps) {
  const backgroundColor = getAvatarColor(name);
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
          key={imageUrl}
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
