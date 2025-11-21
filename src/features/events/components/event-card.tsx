import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

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
}

const EVENT_TYPE_CONFIG = {
  meeting: {
    label: 'Réunion',
    color: '#007AFF',
    bgColor: '#E5F1FF',
    icon: '📋',
  },
  camp: {
    label: 'Camp',
    color: '#34C759',
    bgColor: '#E8F8EC',
    icon: '⛺',
  },
  activity: {
    label: 'Activité',
    color: '#FF9500',
    bgColor: '#FFF4E5',
    icon: '🎯',
  },
  training: {
    label: 'Formation',
    color: '#AF52DE',
    bgColor: '#F4EBFF',
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
}: EventCardProps) {
  const config = EVENT_TYPE_CONFIG[type];

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
        {/* Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
          <Text style={styles.typeIcon}>{config.icon}</Text>
          <Text style={[styles.typeLabel, { color: config.color }]}>
            {config.label}
          </Text>
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
        <View style={styles.participantsRow}>
          <Text style={styles.infoIcon}>👥</Text>
          <Text style={styles.participantsText}>
            {participantCount}
            {maxParticipants ? ` / ${maxParticipants}` : ''} participants
          </Text>
          {isFull && <Text style={styles.fullBadge}>COMPLET</Text>}
        </View>

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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  dateContainer: {
    width: 80,
    backgroundColor: '#007AFF',
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  typeIcon: {
    fontSize: 14,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
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
    color: '#666666',
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
    color: '#666666',
    flex: 1,
  },
  fullBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF3B30',
    backgroundColor: '#FFE5E5',
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
    backgroundColor: '#007AFF',
  },
  attendanceButtonRegistered: {
    backgroundColor: '#E5F1FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  attendanceButtonDisabled: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    color: '#007AFF',
  },
});
