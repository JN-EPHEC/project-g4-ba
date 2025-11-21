import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EventsHeaderProps {
  totalEvents: number;
}

export function EventsHeader({ totalEvents }: EventsHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Événements</Text>
        <Text style={styles.subtitle}>
          {totalEvents} événement{totalEvents !== 1 ? 's' : ''} à venir
        </Text>
      </View>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📅</Text>
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
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    letterSpacing: -0.3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
});
