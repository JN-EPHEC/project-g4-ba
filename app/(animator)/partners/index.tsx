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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { PartnerService } from '@/services/partner-service';
import { Partner, PartnerOffer } from '@/types/partners';

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
  warning: '#F5A623',
};

const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export default function PartnersListScreen() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [offers, setOffers] = useState<(PartnerOffer & { partner: Partner })[]>([]);
  const [unitBalance, setUnitBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !('unitId' in user)) return;

    try {
      const [partnersData, offersData, balance] = await Promise.all([
        PartnerService.getPartners(),
        PartnerService.getAllActiveOffers(),
        PartnerService.getUnitPointsBalance(user.unitId),
      ]);
      setPartners(partnersData);
      setOffers(offersData);
      setUnitBalance(balance);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'alimentation':
        return '🛒';
      case 'sport':
        return '⚽';
      case 'bricolage':
        return '🔨';
      case 'outdoor':
        return '🏕️';
      default:
        return '🏪';
    }
  };

  const formatDiscount = (offer: PartnerOffer) => {
    if (offer.discountType === 'percentage') {
      return `-${offer.discountValue}%`;
    }
    return `-${offer.discountValue}€`;
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Récompenses</Text>
        <TouchableOpacity
          onPress={() => router.push('/(animator)/partners/history')}
          style={styles.historyButton}
        >
          <Ionicons name="time-outline" size={24} color={colors.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Points de l'unité</Text>
            <View style={styles.balanceBadge}>
              <Ionicons name="star" size={16} color={colors.accent} />
            </View>
          </View>
          <Text style={styles.balanceValue}>{unitBalance.toLocaleString()}</Text>
          <Text style={styles.balanceSubtitle}>
            Points disponibles pour des récompenses
          </Text>
        </View>

        {/* Offres populaires */}
        <Text style={styles.sectionTitle}>🔥 Offres populaires</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersScroll}
        >
          {offers.slice(0, 4).map((offer) => (
            <TouchableOpacity
              key={offer.id}
              style={styles.offerCard}
              onPress={() => router.push(`/(animator)/partners/offer/${offer.id}`)}
            >
              <View style={styles.offerHeader}>
                <Text style={styles.offerLogo}>{offer.partner.logo}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{formatDiscount(offer)}</Text>
                </View>
              </View>
              <Text style={styles.offerPartner}>{offer.partner.name}</Text>
              <Text style={styles.offerTitle} numberOfLines={2}>
                {offer.title}
              </Text>
              <View style={styles.offerFooter}>
                <View style={styles.pointsCost}>
                  <Ionicons name="star" size={14} color={colors.accent} />
                  <Text style={styles.pointsCostText}>{offer.pointsCost} pts</Text>
                </View>
                {unitBalance >= offer.pointsCost ? (
                  <View style={[styles.statusBadge, { backgroundColor: `${colors.success}15` }]}>
                    <Text style={[styles.statusText, { color: colors.success }]}>Disponible</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: `${colors.warning}15` }]}>
                    <Text style={[styles.statusText, { color: colors.warning }]}>
                      -{offer.pointsCost - unitBalance} pts
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste des partenaires */}
        <Text style={styles.sectionTitle}>🤝 Nos partenaires</Text>
        {partners.map((partner) => {
          const partnerOffers = offers.filter((o) => o.partnerId === partner.id);
          const minPoints = partnerOffers.length > 0
            ? Math.min(...partnerOffers.map((o) => o.pointsCost))
            : 0;

          return (
            <TouchableOpacity
              key={partner.id}
              style={styles.partnerCard}
              onPress={() => router.push(`/(animator)/partners/${partner.id}`)}
            >
              <View style={styles.partnerLogo}>
                <Text style={styles.partnerLogoText}>{partner.logo}</Text>
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>{partner.name}</Text>
                <Text style={styles.partnerDescription} numberOfLines={1}>
                  {partner.description}
                </Text>
                <View style={styles.partnerMeta}>
                  <Text style={styles.partnerCategory}>
                    {getCategoryIcon(partner.category)} {partner.category}
                  </Text>
                  {partnerOffers.length > 0 && (
                    <Text style={styles.partnerOffers}>
                      {partnerOffers.length} offre{partnerOffers.length > 1 ? 's' : ''} • dès {minPoints} pts
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutralLight} />
            </TouchableOpacity>
          );
        })}

        {partners.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={48} color={colors.neutral} />
            <Text style={styles.emptyStateText}>Aucun partenaire disponible</Text>
            <Text style={styles.emptyStateSubtext}>
              Les partenariats arrivent bientôt !
            </Text>
          </View>
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
  historyButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: spacing.xs,
  },
  balanceSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },

  // Offers Scroll
  offersScroll: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  offerCard: {
    width: 180,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  offerLogo: {
    fontSize: 32,
  },
  discountBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  offerPartner: {
    fontSize: 12,
    color: colors.neutral,
    marginBottom: 2,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.sm,
    minHeight: 36,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsCostText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Partner Card
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  partnerLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  partnerLogoText: {
    fontSize: 28,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 2,
  },
  partnerDescription: {
    fontSize: 13,
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  partnerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  partnerCategory: {
    fontSize: 12,
    color: colors.neutralLight,
    textTransform: 'capitalize',
  },
  partnerOffers: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
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
});
