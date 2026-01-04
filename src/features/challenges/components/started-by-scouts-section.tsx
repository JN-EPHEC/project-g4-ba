import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Challenge, ChallengeSubmission, Scout } from '@/types';
import { ChallengeSubmissionService } from '@/services/challenge-submission-service';
import { UserService } from '@/services/user-service';
import { useAuth } from '@/context/auth-context';

interface StartedSubmissionWithInfo {
  submission: ChallengeSubmission;
  challenge?: Challenge;
  scout?: Scout;
}

interface StartedByScoutsSectionProps {
  challenges: Challenge[];
  onScoutPress?: (scoutId: string) => void;
  onChallengePress?: (challenge: Challenge) => void;
  onEditChallenge?: (challenge: Challenge) => void;
}

export function StartedByScoutsSection({
  challenges,
  onScoutPress,
  onChallengePress,
  onEditChallenge,
}: StartedByScoutsSectionProps) {
  const { user } = useAuth();
  const [startedSubmissions, setStartedSubmissions] = useState<StartedSubmissionWithInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StartedSubmissionWithInfo | null>(null);

  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textSecondary = useThemeColor({}, 'textSecondary');

  useEffect(() => {
    loadStartedSubmissions();
  }, [user, challenges]);

  const loadStartedSubmissions = async () => {
    if (!user || !('unitId' in user)) return;

    try {
      setLoading(true);
      const submissions = await ChallengeSubmissionService.getStartedSubmissions(user.unitId);

      // Enrichir avec les infos du défi et du scout
      const enrichedSubmissions: StartedSubmissionWithInfo[] = await Promise.all(
        submissions.map(async (submission) => {
          const challenge = challenges.find((c) => c.id === submission.challengeId);
          let scout: Scout | undefined;

          try {
            const userData = await UserService.getUserById(submission.scoutId);
            if (userData && 'unitId' in userData) {
              scout = userData as Scout;
            }
          } catch (error) {
            console.error('Error loading scout:', error);
          }

          return {
            submission,
            challenge,
            scout,
          };
        })
      );

      setStartedSubmissions(enrichedSubmissions);
    } catch (error) {
      console.error('Error loading started submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `Il y a ${diffDays}j`;
    } else if (diffHours > 0) {
      return `Il y a ${diffHours}h`;
    } else if (diffMinutes > 0) {
      return `Il y a ${diffMinutes}min`;
    } else {
      return 'À l\'instant';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={BrandColors.accent[500]} />
          <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
            Chargement...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (startedSubmissions.length === 0) {
    return null;
  }

  const displayedSubmissions = expanded ? startedSubmissions : startedSubmissions.slice(0, 3);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: BrandColors.accent[100] }]}>
            <Ionicons name="play-circle" size={18} color={BrandColors.accent[600]} />
          </View>
          <ThemedText type="subtitle" style={styles.title}>
            Défis commencés
          </ThemedText>
        </View>
        <View style={[styles.countBadge, { backgroundColor: BrandColors.accent[500] }]}>
          <ThemedText style={styles.countText}>{startedSubmissions.length}</ThemedText>
        </View>
      </View>

      <View style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
        {displayedSubmissions.map(({ submission, challenge, scout }, index) => (
          <View key={submission.id}>
            {index > 0 && <View style={[styles.divider, { backgroundColor: cardBorderColor }]} />}
            <TouchableOpacity
              style={styles.row}
              onPress={() => setSelectedItem({ submission, challenge, scout })}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => scout && onScoutPress?.(scout.id)}
              >
                {scout?.profilePicture ? (
                  <Image source={{ uri: scout.profilePicture }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: BrandColors.primary[100] }]}>
                    <ThemedText style={styles.avatarInitial}>
                      {scout?.firstName?.charAt(0) || '?'}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>

              {/* Info */}
              <View style={styles.info}>
                <ThemedText style={styles.scoutName} numberOfLines={1}>
                  {scout ? `${scout.firstName} ${scout.lastName?.charAt(0) || ''}.` : 'Scout inconnu'}
                </ThemedText>
                <View style={styles.challengeRow}>
                  <ThemedText style={styles.challengeEmoji}>
                    {challenge?.emoji || '🎯'}
                  </ThemedText>
                  <ThemedText style={[styles.challengeTitle, { color: textSecondary }]} numberOfLines={1}>
                    {challenge?.title || 'Défi inconnu'}
                  </ThemedText>
                </View>
              </View>

              {/* Time and arrow */}
              <View style={styles.rightSection}>
                {submission.startedAt && (
                  <ThemedText style={[styles.timeAgo, { color: textSecondary }]}>
                    {formatTimeAgo(submission.startedAt)}
                  </ThemedText>
                )}
                <Ionicons name="chevron-forward" size={16} color={textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        ))}

        {startedSubmissions.length > 3 && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setExpanded(!expanded)}
          >
            <ThemedText style={[styles.showMoreText, { color: BrandColors.primary[600] }]}>
              {expanded ? 'Voir moins' : `Voir tout (${startedSubmissions.length})`}
            </ThemedText>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={BrandColors.primary[600]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Context Menu Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedItem(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setSelectedItem(null)}
        >
          <View style={[styles.menuContent, { backgroundColor: cardColor }]}>
            {selectedItem && (
              <>
                <View style={styles.menuHeader}>
                  <ThemedText style={styles.menuTitle}>
                    {selectedItem.scout
                      ? `${selectedItem.scout.firstName} ${selectedItem.scout.lastName?.charAt(0) || ''}.`
                      : 'Scout inconnu'}
                  </ThemedText>
                  <ThemedText style={[styles.menuSubtitle, { color: textSecondary }]}>
                    {selectedItem.challenge?.emoji || '🎯'} {selectedItem.challenge?.title || 'Défi inconnu'}
                  </ThemedText>
                </View>

                {/* Voir le profil du scout */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setSelectedItem(null);
                    if (selectedItem.scout) {
                      onScoutPress?.(selectedItem.scout.id);
                    }
                  }}
                >
                  <Ionicons name="person-outline" size={20} color={BrandColors.primary[600]} />
                  <ThemedText style={styles.menuItemText}>Voir le profil du scout</ThemedText>
                </TouchableOpacity>

                {/* Voir les détails du défi */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setSelectedItem(null);
                    if (selectedItem.challenge) {
                      onChallengePress?.(selectedItem.challenge);
                    }
                  }}
                >
                  <Ionicons name="eye-outline" size={20} color={BrandColors.primary[600]} />
                  <ThemedText style={styles.menuItemText}>Voir les détails du défi</ThemedText>
                </TouchableOpacity>

                {/* Modifier le défi */}
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setSelectedItem(null);
                    if (selectedItem.challenge) {
                      onEditChallenge?.(selectedItem.challenge);
                    }
                  }}
                >
                  <Ionicons name="create-outline" size={20} color={BrandColors.accent[600]} />
                  <ThemedText style={[styles.menuItemText, { color: BrandColors.accent[600] }]}>
                    Modifier le défi
                  </ThemedText>
                </TouchableOpacity>

                <View style={[styles.menuDivider, { backgroundColor: cardBorderColor }]} />

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuCancelItem]}
                  onPress={() => setSelectedItem(null)}
                >
                  <ThemedText style={styles.menuCancelText}>Annuler</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  avatarContainer: {},
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.primary[600],
  },
  info: {
    flex: 1,
    gap: 4,
  },
  scoutName: {
    fontSize: 15,
    fontWeight: '600',
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challengeEmoji: {
    fontSize: 14,
  },
  challengeTitle: {
    fontSize: 13,
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAgo: {
    fontSize: 12,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  menuHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 4,
  },
  menuCancelItem: {
    justifyContent: 'center',
  },
  menuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.primary[600],
  },
});
