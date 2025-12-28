import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';

interface MessageActionsProps {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  onLikePress: () => void;
  onCommentPress: () => void;
  showComments: boolean;
}

export function MessageActions({
  likesCount,
  commentsCount,
  isLiked,
  onLikePress,
  onCommentPress,
  showComments,
}: MessageActionsProps) {
  const textSecondary = useThemeColor({}, 'textSecondary');
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleLikePress = () => {
    // Animation de rebond
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onLikePress();
  };

  return (
    <View style={styles.container}>
      {/* Like Button */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleLikePress}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? BrandColors.accent[500] : textSecondary}
          />
        </Animated.View>
        {likesCount > 0 && (
          <ThemedText
            style={[
              styles.actionCount,
              { color: isLiked ? BrandColors.accent[500] : textSecondary },
            ]}
          >
            {likesCount}
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* Comment Button */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={onCommentPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={showComments ? 'chatbubble' : 'chatbubble-outline'}
          size={18}
          color={showComments ? BrandColors.primary[500] : textSecondary}
        />
        {commentsCount > 0 && (
          <ThemedText
            style={[
              styles.actionCount,
              { color: showComments ? BrandColors.primary[500] : textSecondary },
            ]}
          >
            {commentsCount}
          </ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '600',
  },
});
