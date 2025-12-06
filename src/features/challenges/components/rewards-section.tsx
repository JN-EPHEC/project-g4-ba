import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const PARTNERS = [
  { id: '1', name: 'Colruyt', color: '#E31E24' },
  { id: '2', name: 'Brico', color: '#FF6B00' },
  { id: '3', name: 'Hema', color: '#5D4037' },
  { id: '4', name: 'Aldi', color: '#0066B3' },
];

export function RewardsSection() {
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');

  return (
    <View style={[styles.container, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.iconGift}>🎁</ThemedText>
        <ThemedText type="subtitle">Gagnez des récompenses !</ThemedText>
      </View>

      <ThemedText color="secondary" style={styles.description}>
        En complétant des challenges, vous gagnez des points pour votre unité qui peuvent être convertis en{' '}
        <ThemedText type="bodySemiBold">bons d'achat</ThemedText> chez nos partenaires.
      </ThemedText>

      <View style={styles.partnersHeader}>
        <ThemedText style={styles.partnerIcon}>✨</ThemedText>
        <ThemedText type="bodySemiBold">Nos partenaires</ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.partnersContainer}
      >
        {PARTNERS.map((partner) => (
          <View key={partner.id} style={[styles.partnerCard, { backgroundColor: partner.color }]}>
            <ThemedText color="inverse" type="caption" style={styles.partnerName}>{partner.name}</ThemedText>
          </View>
        ))}
        <View style={[styles.partnerCard, { backgroundColor: surfaceSecondary }]}>
          <ThemedText color="tertiary" style={styles.partnerMore}>✨ Et plus encore...</ThemedText>
        </View>
      </ScrollView>

      <ThemedText color="tertiary" style={styles.footer}>
        Plus vous participez, plus votre unité accumule de coupons pour financer ses activités et sorties !
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
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
  description: {
    lineHeight: 22,
    marginBottom: 20,
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
  partnersContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  partnerCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerName: {
    fontWeight: '600',
  },
  partnerMore: {
    fontSize: 13,
  },
  footer: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 16,
    lineHeight: 20,
  },
});
