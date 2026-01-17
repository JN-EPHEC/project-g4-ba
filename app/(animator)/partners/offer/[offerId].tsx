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
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { PartnerService } from '@/services/partner-service';
import { Partner, PartnerOffer, Redemption } from '@/types/partners';

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
};

const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export default function OfferDetailScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const { user } = useAuth();
  const [offer, setOffer] = useState<PartnerOffer | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [unitBalance, setUnitBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!offerId || !user || !('unitId' in user)) return;

    try {
      const [offerData, balance] = await Promise.all([
        PartnerService.getOfferById(offerId),
        PartnerService.getUnitPointsBalance(user.unitId),
      ]);

      if (offerData) {
        setOffer(offerData);
        const partnerData = await PartnerService.getPartnerWithOffers(offerData.partnerId);
        setPartner(partnerData);
      }
      setUnitBalance(balance);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [offerId, user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRedeem = () => {
    console.log('[handleRedeem] Appelé');
    if (!offer || !user || !('unitId' in user)) {
      console.log('[handleRedeem] Condition non remplie, return early');
      return;
    }
    console.log('[handleRedeem] Ouverture modal de confirmation');
    setShowConfirmModal(true);
  };

  const confirmRedeem = async () => {
    if (!offer || !user || !('unitId' in user)) return;

    console.log('[confirmRedeem] Confirmation appelée');
    setShowConfirmModal(false);
    setRedeeming(true);

    try {
      const userName = `${user.firstName} ${user.lastName}`;
      console.log('[confirmRedeem] Appel requestRedemption avec:', { offerId: offer.id, userId: user.id, userName, unitId: user.unitId });
      const result = await PartnerService.requestRedemption(
        offer.id,
        user.id,
        userName,
        user.unitId
      );
      console.log('[confirmRedeem] Résultat:', result);

      if (result.success && result.redemption) {
        setRedemption(result.redemption);
        setUnitBalance((prev) => prev - offer.pointsCost);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible d\'échanger l\'offre');
        // Rafraîchir les données en cas d'erreur (solde peut être obsolète)
        loadData();
      }
    } catch (error: any) {
      console.error('[confirmRedeem] Erreur:', error);
      Alert.alert('Erreur', error?.message || 'Une erreur est survenue');
      // Rafraîchir les données en cas d'erreur
      loadData();
    } finally {
      setRedeeming(false);
    }
  };

  const formatDiscount = () => {
    if (!offer) return '';
    if (offer.discountType === 'percentage') {
      return `-${offer.discountValue}%`;
    }
    return `-${offer.discountValue}€`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-BE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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

  // Écran de succès après échange
  if (redemption) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Code promo</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.successContent}
        >
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>

          <Text style={styles.successTitle}>Échange réussi !</Text>
          <Text style={styles.successSubtitle}>
            Votre code promo est prêt à être utilisé
          </Text>

          {/* Code Card */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Votre code promo</Text>
            <Text style={styles.codeValue}>{redemption.code}</Text>
            <View style={styles.codeDivider} />
            <View style={styles.codeDetails}>
              <View style={styles.codeDetailRow}>
                <Text style={styles.codeDetailLabel}>Partenaire</Text>
                <Text style={styles.codeDetailValue}>{partner?.name}</Text>
              </View>
              <View style={styles.codeDetailRow}>
                <Text style={styles.codeDetailLabel}>Réduction</Text>
                <Text style={styles.codeDetailValue}>{formatDiscount()}</Text>
              </View>
              <View style={styles.codeDetailRow}>
                <Text style={styles.codeDetailLabel}>Valide jusqu'au</Text>
                <Text style={styles.codeDetailValue}>{formatDate(redemption.expiresAt)}</Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Comment utiliser ?</Text>
            <View style={styles.instructionStep}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                Rendez-vous dans un magasin {partner?.name}
              </Text>
            </View>
            <View style={styles.instructionStep}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                Présentez ce code à la caisse
              </Text>
            </View>
            <View style={styles.instructionStep}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                La réduction sera appliquée automatiquement
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.replace('/(animator)/partners')}
          >
            <Text style={styles.doneButtonText}>Terminé</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!offer || !partner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offre</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.neutral} />
          <Text style={styles.emptyStateText}>Offre introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canAfford = unitBalance >= offer.pointsCost;
  const missingPoints = offer.pointsCost - unitBalance;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détail de l'offre</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Partner Info */}
        <View style={styles.partnerBanner}>
          {partner.logo?.startsWith('http') ? (
            <Image source={{ uri: partner.logo }} style={styles.partnerLogoImage} />
          ) : (
            <Text style={styles.partnerLogo}>{partner.logo}</Text>
          )}
          <Text style={styles.partnerName}>{partner.name}</Text>
        </View>

        {/* Offer Details */}
        <View style={styles.offerCard}>
          <View style={styles.discountBadgeLarge}>
            <Text style={styles.discountTextLarge}>{formatDiscount()}</Text>
          </View>

          <Text style={styles.offerTitle}>{offer.title}</Text>
          <Text style={styles.offerDescription}>{offer.description}</Text>

          {offer.minPurchase && (
            <View style={styles.conditionBadge}>
              <Ionicons name="information-circle" size={16} color={colors.accent} />
              <Text style={styles.conditionText}>
                Valable dès {offer.minPurchase}€ d'achat
              </Text>
            </View>
          )}

          <View style={styles.offerMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={18} color={colors.neutral} />
              <Text style={styles.metaText}>
                Valable {offer.validityDays} jours après échange
              </Text>
            </View>
          </View>
        </View>

        {/* Cost Card */}
        <View style={styles.costCard}>
          <View style={styles.costHeader}>
            <Text style={styles.costLabel}>Coût de l'échange</Text>
            <View style={styles.costValue}>
              <Ionicons name="star" size={20} color={colors.accent} />
              <Text style={styles.costValueText}>{offer.pointsCost} points</Text>
            </View>
          </View>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Votre solde</Text>
            <Text style={[
              styles.balanceValue,
              { color: canAfford ? colors.success : colors.danger }
            ]}>
              {unitBalance.toLocaleString()} points
            </Text>
          </View>

          {!canAfford && (
            <View style={styles.missingAlert}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={styles.missingText}>
                Il vous manque {missingPoints} points pour cette offre
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.redeemButton,
            !canAfford && styles.redeemButtonDisabled,
          ]}
          onPress={handleRedeem}
          disabled={!canAfford || redeeming}
        >
          {redeeming ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={canAfford ? 'gift' : 'lock-closed'}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.redeemButtonText}>
                {canAfford ? 'Échanger maintenant' : `Encore ${missingPoints} pts`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de confirmation */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="gift" size={48} color={colors.accent} />
            </View>
            <Text style={styles.modalTitle}>Confirmer l'échange</Text>
            <Text style={styles.modalMessage}>
              Voulez-vous échanger {offer?.pointsCost} points contre cette offre ?
            </Text>
            <Text style={styles.modalWarning}>Cette action est irréversible.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmRedeem}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.modalConfirmButtonText}>Échanger</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 120,
  },

  // Partner Banner
  partnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  partnerLogo: {
    fontSize: 32,
  },
  partnerLogoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.mist,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },

  // Offer Card
  offerCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  discountBadgeLarge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  discountTextLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  offerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  offerDescription: {
    fontSize: 15,
    color: colors.neutral,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  conditionText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '500',
  },
  offerMeta: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 14,
    color: colors.neutral,
  },

  // Cost Card
  costCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.mist,
  },
  costHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  costLabel: {
    fontSize: 14,
    color: colors.neutral,
  },
  costValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  costValueText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.neutral,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  missingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  missingText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '500',
    flex: 1,
  },

  // Bottom Action
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: colors.mist,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 14,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.neutralLight,
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Success Screen
  successContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  successIcon: {
    marginVertical: spacing.xl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: 15,
    color: colors.neutral,
    marginBottom: spacing.xl,
  },
  codeCard: {
    width: '100%',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: 14,
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  codeValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },
  codeDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.mist,
    marginVertical: spacing.md,
  },
  codeDetails: {
    width: '100%',
    gap: spacing.xs,
  },
  codeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeDetailLabel: {
    fontSize: 14,
    color: colors.neutral,
  },
  codeDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
  },
  instructionsCard: {
    width: '100%',
    backgroundColor: colors.mist,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: spacing.md,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instructionText: {
    fontSize: 14,
    color: colors.dark,
    flex: 1,
  },
  doneButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: colors.neutral,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalWarning: {
    fontSize: 13,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.mist,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral,
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  modalConfirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
