import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { PartnerService } from '@/services/partner-service';
import { PartnerWithOffers, PartnerOffer } from '@/types/partners';

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

export default function PartnerDetailScreen() {
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
  const { user } = useAuth();
  const [partner, setPartner] = useState<PartnerWithOffers | null>(null);
  const [unitBalance, setUnitBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!partnerId || !user || !('unitId' in user)) return;

    try {
      const [partnerData, balance] = await Promise.all([
        PartnerService.getPartnerWithOffers(partnerId),
        PartnerService.getUnitPointsBalance(user.unitId),
      ]);
      setPartner(partnerData);
      setUnitBalance(balance);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [partnerId, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const formatDiscount = (offer: PartnerOffer) => {
    if (offer.discountType === 'percentage') {
      return `-${offer.discountValue}%`;
    }
    return `-${offer.discountValue}€`;
  };

  const getDifficultyColor = (pointsCost: number) => {
    if (pointsCost <= 500) return { bg: colors.successLight, color: colors.success };
    if (pointsCost <= 800) return { bg: colors.warningLight, color: colors.warning };
    return { bg: colors.dangerLight, color: colors.danger };
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

  if (!partner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partenaire</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.neutral} />
          <Text style={styles.emptyStateText}>Partenaire introuvable</Text>
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
        <Text style={styles.headerTitle}>{partner.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Partner Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroLogo}>
            <Text style={styles.heroLogoText}>{partner.logo}</Text>
          </View>
          <Text style={styles.heroName}>{partner.name}</Text>
          <Text style={styles.heroDescription}>{partner.description}</Text>
          {partner.website && (
            <TouchableOpacity
              style={styles.websiteButton}
              onPress={() => Linking.openURL(partner.website!)}
            >
              <Ionicons name="globe-outline" size={16} color={colors.primary} />
              <Text style={styles.websiteText}>Visiter le site</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Balance Reminder */}
        <View style={styles.balanceReminder}>
          <View style={styles.balanceReminderLeft}>
            <Ionicons name="star" size={20} color={colors.accent} />
            <Text style={styles.balanceReminderText}>
              Solde de votre unité
            </Text>
          </View>
          <Text style={styles.balanceReminderValue}>{unitBalance.toLocaleString()} pts</Text>
        </View>

        {/* Offers */}
        <Text style={styles.sectionTitle}>
          Offres disponibles ({partner.offers.length})
        </Text>

        {partner.offers.length === 0 ? (
          <View style={styles.noOffersCard}>
            <Ionicons name="pricetag-outline" size={32} color={colors.neutral} />
            <Text style={styles.noOffersText}>Aucune offre disponible</Text>
          </View>
        ) : (
          partner.offers.map((offer) => {
            const canAfford = unitBalance >= offer.pointsCost;
            const diffStyle = getDifficultyColor(offer.pointsCost);

            return (
              <TouchableOpacity
                key={offer.id}
                style={styles.offerCard}
                onPress={() => router.push(`/(animator)/partners/offer/${offer.id}`)}
              >
                <View style={styles.offerHeader}>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{formatDiscount(offer)}</Text>
                  </View>
                  <View style={[styles.costBadge, { backgroundColor: diffStyle.bg }]}>
                    <Ionicons name="star" size={12} color={diffStyle.color} />
                    <Text style={[styles.costText, { color: diffStyle.color }]}>
                      {offer.pointsCost} pts
                    </Text>
                  </View>
                </View>

                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerDescription}>{offer.description}</Text>

                {offer.minPurchase && (
                  <Text style={styles.offerCondition}>
                    Dès {offer.minPurchase}€ d'achat
                  </Text>
                )}

                <View style={styles.offerFooter}>
                  <Text style={styles.validityText}>
                    Valable {offer.validityDays} jours après échange
                  </Text>
                  {canAfford ? (
                    <View style={styles.availableBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={styles.availableText}>Disponible</Text>
                    </View>
                  ) : (
                    <Text style={styles.missingPoints}>
                      Il manque {offer.pointsCost - unitBalance} pts
                    </Text>
                  )}
                </View>

                <View style={styles.offerAction}>
                  <Text style={styles.offerActionText}>
                    {canAfford ? 'Échanger' : 'Voir le détail'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })
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

  // Hero
  heroCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  heroLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroLogoText: {
    fontSize: 40,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  heroDescription: {
    fontSize: 14,
    color: colors.neutral,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 20,
  },
  websiteText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },

  // Balance Reminder
  balanceReminder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  balanceReminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceReminderText: {
    fontSize: 14,
    color: colors.dark,
  },
  balanceReminderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.md,
  },

  // No Offers
  noOffersCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    gap: 12,
  },
  noOffersText: {
    fontSize: 14,
    color: colors.neutral,
  },

  // Offer Card
  offerCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  discountBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  offerDescription: {
    fontSize: 14,
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  offerCondition: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  validityText: {
    fontSize: 12,
    color: colors.neutralLight,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  missingPoints: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  offerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 10,
  },
  offerActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
});
