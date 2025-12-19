import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useNotifications } from '@/context/notification-context';
import { BrandColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  type: 'challenge' | 'scout' | 'event' | 'message';
  title: string;
  description: string;
  icon: string;
  color: string;
  route?: string;
  count?: number;
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { pendingChallengesCount, pendingScoutsCount } = useNotifications();

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const overlayColor = useThemeColor({}, 'overlay');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Construire la liste des notifications
  const notifications: NotificationItem[] = [];

  if (pendingChallengesCount > 0) {
    notifications.push({
      id: 'challenges',
      type: 'challenge',
      title: 'Défis à valider',
      description: `${pendingChallengesCount} soumission${pendingChallengesCount > 1 ? 's' : ''} en attente de validation`,
      icon: '🎯',
      color: BrandColors.accent[500],
      route: '/(animator)/validate-challenges',
      count: pendingChallengesCount,
    });
  }

  if (pendingScoutsCount > 0) {
    notifications.push({
      id: 'scouts',
      type: 'scout',
      title: 'Scouts à valider',
      description: `${pendingScoutsCount} nouveau${pendingScoutsCount > 1 ? 'x' : ''} scout${pendingScoutsCount > 1 ? 's' : ''} en attente`,
      icon: '👤',
      color: BrandColors.primary[500],
      route: '/(animator)/validate-scouts',
      count: pendingScoutsCount,
    });
  }

  const totalCount = pendingChallengesCount + pendingScoutsCount;

  const handleNotificationPress = (notification: NotificationItem) => {
    onClose();
    if (notification.route) {
      router.push(notification.route as any);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <ThemedText style={styles.headerIcon}>🔔</ThemedText>
              <ThemedText type="title" style={[styles.title, { color: textColor }]}>
                Notifications
              </ThemedText>
              {totalCount > 0 && (
                <View style={[styles.countBadge, { backgroundColor: BrandColors.accent[500] }]}>
                  <ThemedText style={styles.countBadgeText}>{totalCount}</ThemedText>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: cardBorder }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyIcon}>✨</ThemedText>
                <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                  Tout est à jour !
                </ThemedText>
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  Aucune notification en attente
                </ThemedText>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    { backgroundColor: `${notification.color}10`, borderColor: `${notification.color}30` }
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notificationIcon, { backgroundColor: `${notification.color}20` }]}>
                    <ThemedText style={styles.notificationEmoji}>{notification.icon}</ThemedText>
                  </View>
                  <View style={styles.notificationContent}>
                    <ThemedText style={[styles.notificationTitle, { color: textColor }]}>
                      {notification.title}
                    </ThemedText>
                    <ThemedText style={[styles.notificationDesc, { color: textSecondary }]}>
                      {notification.description}
                    </ThemedText>
                  </View>
                  {notification.count && (
                    <View style={[styles.notificationBadge, { backgroundColor: notification.color }]}>
                      <ThemedText style={styles.notificationBadgeText}>{notification.count}</ThemedText>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={textSecondary} />
                </TouchableOpacity>
              ))
            )}

            {/* Actions rapides */}
            <View style={styles.quickActions}>
              <ThemedText style={[styles.quickActionsTitle, { color: textSecondary }]}>
                ACTIONS RAPIDES
              </ThemedText>

              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: cardBorder }]}
                onPress={() => {
                  onClose();
                  router.push('/(animator)/validate-challenges');
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="checkmark-circle-outline" size={22} color={BrandColors.primary[500]} />
                </View>
                <ThemedText style={[styles.quickActionText, { color: textColor }]}>
                  Valider les défis
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color={textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: cardBorder }]}
                onPress={() => {
                  onClose();
                  router.push('/(animator)/validate-scouts');
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="person-add-outline" size={22} color={BrandColors.primary[500]} />
                </View>
                <ThemedText style={[styles.quickActionText, { color: textColor }]}>
                  Valider les scouts
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color={textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickActionCard, { backgroundColor: cardBorder }]}
                onPress={() => {
                  onClose();
                  router.push('/(animator)/messages');
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="chatbubbles-outline" size={22} color={BrandColors.primary[500]} />
                </View>
                <ThemedText style={[styles.quickActionText, { color: textColor }]}>
                  Voir les messages
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color={textSecondary} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    maxHeight: '80%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationEmoji: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 13,
  },
  notificationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  notificationBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActions: {
    marginTop: Spacing.xl,
  },
  quickActionsTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 90, 61, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
