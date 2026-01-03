import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
}

interface EventCardProps {
  id: string;
  title: string;
  type: 'meeting' | 'camp' | 'activity' | 'training';
  date: Date;
  location: string;
  participantCount: number;
  maxParticipants?: number;
  isRegistered: boolean;
  onPress: () => void;
  onAttendancePress: () => void;
  /** Si true, affiche le bouton de suppression */
  canDelete?: boolean;
  /** Callback appelé quand l'utilisateur veut supprimer l'événement */
  onDelete?: () => void;
  /** Si true, affiche le bouton de modification */
  canEdit?: boolean;
  /** Callback appelé quand l'utilisateur veut modifier l'événement */
  onEdit?: () => void;
  /** Liste des participants (optionnel) */
  participants?: Participant[];
  /** Callback pour voir les participants */
  onViewParticipants?: () => void;
  /** URL de l'image de fond */
  imageUrl?: string;
  /** Nom de l'unité qui a créé l'événement */
  unitName?: string;
}

// Nature theme event types
const EVENT_TYPE_CONFIG = {
  meeting: {
    label: 'Réunion',
    color: BrandColors.primary[500],
    bgColor: `${BrandColors.primary[500]}20`,
    icon: '📋',
  },
  camp: {
    label: 'Camp',
    color: BrandColors.primary[600],
    bgColor: `${BrandColors.primary[600]}20`,
    icon: '⛺',
  },
  activity: {
    label: 'Activité',
    color: BrandColors.accent[500],
    bgColor: `${BrandColors.accent[500]}20`,
    icon: '🎯',
  },
  training: {
    label: 'Formation',
    color: BrandColors.secondary[500],
    bgColor: `${BrandColors.secondary[500]}20`,
    icon: '📚',
  },
};

