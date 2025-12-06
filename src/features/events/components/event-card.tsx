import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  /** Liste des participants (optionnel) */
  participants?: Participant[];
  /** Callback pour voir les participants */
  onViewParticipants?: () => void;
}

const EVENT_TYPE_CONFIG = {
  meeting: {
    label: 'Réunion',
    color: '#3b82f6',
    bgColor: '#3b82f620',
    icon: '📋',
  },
  camp: {
    label: 'Camp',
    color: '#34C759',
    bgColor: '#34C75920',
    icon: '⛺',
  },
  activity: {
    label: 'Activité',
    color: '#FF9500',
    bgColor: '#FF950020',
    icon: '🎯',
  },
  training: {
    label: 'Formation',
    color: '#AF52DE',
    bgColor: '#AF52DE20',
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
  onViewParticipants,
}: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[type];

  const handleDelete = () => {
    if (onDelete) {
      const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cet événement ?');
      if (confirmed) {
        onDelete();
      }
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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {/* Date Badge */}
      <View style={styles.dateContainer}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.month}>{month.toUpperCase()}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header with Type Badge and Delete Button */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
            <Text style={styles.typeIcon}>{config.icon}</Text>
            <Text style={[styles.typeLabel, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
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

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Time and Location */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={styles.infoText}>{time}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText} numberOfLines={1}>
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
          <Text style={[styles.participantsText, onViewParticipants && styles.participantsTextClickable]}>
            {participantCount}
            {maxParticipants ? ` / ${maxParticipants}` : ''} participants
          </Text>
          {onViewParticipants && participantCount > 0 && (
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          )}
          {isFull && <Text style={styles.fullBadge}>COMPLET</Text>}
        </TouchableOpacity>

        {/* Attendance Button */}
        <TouchableOpacity
          style={[
            styles.attendanceButton,
            isRegistered ? styles.attendanceButtonRegistered : styles.attendanceButtonUnregistered,
            isFull && !isRegistered && styles.attendanceButtonDisabled,
          ]}
          onPress={onAttendancePress}
          disabled={isFull && !isRegistered}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.attendanceButtonText,
              isRegistered ? styles.attendanceButtonTextRegistered : styles.attendanceButtonTextUnregistered,
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
  card: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  dateContainer: {
    width: 80,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  day: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  month: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 32,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    flexShrink: 0,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FF3B3020',
  },
  typeIcon: {
    fontSize: 12,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 12,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  infoIcon: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    color: '#999999',
    flex: 1,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    gap: 8,
  },
  participantsText: {
    fontSize: 14,
    color: '#999999',
    flex: 1,
  },
  participantsTextClickable: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  fullBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B30',
    backgroundColor: '#FF3B3020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    letterSpacing: 0.5,
  },
  attendanceButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceButtonUnregistered: {
    backgroundColor: '#3b82f6',
  },
  attendanceButtonRegistered: {
    backgroundColor: '#3b82f620',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  attendanceButtonDisabled: {
    backgroundColor: '#3A3A3A',
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  attendanceButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  attendanceButtonTextUnregistered: {
    color: '#FFFFFF',
  },
  attendanceButtonTextRegistered: {
    color: '#3b82f6',
  },
});
