import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';

export interface WidgetCardProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  onHeaderPress?: () => void;
  badge?: number | string;
  showSeeAll?: boolean;
  seeAllText?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}

export function WidgetCard({
  title,
  icon,
  iconColor = '#3b82f6',
  onPress,
  onHeaderPress,
  badge,
  showSeeAll = false,
  seeAllText = 'Voir tout',
  children,
  style,
  delay = 0,
}: WidgetCardProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay)}>
      <Container
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.header}
          onPress={onHeaderPress}
          disabled={!onHeaderPress && !showSeeAll}
          activeOpacity={0.7}
        >
          <View style={styles.titleRow}>
            {icon && (
              <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
                <Ionicons name={icon} size={18} color={iconColor} />
              </View>
            )}
            <ThemedText style={styles.title}>{title}</ThemedText>
            {badge !== undefined && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{badge}</ThemedText>
              </View>
            )}
          </View>
          {showSeeAll && (
            <View style={styles.seeAllRow}>
              <ThemedText style={styles.seeAllText}>{seeAllText}</ThemedText>
              <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
            </View>
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </Container>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  content: {},
});
