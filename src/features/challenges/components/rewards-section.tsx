import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const PARTNERS = [
  { id: '1', name: 'Colruyt', color: '#E31E24' },
  { id: '2', name: 'Brico', color: '#FF6B00' },
  { id: '3', name: 'Hema', color: '#5D4037' },
  { id: '4', name: 'Aldi', color: '#0066B3' },
];

export function RewardsSection() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.iconGift}>🎁</Text>
        <Text style={styles.title}>Gagnez des récompenses !</Text>
      </View>

      <Text style={styles.description}>
        En complétant des challenges, vous gagnez des points pour votre unité qui peuvent être convertis en{' '}
        <Text style={styles.bold}>bons d'achat</Text> chez nos partenaires.
      </Text>

      <View style={styles.partnersHeader}>
        <Text style={styles.partnerIcon}>✨</Text>
        <Text style={styles.partnersTitle}>Nos partenaires</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.partnersContainer}
      >
        {PARTNERS.map((partner) => (
          <View key={partner.id} style={[styles.partnerCard, { backgroundColor: partner.color }]}>
            <Text style={styles.partnerName}>{partner.name}</Text>
          </View>
        ))}
        <View style={styles.partnerCard}>
          <Text style={styles.partnerMore}>✨ Et plus encore...</Text>
        </View>
      </ScrollView>

      <Text style={styles.footer}>
        Plus vous participez, plus votre unité accumule de coupons pour financer ses activités et sorties !
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconGift: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  description: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  partnersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  partnersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  partnersContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  partnerCard: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  partnerMore: {
    fontSize: 13,
    color: '#666666',
  },
  footer: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    marginTop: 16,
    lineHeight: 20,
  },
});
