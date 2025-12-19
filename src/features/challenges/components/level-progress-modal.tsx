import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { LevelDefinition, DEFAULT_LEVELS } from '@/types';
import { LevelService } from '@/services/level-service';

interface LevelProgressModalProps {
  visible: boolean;
  onClose: () => void;
  currentPoints: number;
}

export function LevelProgressModal({
  visible,
  onClose,
  currentPoints,
}: LevelProgressModalProps) {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const overlayColor = useThemeColor({}, 'overlay');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  // Utiliser les niveaux par défaut pour l'affichage
  const levels: LevelDefinition[] = DEFAULT_LEVELS.map((level, index) => ({
    ...level,
    id: `level-${index}`,
    createdAt: new Date(),
  }));

  // Calculer le niveau actuel
  const levelInfo = LevelService.getScoutLevelInfoSync(currentPoints);
  const currentLevelOrder = levelInfo.currentLevel.order;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        <View style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <ThemedText style={styles.headerIcon}>🏆</ThemedText>
              <ThemedText type="title" style={styles.title}>Progression</ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: cardBorderColor }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Current Points */}
          <View style={[styles.pointsCard, { backgroundColor: levelInfo.currentLevel.color }]}>
            <View style={styles.pointsContent}>
              <ThemedText style={styles.currentLevelIcon}>{levelInfo.currentLevel.icon}</ThemedText>
              <View style={styles.pointsInfo}>
                <ThemedText style={styles.currentLevelName}>{levelInfo.currentLevel.name}</ThemedText>
                <ThemedText style={styles.pointsText}>{currentPoints} points</ThemedText>
              </View>
            </View>
            {!levelInfo.isMaxLevel && levelInfo.nextLevel && (
              <View style={styles.nextLevelInfo}>
                <ThemedText style={styles.nextLevelText}>
                  Encore {levelInfo.pointsToNextLevel} pts pour {levelInfo.nextLevel.icon} {levelInfo.nextLevel.name}
                </ThemedText>
                <View style={styles.miniProgressBar}>
                  <View style={[styles.miniProgressFill, { width: `${levelInfo.progress}%` }]} />
                </View>
              </View>
            )}
            {levelInfo.isMaxLevel && (
              <ThemedText style={styles.maxLevelText}>🎉 Niveau maximum atteint !</ThemedText>
            )}
          </View>

          {/* Levels List */}
          <ScrollView style={styles.levelsList} showsVerticalScrollIndicator={false}>
            {levels.map((level, index) => {
              const isCurrentLevel = level.order === currentLevelOrder;
              const isUnlocked = level.order <= currentLevelOrder;
              const isNextLevel = level.order === currentLevelOrder + 1;

              // Calculer la progression pour ce niveau
              let progressInLevel = 0;
              if (isCurrentLevel) {
                progressInLevel = levelInfo.progress;
              } else if (isUnlocked) {
                progressInLevel = 100;
              }

              return (
                <View
                  key={level.id}
                  style={[
                    styles.levelItem,
                    { borderColor: cardBorderColor },
                    isCurrentLevel && { borderColor: level.color, borderWidth: 2 },
                  ]}
                >
                  {/* Level Icon */}
                  <View
                    style={[
                      styles.levelIconContainer,
                      { backgroundColor: isUnlocked ? level.color : cardBorderColor },
                    ]}
                  >
                    <ThemedText style={styles.levelIcon}>
                      {isUnlocked ? level.icon : '🔒'}
                    </ThemedText>
                  </View>

                  {/* Level Info */}
                  <View style={styles.levelInfo}>
                    <View style={styles.levelHeader}>
                      <ThemedText
                        style={[
                          styles.levelName,
                          { color: isUnlocked ? textColor : textSecondary },
                        ]}
                      >
                        {level.name}
                      </ThemedText>
                      {isCurrentLevel && (
                        <View style={[styles.currentBadge, { backgroundColor: level.color }]}>
                          <ThemedText style={styles.currentBadgeText}>Actuel</ThemedText>
                        </View>
                      )}
                      {isNextLevel && (
                        <View style={[styles.nextBadge, { backgroundColor: `${level.color}30` }]}>
                          <ThemedText style={[styles.nextBadgeText, { color: level.color }]}>Suivant</ThemedText>
                        </View>
                      )}
                    </View>

                    {/* Points Range */}
                    <ThemedText style={[styles.pointsRange, { color: textSecondary }]}>
                      {level.maxPoints === -1
                        ? `${level.minPoints}+ pts`
                        : `${level.minPoints} - ${level.maxPoints} pts`}
                    </ThemedText>

                    {/* Progress Bar */}
                    <View style={[styles.progressBarBg, { backgroundColor: cardBorderColor }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${progressInLevel}%`,
                            backgroundColor: level.color,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Checkmark or Progress */}
                  <View style={styles.statusContainer}>
                    {isUnlocked && !isCurrentLevel ? (
                      <View style={[styles.checkCircle, { backgroundColor: level.color }]}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    ) : isCurrentLevel ? (
                      <ThemedText style={[styles.progressPercent, { color: level.color }]}>
                        {Math.round(progressInLevel)}%
                      </ThemedText>
                    ) : (
                      <ThemedText style={[styles.progressPercent, { color: textSecondary }]}>
                        0%
                      </ThemedText>
                    )}
                  </View>
                </View>
              );
            })}
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
    padding: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  pointsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentLevelIcon: {
    fontSize: 40,
  },
  pointsInfo: {
    flex: 1,
  },
  currentLevelName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pointsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  nextLevelInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  nextLevelText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  miniProgressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  maxLevelText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  levelsList: {
    flex: 1,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  levelIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelIcon: {
    fontSize: 24,
  },
  levelInfo: {
    flex: 1,
    gap: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelName: {
    fontSize: 15,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pointsRange: {
    fontSize: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusContainer: {
    width: 40,
    alignItems: 'center',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
});
