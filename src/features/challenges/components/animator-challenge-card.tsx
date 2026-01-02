import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Challenge, ChallengeCategory } from '@/types';
import { BrandColors, NeutralColors } from '@/constants/theme';

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  nature: { bg: BrandColors.primary[50], text: BrandColors.primary[600] },
  sport: { bg: BrandColors.primary[100], text: BrandColors.primary[700] },
  technique: { bg: BrandColors.accent[50], text: BrandColors.accent[600] },
  cuisine: { bg: BrandColors.accent[100], text: BrandColors.accent[700] },
  aventure: { bg: BrandColors.primary[100], text: BrandColors.primary[700] },
  survie: { bg: BrandColors.accent[100], text: BrandColors.accent[700] },
  securite: { bg: BrandColors.accent[50], text: BrandColors.accent[600] },
  default: { bg: NeutralColors.gray[100], text: NeutralColors.gray[600] },
};

interface AnimatorChallengeCardProps {
  challenge: Challenge;
  totalScouts: number;
  participantsCount: number;
  completedCount: number;
  inProgressCount: number;
  daysRemaining: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}

export function AnimatorChallengeCard({
  challenge,
  totalScouts,
  participantsCount,
  completedCount,
  inProgressCount,
  daysRemaining,
  onPress,
  onEdit,
  onDelete,
  onArchive,
}: AnimatorChallengeCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const categoryKey = challenge.category?.toLowerCase() || 'default';
  const catColors = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.default;

  // Calcul du pourcentage de progression (basé sur les complétés)
  const progressPercent = totalScouts > 0 ? Math.round((completedCount / totalScouts) * 100) : 0;

  const handleMenuAction = (action: () => void) => {
    setMenuVisible(false);
    // Attendre que le modal soit fermé avant d'exécuter l'action
    setTimeout(() => {
      action();
    }, 100);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Row 1: Emoji + Title + Menu */}
      <View style={styles.headerRow}>
        <View style={[styles.emojiContainer, { backgroundColor: catColors.bg }]}>
          <ThemedText style={styles.emoji}>{challenge.emoji || '🎯'}</ThemedText>
        </View>
        <ThemedText style={styles.title} numberOfLines={1}>
          {challenge.title}
        </ThemedText>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Row 2: Category Badge + Points */}
      <View style={styles.badgesRow}>
        <View style={[styles.categoryBadge, { backgroundColor: catColors.bg }]}>
          <ThemedText style={[styles.categoryText, { color: catColors.text }]}>
            {challenge.category || 'autre'}
          </ThemedText>
        </View>
        <ThemedText style={styles.points}>+{challenge.points} pts</ThemedText>
      </View>

      {/* Row 3: Participants */}
      <View style={styles.participantsRow}>
        <Ionicons name="people-outline" size={16} color={textSecondary} />
        <ThemedText style={[styles.participantsText, { color: textSecondary }]}>
          {participantsCount}/{totalScouts} scouts participent
        </ThemedText>
      </View>

      {/* Row 4: Progress Label */}
      <View style={styles.progressLabelRow}>
        <ThemedText style={[styles.progressLabel, { color: textSecondary }]}>
          Progression globale
        </ThemedText>
        <ThemedText style={styles.progressPercent}>{progressPercent}%</ThemedText>
      </View>

      {/* Row 5: Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Row 6: Footer Stats */}
      <View style={styles.footerRow}>
        <View style={styles.footerStat}>
          <Ionicons name="checkmark-circle" size={14} color={BrandColors.primary[500]} />
          <ThemedText style={[styles.footerText, { color: BrandColors.primary[600] }]}>
            {completedCount} complétés
          </ThemedText>
        </View>
        <View style={styles.footerStat}>
          <Ionicons name="time-outline" size={14} color={textSecondary} />
          <ThemedText style={[styles.footerText, { color: textSecondary }]}>
            {inProgressCount} en cours
          </ThemedText>
        </View>
        <View style={styles.footerStat}>
          <Ionicons name="calendar-outline" size={14} color={BrandColors.accent[500]} />
          <ThemedText style={[styles.footerText, { color: BrandColors.accent[600] }]}>
            {daysRemaining} jours
          </ThemedText>
        </View>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[styles.menuContainer, { backgroundColor: cardColor }]}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction(onEdit)}
            >
              <Ionicons name="create-outline" size={20} color={BrandColors.primary[600]} />
              <ThemedText style={styles.menuItemText}>Modifier</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuAction(onArchive)}
            >
              <Ionicons name="archive-outline" size={20} color={NeutralColors.gray[600]} />
              <ThemedText style={styles.menuItemText}>Archiver</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => handleMenuAction(onDelete)}
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
              <ThemedText style={[styles.menuItemText, { color: '#DC2626' }]}>Supprimer</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 24,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  menuButton: {
    padding: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  points: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.accent[500],
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  participantsText: {
    fontSize: 13,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.primary[600],
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: NeutralColors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BrandColors.primary[500],
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuItemDanger: {
    borderTopWidth: 1,
    borderTopColor: NeutralColors.gray[200],
    marginTop: 4,
    paddingTop: 18,
  },
});
