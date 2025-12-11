import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import type { StorageFolder } from '@/src/shared/types/document';
import { FolderCategory, FOLDER_LABELS } from '@/src/shared/types/document';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/design-tokens';

// Couleurs par catégorie
const CATEGORY_COLORS: Record<FolderCategory, { icon: string; badge: string; badgeBg: string }> = {
  [FolderCategory.ADMINISTRATIVE]: {
    icon: BrandColors.primary[500],
    badge: BrandColors.primary[600],
    badgeBg: `${BrandColors.primary[500]}15`,
  },
  [FolderCategory.ACTIVITIES]: {
    icon: BrandColors.accent[500],
    badge: BrandColors.accent[600],
    badgeBg: `${BrandColors.accent[500]}15`,
  },
  [FolderCategory.PHOTOS]: {
    icon: BrandColors.accent[400],
    badge: BrandColors.accent[500],
    badgeBg: `${BrandColors.accent[500]}15`,
  },
  [FolderCategory.PLANNING]: {
    icon: BrandColors.primary[400],
    badge: BrandColors.primary[500],
    badgeBg: `${BrandColors.primary[500]}15`,
  },
  [FolderCategory.RESOURCES]: {
    icon: BrandColors.secondary[500],
    badge: BrandColors.secondary[600],
    badgeBg: `${BrandColors.secondary[500]}15`,
  },
  [FolderCategory.OTHER]: {
    icon: NeutralColors.gray[500],
    badge: NeutralColors.gray[600],
    badgeBg: `${NeutralColors.gray[500]}15`,
  },
};

export interface FolderCardProps {
  folder: StorageFolder;
  fileCount?: number;
  onPress: () => void;
  onLongPress?: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
  onMenuPress?: () => void;
}

export function FolderCard({
  folder,
  fileCount,
  onPress,
  onLongPress,
  canDelete,
  onDelete,
  onMenuPress
}: FolderCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const categoryColors = CATEGORY_COLORS[folder.category] || CATEGORY_COLORS[FolderCategory.OTHER];

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else if (canDelete && onDelete) {
      // Sur web, utiliser window.confirm, sur mobile utiliser Alert
      if (Platform.OS === 'web') {
        setShowMenu(true);
      } else {
        Alert.alert(
          'Options du dossier',
          `Que souhaitez-vous faire avec "${folder.name}" ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: onDelete,
            },
          ]
        );
      }
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardColor,
          borderColor: cardBorder,
        }
      ]}
    >
      {/* Zone cliquable principale (ouvre le dossier) */}
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        style={styles.mainContent}
      >
        {/* Icône du dossier */}
        <View style={[styles.iconContainer, { backgroundColor: `${categoryColors.icon}15` }]}>
          <Ionicons name="folder" size={28} color={categoryColors.icon} />
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          <ThemedText style={[styles.name, { color: textColor }]} numberOfLines={1}>
            {folder.name}
          </ThemedText>

          {folder.description && (
            <ThemedText style={[styles.description, { color: textSecondary }]} numberOfLines={1}>
              {folder.description}
            </ThemedText>
          )}

          <View style={styles.meta}>
            {/* Badge catégorie */}
            <View style={[styles.categoryBadge, { backgroundColor: categoryColors.badgeBg }]}>
              <ThemedText style={[styles.categoryText, { color: categoryColors.badge }]}>
                {FOLDER_LABELS[folder.category]}
              </ThemedText>
            </View>

            {/* Nombre de fichiers */}
            {fileCount !== undefined && (
              <View style={styles.fileCountContainer}>
                <Ionicons name="document-outline" size={14} color={textSecondary} />
                <ThemedText style={[styles.fileCount, { color: textSecondary }]}>
                  {fileCount}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Bouton menu (zone séparée) */}
      {(canDelete || onMenuPress) && (
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: `${textSecondary}10` }]}
          onPress={handleMenuPress}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={textSecondary} />
        </TouchableOpacity>
      )}

      {/* Modal de confirmation pour le web */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>
              Options du dossier
            </ThemedText>
            <ThemedText style={[styles.modalMessage, { color: textSecondary }]}>
              Que souhaitez-vous faire avec "{folder.name}" ?
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMenu(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <ThemedText style={styles.deleteButtonText}>Supprimer</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fileCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fileCount: {
    fontSize: 12,
  },
  menuButton: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginLeft: Spacing.xs,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: NeutralColors.gray[200],
  },
  cancelButtonText: {
    color: NeutralColors.gray[700],
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
