import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/auth-context';
import { Animator } from '@/types';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { PartnerService } from '@/services/partner-service';
import { RedemptionWithDetails } from '@/types/partners';

const STATUS_BAR_HEIGHT = Platform.select({
  ios: Constants.statusBarHeight || 44,
  android: Constants.statusBarHeight || 24,
  web: 0,
  default: 0,
});

export default function PendingApprovalsScreen() {
  const { user } = useAuth();
  const animator = user as Animator;

  const [pendingRedemptions, setPendingRedemptions] = useState<RedemptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const cardColor = useThemeColor({}, 'card');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const loadPendingRedemptions = useCallback(async () => {
    if (!animator?.unitId) return;

    setLoading(true);
    try {
      const pending = await PartnerService.getPendingRedemptions(animator.unitId);
      setPendingRedemptions(pending);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
    } finally {
      setLoading(false);
    }
  }, [animator?.unitId]);

  useFocusEffect(
    useCallback(() => {
      loadPendingRedemptions();
    }, [loadPendingRedemptions])
  );

  const handleApprove = async (redemption: RedemptionWithDetails) => {
    if (!animator?.id) return;

    const animatorName = `${animator.firstName} ${animator.lastName}`;
    const hasAlreadyApproved = redemption.approvals?.some(a => a.animatorId === animator.id);

    if (hasAlreadyApproved) {
      Alert.alert('Information', 'Vous avez déjà approuvé cette demande.');
      return;
    }

    Alert.alert(
      'Approuver la demande',
      `Voulez-vous approuver l'échange "${redemption.offer.title}" ?\n\nApprobations: ${redemption.approvals?.length || 0}/${redemption.requiredApprovals}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            setProcessingId(redemption.id);
            try {
              const result = await PartnerService.approveRedemption(
                redemption.id,
                animator.id,
                animatorName
              );

              if (result.success) {
                if (result.isFullyApproved) {
                  Alert.alert(
                    'Échange validé !',
                    `L'échange a été approuvé par 3 animateurs.\n\nCode promo: ${result.code}\n\nLes points ont été déduits du solde de l'unité.`,
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert(
                    'Approbation enregistrée',
                    'Votre approbation a été enregistrée. Il faut encore des approbations supplémentaires.',
                    [{ text: 'OK' }]
                  );
                }
                loadPendingRedemptions();
              } else {
                Alert.alert('Erreur', result.error || 'Impossible d\'approuver');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (redemption: RedemptionWithDetails) => {
    if (!animator?.id) return;

    Alert.alert(
      'Rejeter la demande',
      `Voulez-vous rejeter l'échange "${redemption.offer.title}" ?\n\nCette action annulera la demande.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(redemption.id);
            try {
              const result = await PartnerService.rejectRedemption(
                redemption.id,
                animator.id,
                'Rejeté par un animateur'
              );

              if (result.success) {
                Alert.alert('Demande rejetée', 'La demande a été rejetée.');
                loadPendingRedemptions();
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de rejeter');
              }
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText color="secondary" style={styles.loadingText}>
            Chargement des demandes...
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Demandes en attente
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: `${BrandColors.primary[500]}10` }]}>
          <Ionicons name="shield-checkmark" size={20} color={BrandColors.primary[500]} />
          <ThemedText style={[styles.infoBannerText, { color: BrandColors.primary[600] }]}>
            Chaque échange nécessite l'approbation de 3 animateurs différents avant que les points ne soient déduits.
          </ThemedText>
        </View>

        {/* Liste des demandes */}
        {pendingRedemptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={BrandColors.primary[300]} />
            <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
              Aucune demande en attente
            </ThemedText>
            <ThemedText color="secondary" style={styles.emptyText}>
              Toutes les demandes d'échange ont été traitées.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {pendingRedemptions.map((redemption) => {
              const hasApproved = redemption.approvals?.some(a => a.animatorId === animator?.id);
              const approvalsCount = redemption.approvals?.length || 0;
              const requesterName = (redemption as any).requesterName || 'Un animateur';

              return (
                <View
                  key={redemption.id}
                  style={[styles.redemptionCard, { backgroundColor: cardColor, borderColor: cardBorderColor }]}
                >
                  {/* Header */}
                  <View style={styles.redemptionHeader}>
                    <View style={styles.partnerInfo}>
                      <ThemedText style={styles.partnerLogo}>{redemption.partner.logo}</ThemedText>
                      <View>
                        <ThemedText style={styles.partnerName}>{redemption.partner.name}</ThemedText>
                        <ThemedText style={[styles.requestDate, { color: textSecondary }]}>
                          Demandé le {formatDate(redemption.createdAt)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={[styles.pointsBadge, { backgroundColor: BrandColors.accent[100] }]}>
                      <ThemedText style={[styles.pointsText, { color: BrandColors.accent[700] }]}>
                        {redemption.pointsSpent} pts
                      </ThemedText>
                    </View>
                  </View>

                  {/* Offre */}
                  <ThemedText style={styles.offerTitle}>{redemption.offer.title}</ThemedText>
                  <ThemedText style={[styles.offerDescription, { color: textSecondary }]}>
                    {redemption.offer.description}
                  </ThemedText>

                  {/* Demandeur */}
                  <View style={[styles.requesterInfo, { backgroundColor: NeutralColors.gray[100] }]}>
                    <Ionicons name="person" size={14} color={textSecondary} />
                    <ThemedText style={[styles.requesterText, { color: textSecondary }]}>
                      Demandé par {requesterName}
                    </ThemedText>
                  </View>

                  {/* Progression des approbations */}
                  <View style={styles.approvalsSection}>
                    <View style={styles.approvalsHeader}>
                      <ThemedText style={styles.approvalsTitle}>
                        Approbations ({approvalsCount}/{redemption.requiredApprovals})
                      </ThemedText>
                      {hasApproved && (
                        <View style={[styles.approvedBadge, { backgroundColor: BrandColors.primary[100] }]}>
                          <Ionicons name="checkmark" size={12} color={BrandColors.primary[600]} />
                          <ThemedText style={[styles.approvedBadgeText, { color: BrandColors.primary[600] }]}>
                            Vous avez approuvé
                          </ThemedText>
                        </View>
                      )}
                    </View>

                    {/* Barre de progression */}
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { backgroundColor: NeutralColors.gray[200] }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: BrandColors.primary[500],
                              width: `${(approvalsCount / redemption.requiredApprovals) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Liste des approbateurs */}
                    {redemption.approvals && redemption.approvals.length > 0 && (
                      <View style={styles.approversList}>
                        {redemption.approvals.map((approval, index) => (
                          <View key={index} style={styles.approverItem}>
                            <Ionicons name="checkmark-circle" size={16} color={BrandColors.primary[500]} />
                            <ThemedText style={[styles.approverName, { color: textSecondary }]}>
                              {approval.animatorName}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.rejectButton, { borderColor: '#DC3545' }]}
                      onPress={() => handleReject(redemption)}
                      disabled={processingId === redemption.id}
                    >
                      {processingId === redemption.id ? (
                        <ActivityIndicator size="small" color="#DC3545" />
                      ) : (
                        <>
                          <Ionicons name="close" size={18} color="#DC3545" />
                          <ThemedText style={[styles.rejectButtonText, { color: '#DC3545' }]}>
                            Rejeter
                          </ThemedText>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.approveButton,
                        { backgroundColor: BrandColors.primary[500] },
                        hasApproved && styles.approveButtonDisabled,
                      ]}
                      onPress={() => handleApprove(redemption)}
                      disabled={hasApproved || processingId === redemption.id}
                    >
                      {processingId === redemption.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                          <ThemedText style={styles.approveButtonText}>
                            {hasApproved ? 'Approuvé' : 'Approuver'}
                          </ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 12,
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
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
  },
  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // List
  listContainer: {
    gap: 16,
  },
  // Redemption Card
  redemptionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  partnerLogo: {
    fontSize: 32,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  requestDate: {
    fontSize: 12,
    marginTop: 2,
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  requesterText: {
    fontSize: 12,
  },
  // Approvals Section
  approvalsSection: {
    marginBottom: 16,
  },
  approvalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  approvalsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  approvedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  approversList: {
    gap: 4,
  },
  approverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approverName: {
    fontSize: 12,
  },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  approveButtonDisabled: {
    opacity: 0.6,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
