import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ChallengeListCard } from '@/src/features/challenges/components/challenge-list-card';
import { useChallenges } from '@/src/features/challenges/hooks';
import { BrandColors, NeutralColors } from '@/constants/theme';

export default function ChallengesArchivesScreen() {
  const { challenges, loading } = useChallenges();
  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Filtrer uniquement les défis expirés
  const archivedChallenges = challenges.filter(c => new Date(c.endDate) < new Date());

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText color="secondary" style={styles.loadingText}>
            Chargement des archives...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec bouton retour */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: cardBorderColor }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Archives</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: cardColor, borderColor: cardBorderColor }]}>
          <Ionicons name="information-circle" size={20} color={BrandColors.primary[500]} />
          <ThemedText style={styles.infoText}>
            Défis dont la période est terminée
          </ThemedText>
        </View>

        {/* Compteur */}
        {archivedChallenges.length > 0 && (
          <View style={styles.countContainer}>
            <ThemedText color="secondary" style={styles.countText}>
              {archivedChallenges.length} défi{archivedChallenges.length > 1 ? 's' : ''} archivé{archivedChallenges.length > 1 ? 's' : ''}
            </ThemedText>
          </View>
        )}

        {/* Liste */}
        {archivedChallenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyIcon}>📦</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              Aucun défi archivé
            </ThemedText>
            <ThemedText color="secondary" style={styles.emptyText}>
              Les défis terminés apparaîtront ici
            </ThemedText>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {archivedChallenges.map(challenge => (
              <ChallengeListCard
                key={challenge.id}
                title={challenge.title}
                description={challenge.description}
                emoji={challenge.emoji}
                category={challenge.category}
                difficulty={challenge.difficulty}
                points={challenge.points}
                participants={challenge.participantsCount || 0}
                isCompleted={true}
                onPress={() => router.push(`/(animator)/challenges/${challenge.id}` as any)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  countContainer: {
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
