import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';

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
  variant?: 'default' | 'filled'; // filled = fond coloré comme météo
}

export function WidgetCard({
  title,
  icon,
  iconColor = BrandColors.primary[500],
  onPress,
  onHeaderPress,
  badge,
  showSeeAll = false,
  seeAllText = 'Voir tout',
  children,
  style,
  delay = 0,
  variant = 'default',
}: WidgetCardProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const Container = onPress ? TouchableOpacity : View;

  const isFilled = variant === 'filled';

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay)}>
      <Container
        style={[
          styles.card,
          {
            backgroundColor: isFilled ? iconColor : cardColor,
            borderColor: isFilled ? 'transparent' : cardBorder,
            borderWidth: isFilled ? 0 : 1,
          },
          style,
        ]}
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
              <View style={[
                styles.iconContainer,
                { backgroundColor: isFilled ? 'rgba(255,255,255,0.2)' : `${iconColor}15` }
              ]}>
                <Ionicons name={icon} size={18} color={isFilled ? '#FFFFFF' : iconColor} />
              </View>
            )}
            <ThemedText style={[
              styles.title,
              { color: isFilled ? '#FFFFFF' : textColor }
            ]}>
              {title}
            </ThemedText>
            {badge !== undefined && (
              <View style={[styles.badge, { backgroundColor: BrandColors.accent[500] }]}>
                <ThemedText style={styles.badgeText}>{badge}</ThemedText>
              </View>
            )}
          </View>
          {showSeeAll && (
            <View style={styles.seeAllRow}>
              <ThemedText style={[
                styles.seeAllText,
                { color: isFilled ? 'rgba(255,255,255,0.8)' : textSecondary }
              ]}>
                {seeAllText}
              </ThemedText>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isFilled ? 'rgba(255,255,255,0.8)' : textSecondary}
              />
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
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
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
    gap: Spacing.xs,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {},
});