export function EventCard({
  title,
  type,
  date,
  location,
  participantCount,
  maxParticipants,
  isRegistered,
  onPress,
  onAttendancePress,
  canDelete,
  onDelete,
  canEdit,
  onEdit,
  onViewParticipants,
  imageUrl,
  unitName,
}: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[type];

  // Theme colors
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const handleDelete = () => {
    if (!onDelete) return;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
        onDelete();
      }
    } else {
      Alert.alert(
        'Supprimer l\'événement',
        'Êtes-vous sûr de vouloir supprimer cet événement ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: onDelete },
        ]
      );
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    const time = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return { day, month, time };
  };

  const { day, month, time } = formatDate(date);
  const isFull = maxParticipants ? participantCount >= maxParticipants : false;

  // Event color based on type
  const eventColor = type === 'activity' ? BrandColors.accent[500] : BrandColors.primary[500];

  // Si on a une image, on utilise un layout différent avec l'image en fond
  if (imageUrl) {
    return (
      <TouchableOpacity
        style={[styles.cardWithImage, { borderColor: cardBorder }]}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']}
            locations={[0, 0.5, 1]}
            style={styles.imageGradient}
          >
            {/* Header with Type Badge and Action Buttons */}
            <View style={styles.imageHeader}>
              <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                <Text style={styles.typeIcon}>{config.icon}</Text>
                <Text style={[styles.typeLabel, { color: config.color }]}>
                  {config.label}
                </Text>
              </View>
              <View style={styles.imageHeaderRight}>
                <View style={styles.dateBadgeSmall}>
                  <Text style={styles.dateBadgeDay}>{day}</Text>
                  <Text style={styles.dateBadgeMonth}>{month.toUpperCase()}</Text>
                </View>
                {canEdit && onEdit && (
                  <TouchableOpacity
                    onPress={onEdit}
                    style={[styles.actionButtonImage, { backgroundColor: 'rgba(255,255,255,0.95)' }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={18} color={BrandColors.primary[600]} />
                  </TouchableOpacity>
                )}
                {canDelete && onDelete && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={[styles.actionButtonImage, { backgroundColor: 'rgba(255,59,48,0.95)' }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Bottom content */}
            <View style={styles.imageContent}>
              <Text style={styles.imageTitleText} numberOfLines={2}>
                {title}
              </Text>

              {unitName && (
                <View style={styles.unitBadgeImage}>
                  <Text style={styles.unitBadgeIcon}>🏕️</Text>
                  <Text style={styles.unitBadgeTextImage}>{unitName}</Text>
                </View>
              )}

              <View style={styles.imageInfoRow}>
                <View style={styles.infoChip}>
                  <Text style={styles.infoChipIcon}>🕐</Text>
                  <Text style={styles.infoChipText}>{time}</Text>
                </View>
                <View style={styles.infoChip}>
                  <Text style={styles.infoChipIcon}>📍</Text>
                  <Text style={styles.infoChipText} numberOfLines={1}>{location}</Text>
                </View>
              </View>

              <View style={styles.imageFooter}>
                <TouchableOpacity
                  style={styles.participantsChip}
                  onPress={onViewParticipants}
                  disabled={!onViewParticipants}
                >
                  <Text style={styles.infoChipIcon}>👥</Text>
                  <Text style={styles.infoChipText}>
                    {participantCount}{maxParticipants ? `/${maxParticipants}` : ''}
                  </Text>
                  {isFull && <Text style={styles.fullBadgeSmall}>COMPLET</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.attendanceButtonSmall,
                    isRegistered
                      ? { backgroundColor: 'rgba(255,255,255,0.95)' }
                      : { backgroundColor: BrandColors.accent[500] },
                    isFull && !isRegistered && { backgroundColor: 'rgba(255,255,255,0.5)' },
                  ]}
                  onPress={onAttendancePress}
                  disabled={isFull && !isRegistered}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.attendanceButtonTextSmall,
                      isRegistered
                        ? { color: BrandColors.primary[600] }
                        : { color: '#FFFFFF' },
                    ]}
                  >
                    {isRegistered ? '✓ Inscrit' : isFull ? 'Complet' : "S'inscrire"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  // Layout par défaut sans image
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardColor, borderColor: cardBorder }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {/* Date Badge */}
      <View style={[styles.dateContainer, { backgroundColor: eventColor }]}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.month}>{month.toUpperCase()}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header with Type Badge and Edit/Delete Buttons */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
            <Text style={styles.typeIcon}>{config.icon}</Text>
            <Text style={[styles.typeLabel, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {canEdit && onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={styles.editButtonCard}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={18} color={BrandColors.primary[600]} />
              </TouchableOpacity>
            )}
            {canDelete && onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
          {title}
        </Text>

        {/* Unit Name */}
        {unitName && (
          <View style={styles.unitBadge}>
            <Text style={styles.unitBadgeIcon}>🏕️</Text>
            <Text style={[styles.unitBadgeText, { color: textSecondary }]}>{unitName}</Text>
          </View>
        )}

        {/* Time and Location */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={[styles.infoText, { color: textSecondary }]}>{time}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={[styles.infoText, { color: textSecondary }]} numberOfLines={1}>
            {location}
          </Text>
        </View>

        {/* Participants */}
        <TouchableOpacity
          style={styles.participantsRow}
          onPress={onViewParticipants}
          activeOpacity={onViewParticipants ? 0.6 : 1}
          disabled={!onViewParticipants}
        >
          <Text style={styles.infoIcon}>👥</Text>
          <Text style={[
            styles.participantsText,
            { color: textSecondary },
            onViewParticipants && { color: BrandColors.primary[500], textDecorationLine: 'underline' }
          ]}>
            {participantCount}
            {maxParticipants ? ` / ${maxParticipants}` : ''} participants
          </Text>
          {onViewParticipants && participantCount > 0 && (
            <Ionicons name="chevron-forward" size={16} color={BrandColors.primary[500]} />
          )}
          {isFull && <Text style={styles.fullBadge}>COMPLET</Text>}
        </TouchableOpacity>

        {/* Attendance Button - Orange accent for action */}
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            isRegistered
              ? { backgroundColor: `${BrandColors.primary[500]}15`, borderWidth: 1, borderColor: BrandColors.primary[500] }
              : { backgroundColor: BrandColors.accent[500] },
            isFull && !isRegistered && styles.attendanceButtonDisabled,
          ]}
          onPress={onAttendancePress}
          disabled={isFull && !isRegistered}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.attendanceButtonText,
              isRegistered
                ? { color: BrandColors.primary[500] }
                : { color: '#FFFFFF' },
            ]}
          >
            {isRegistered ? '✓ Inscrit' : isFull ? 'Complet' : "S'inscrire"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Layout avec image
  cardWithImage: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    height: 320,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    borderRadius: Radius.xl,
  },
  imageGradient: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  imageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dateBadgeSmall: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dateBadgeDay: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.primary[600],
  },
  dateBadgeMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: BrandColors.primary[500],
    marginTop: -2,
  },
  actionButtonImage: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContent: {
    gap: Spacing.sm,
  },
  imageTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 28,
  },
  imageInfoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoChipIcon: {
    fontSize: 13,
  },
  infoChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: NeutralColors.gray[700],
    maxWidth: 140,
  },
  participantsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fullBadgeSmall: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FF3B30',
    marginLeft: 4,
  },
  imageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  attendanceButtonSmall: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  attendanceButtonTextSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Layout par défaut sans image
  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
  },
  dateContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  day: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    writingDirection: 'ltr',
  },
  month: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: 4,
    writingDirection: 'ltr',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    minHeight: 32,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    gap: 4,
    flexShrink: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  editButton: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  editButtonCard: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: `${BrandColors.primary[500]}20`,
  },
  deleteButton: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: '#FF3B3020',
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  unitBadgeIcon: {
    fontSize: 12,
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  unitBadgeImage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
    gap: 4,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unitBadgeTextImage: {
    fontSize: 12,
    fontWeight: '600',
    color: NeutralColors.gray[700],
  },
  typeIcon: {
    fontSize: 12,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.3,
    writingDirection: 'ltr',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
    lineHeight: 24,
    writingDirection: 'ltr',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: Spacing.sm,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
    writingDirection: 'ltr',
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  participantsText: {
    fontSize: 14,
    flex: 1,
    writingDirection: 'ltr',
  },
  fullBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B30',
    backgroundColor: '#FF3B3020',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    letterSpacing: 0.5,
    writingDirection: 'ltr',
  },
  attendanceButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceButtonDisabled: {
    backgroundColor: NeutralColors.gray[200],
    borderWidth: 1,
    borderColor: NeutralColors.gray[300],
  },
  attendanceButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
    writingDirection: 'ltr',
  },
});
