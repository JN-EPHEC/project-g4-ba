import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface EventsHeaderProps {
  totalEvents: number;
}

export function EventsHeader({ totalEvents }: EventsHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        <ThemedText style={styles.title}>Événements</ThemedText>
        <ThemedText style={styles.subtitle}>
          {totalEvents} événement{totalEvents !== 1 ? 's' : ''} à venir
        </ThemedText>
      </View>
      <View style={styles.iconContainer}>
        <ThemedText style={styles.icon}>📅</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
    direction: 'ltr',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
    writingDirection: 'ltr',
  },
  subtitle: {
    fontSize: 15,
    color: '#999999',
    letterSpacing: -0.3,
    writingDirection: 'ltr',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
});
