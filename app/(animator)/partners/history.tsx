import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { PartnerService } from '@/services/partner-service';
import { RedemptionWithDetails } from '@/types/partners';

const colors = {
  primary: '#2D5A45',
  accent: '#E07B4C',
  accentLight: '#FEF3EE',
  dark: '#1A2E28',
  neutral: '#8B7E74',
  neutralLight: '#C4BBB3',
  mist: '#E8EDE9',
  canvas: '#FDFCFB',
  cardBg: '#FFFFFF',
  success: '#28A745',
  successLight: '#E8F5E9',
  warning: '#F5A623',
  warningLight: '#FEF7E6',
  danger: '#DC3545',
  dangerLight: '#FDEAEA',
};

const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export default function RedemptionHistoryScreen() {
  const { user } = useAuth();
  const [redemptions, setRedemptions] = useState<RedemptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !('unitId' in user)) return;

    try {
      const data = await PartnerService.getUnitRedemptions(user.unitId);
      setRedemptions(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleMarkAsUsed = (redemptionId: string) => {
    Alert.alert(
      'Marquer comme utilisé',
      'Confirmez-vous avoir utilisé ce code promo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            const success = await PartnerService.markRedemptionAsUsed(redemptionId);
            if (success) {
              loadData();
            }
          },
        },
      ]
    );
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: colors.successLight, color: colors.success, label: 'Actif' };
      case 'used':
        return { bg: colors.mist, color: colors.neutral, label: 'Utilisé' };
      case 'expired':
        return { bg: colors.dangerLight, color: colors.danger, label: 'Expiré' };
      default:
        return { bg: colors.mist, color: colors.neutral, label: status };
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDiscount = (redemption: RedemptionWithDetails) => {
    if (redemption.offer.discountType === 'percentage') {
      return `-${redemption.offer.discountValue}%`;
    }
    return `-${redemption.offer.discountValue}€`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const activeRedemptions = redemptions.filter((r) => r.status === 'active');
  const pastRedemptions = redemptions.filter((r) => r.status !== 'active');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {redemptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.neutral} />
            <Text style={styles.emptyStateText}>Aucun échange effectué</Text>
            <Text style={styles.emptyStateSubtext}>
              Vos codes promo apparaîtront ici après échange
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.replace('/(animator)/partners')}
            >
              <Text style={styles.emptyStateButtonText}>Voir les offres</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Active Redemptions */}
            {activeRedemptions.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  🎟️ Codes actifs ({activeRedemptions.length})
                </Text>
                {activeRedemptions.map((redemption) => {
                  const statusStyle = getStatusStyle(redemption.status);

                  return (
                    <View key={redemption.id} style={styles.redemptionCard}>
                      <View style={styles.redemptionHeader}>
                        <View style={styles.partnerInfo}>
                          <Text style={styles.partnerLogo}>{redemption.partner.logo}</Text>
                          <View>
                            <Text style={styles.partnerName}>{redemption.partner.name}</Text>
                            <Text style={styles.offerTitle}>{redemption.offer.title}</Text>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.statusText, { color: statusStyle.color }]}>
                            {statusStyle.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.codeSection}>
                        <Text style={styles.codeLabel}>Code promo</Text>
                        <Text style={styles.codeValue}>{redemption.code}</Text>
                      </View>

                      <View style={styles.redemptionMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="pricetag" size={14} color={colors.accent} />
                          <Text style={styles.metaText}>{formatDiscount(redemption)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar" size={14} color={colors.neutral} />
                          <Text style={styles.metaText}>
                            Expire le {formatDate(redemption.expiresAt)}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.markUsedButton}
                        onPress={() => handleMarkAsUsed(redemption.id)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                        <Text style={styles.markUsedText}>Marquer comme utilisé</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}

            {/* Past Redemptions */}
            {pastRedemptions.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  📜 Historique ({pastRedemptions.length})
                </Text>
                {pastRedemptions.map((redemption) => {
                  const statusStyle = getStatusStyle(redemption.status);

                  return (
                    <View key={redemption.id} style={[styles.redemptionCard, styles.pastCard]}>
                      <View style={styles.redemptionHeader}>
                        <View style={styles.partnerInfo}>
                          <Text style={styles.partnerLogo}>{redemption.partner.logo}</Text>
                          <View>
                            <Text style={[styles.partnerName, styles.pastText]}>
                              {redemption.partner.name}
                            </Text>
                            <Text style={[styles.offerTitle, styles.pastText]}>
                              {redemption.offer.title}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                          <Text style={[styles.statusText, { color: statusStyle.color }]}>
                            {statusStyle.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.pastMeta}>
                        <Text style={styles.pastMetaText}>
                          {formatDiscount(redemption)} • {redemption.pointsSpent} pts dépensés
                        </Text>
                        <Text style={styles.pastMetaText}>
                          Échangé le {formatDate(redemption.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.mist,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },

  // Redemption Card
  redemptionCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  pastCard: {
    opacity: 0.8,
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  partnerLogo: {
    fontSize: 32,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
  },
  offerTitle: {
    fontSize: 13,
    color: colors.neutral,
  },
  pastText: {
    color: colors.neutralLight,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Code Section
  codeSection: {
    backgroundColor: colors.mist,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  codeLabel: {
    fontSize: 12,
    color: colors.neutral,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },

  // Meta
  redemptionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.neutral,
  },
  pastMeta: {
    gap: 4,
  },
  pastMetaText: {
    fontSize: 12,
    color: colors.neutralLight,
  },

  // Mark Used Button
  markUsedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 10,
  },
  markUsedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.neutral,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
