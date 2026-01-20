import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { HealthService } from '@/services/health-service';
import { UnitService } from '@/services/unit-service';
import { Animator, Scout } from '@/types';

interface ScoutWithHealthStatus extends Scout {
  healthStatus: 'missing' | 'signed';
  signedAt?: Date;
  signedByParentName?: string;
}

type FilterType = 'all' | 'signed' | 'missing';

export default function HealthStatusScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [scouts, setScouts] = useState<ScoutWithHealthStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const loadData = useCallback(async () => {
    if (!animator?.unitId) return;

    try {
      // Récupérer les scouts validés de l'unité
      const allScouts = await UnitService.getScoutsByUnit(animator.unitId);
      const validatedScouts = allScouts.filter(s => s.validated);

      if (validatedScouts.length === 0) {
        setScouts([]);
        return;
      }

      // Récupérer le statut de santé de chaque scout
      const scoutIds = validatedScouts.map(s => s.id);
      const statuses = await HealthService.getScoutsHealthStatus(scoutIds);

      // Fusionner les données - traiter "unsigned" comme "missing"
      const scoutsWithStatus: ScoutWithHealthStatus[] = validatedScouts.map(scout => {
        const status = statuses.find(s => s.scoutId === scout.id);
        // Si unsigned ou missing, on considère comme missing
        const healthStatus = status?.status === 'signed' ? 'signed' : 'missing';
        return {
          ...scout,
          healthStatus,
          signedAt: status?.signedAt,
          signedByParentName: status?.signedByParentName,
        };
      });

      // Trier : manquants d'abord, puis signés, puis par nom
      scoutsWithStatus.sort((a, b) => {
        const statusOrder = { missing: 0, signed: 1 };
        if (statusOrder[a.healthStatus] !== statusOrder[b.healthStatus]) {
          return statusOrder[a.healthStatus] - statusOrder[b.healthStatus];
        }
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });

      setScouts(scoutsWithStatus);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  }, [animator?.unitId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    load();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const filteredScouts = scouts.filter(scout => {
    if (filter === 'all') return true;
    return scout.healthStatus === filter;
  });

  const signedCount = scouts.filter(s => s.healthStatus === 'signed').length;
  const missingCount = scouts.filter(s => s.healthStatus === 'missing').length;

  const getStatusIcon = (status: 'missing' | 'signed') => {
    switch (status) {
      case 'signed':
        return <Ionicons name="checkmark-circle" size={16} color="#059669" />;
      case 'missing':
        return <Ionicons name="close-circle" size={16} color="#ef4444" />;
    }
  };

  const getStatusText = (scout: ScoutWithHealthStatus) => {
    switch (scout.healthStatus) {
      case 'signed':
        return 'Fiche santé signée';
      case 'missing':
        return 'Fiche santé manquante';
    }
  };

  const getStatusColor = (status: 'missing' | 'signed') => {
    switch (status) {
      case 'signed':
        return '#059669';
      case 'missing':
        return '#ef4444';
    }
  };

  const getBorderColor = (status: 'missing' | 'signed') => {
    return getStatusColor(status);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={styles.loadingText}>Chargement...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
            Fiches Santé
          </ThemedText>
          <View style={{ width: 44 }} />
        </View>

        {/* Résumé */}
        <Card style={[styles.summaryCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText type="title" style={[styles.summaryValue, { color: '#059669' }]}>
                {signedCount}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>
                Signées
              </ThemedText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: cardBorder }]} />
            <View style={styles.summaryItem}>
              <ThemedText type="title" style={[styles.summaryValue, { color: '#ef4444' }]}>
                {missingCount}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>
                Manquantes
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Filtres */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && { backgroundColor: BrandColors.primary[500] },
              filter !== 'all' && { backgroundColor: cardColor, borderColor: cardBorder, borderWidth: 1 },
            ]}
            onPress={() => setFilter('all')}
          >
            <ThemedText style={[
              styles.filterText,
              filter === 'all' ? { color: '#FFFFFF' } : { color: textColor },
            ]}>
              Tous ({scouts.length})
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'signed' && { backgroundColor: '#059669' },
              filter !== 'signed' && { backgroundColor: cardColor, borderColor: cardBorder, borderWidth: 1 },
            ]}
            onPress={() => setFilter('signed')}
          >
            <ThemedText style={[
              styles.filterText,
              filter === 'signed' ? { color: '#FFFFFF' } : { color: textColor },
            ]}>
              Signées ({signedCount})
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'missing' && { backgroundColor: '#ef4444' },
              filter !== 'missing' && { backgroundColor: cardColor, borderColor: cardBorder, borderWidth: 1 },
            ]}
            onPress={() => setFilter('missing')}
          >
            <ThemedText style={[
              styles.filterText,
              filter === 'missing' ? { color: '#FFFFFF' } : { color: textColor },
            ]}>
              Manquantes ({missingCount})
            </ThemedText>
          </TouchableOpacity>
        </View>

        {filteredScouts.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#059669" />
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
              {filter === 'all' ? 'Aucun scout dans cette unité' : 'Aucun scout dans cette catégorie'}
            </ThemedText>
          </Card>
        ) : (
          filteredScouts.map((scout) => (
            <Card
              key={scout.id}
              style={[
                styles.scoutCard,
                { backgroundColor: cardColor, borderColor: cardBorder },
                { borderLeftColor: getBorderColor(scout.healthStatus), borderLeftWidth: 4 },
              ]}
            >
              <View style={styles.scoutRow}>
                {scout.photoURL ? (
                  <Image source={{ uri: scout.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: BrandColors.primary[100] }]}>
                    <ThemedText style={[styles.avatarText, { color: BrandColors.primary[600] }]}>
                      {scout.firstName?.[0]}{scout.lastName?.[0]}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.scoutInfo}>
                  <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                    {scout.firstName} {scout.lastName}
                  </ThemedText>
                  <View style={styles.statusRow}>
                    {getStatusIcon(scout.healthStatus)}
                    <ThemedText style={[styles.statusText, { color: getStatusColor(scout.healthStatus) }]}>
                      {getStatusText(scout)}
                    </ThemedText>
                  </View>
                  {scout.healthStatus === 'signed' && scout.signedByParentName && (
                    <ThemedText style={[styles.dateText, { color: textSecondary }]}>
                      Signé par {scout.signedByParentName}
                      {scout.signedAt && ` le ${scout.signedAt.toLocaleDateString('fr-FR')}`}
                    </ThemedText>
                  )}
                  {scout.healthStatus === 'missing' && (
                    <ThemedText style={[styles.dateText, { color: textSecondary }]}>
                      Fiche à compléter ou à signer
                    </ThemedText>
                  )}
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    opacity: 0.7,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoutCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  scoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoutInfo: {
    flex: 1,
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
  },
  dateText: {
    fontSize: 12,
  },
});
