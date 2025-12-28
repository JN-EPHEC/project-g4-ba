import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { DocumentService } from '@/services/document-service';
import { UnitService } from '@/services/unit-service';
import { Animator, Document, DocumentType, Scout, DocumentSignature } from '@/types';

interface ScoutSignatureStatus {
  scout: Scout;
  isSigned: boolean;
  signature?: DocumentSignature;
}

export default function AuthorizationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const animator = user as Animator;

  const [document, setDocument] = useState<Document | null>(null);
  const [signatureStatuses, setSignatureStatuses] = useState<ScoutSignatureStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const loadDocument = useCallback(async () => {
    if (!id || !animator?.unitId) return;

    try {
      // Charger le document
      const doc = await DocumentService.getDocumentById(id);
      setDocument(doc);

      if (doc && doc.requiresSignature) {
        // Charger les scouts de l'unité
        const scouts = await UnitService.getScoutsByUnit(animator.unitId);
        const validatedScouts = scouts.filter(s => s.validated);

        // Vérifier le statut de signature pour chaque scout
        const statuses: ScoutSignatureStatus[] = await Promise.all(
          validatedScouts.map(async (scout) => {
            const signature = await DocumentService.getDocumentSignature(doc.id, scout.id);
            return {
              scout,
              isSigned: !!signature,
              signature: signature || undefined,
            };
          })
        );

        // Trier : non signés en premier, puis par nom
        statuses.sort((a, b) => {
          if (a.isSigned !== b.isSigned) return a.isSigned ? 1 : -1;
          return a.scout.lastName.localeCompare(b.scout.lastName);
        });

        setSignatureStatuses(statuses);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du document:', error);
    }
  }, [id, animator?.unitId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadDocument();
      setIsLoading(false);
    };
    load();
  }, [loadDocument]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDocument();
    setIsRefreshing(false);
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case DocumentType.AUTHORIZATION:
        return 'Autorisation';
      case DocumentType.MEDICAL:
        return 'Médical';
      case DocumentType.GENERAL:
        return 'Général';
      case DocumentType.PAYMENT:
        return 'Paiement';
      default:
        return 'Document';
    }
  };

  const getDocumentTypeColor = (type: DocumentType) => {
    switch (type) {
      case DocumentType.AUTHORIZATION:
        return '#f59e0b';
      case DocumentType.MEDICAL:
        return '#ef4444';
      case DocumentType.GENERAL:
        return BrandColors.primary[500];
      case DocumentType.PAYMENT:
        return '#8b5cf6';
      default:
        return textSecondary;
    }
  };

  const signedCount = signatureStatuses.filter(s => s.isSigned).length;
  const totalCount = signatureStatuses.length;
  const percentage = totalCount > 0 ? Math.round((signedCount / totalCount) * 100) : 0;

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

  if (!document) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="document-text-outline" size={48} color={textSecondary} />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            Document introuvable
          </ThemedText>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={{ color: BrandColors.primary[500] }}>Retour</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const typeColor = getDocumentTypeColor(document.type);

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
            Détails
          </ThemedText>
        </View>

        {/* Document Info */}
        <Card style={[styles.documentCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
          <View style={styles.documentHeader}>
            <View style={[styles.typeTag, { backgroundColor: `${typeColor}15` }]}>
              <ThemedText style={[styles.typeTagText, { color: typeColor }]}>
                {getDocumentTypeLabel(document.type)}
              </ThemedText>
            </View>
            {document.requiresSignature && (
              <View style={[styles.signatureTag, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="create" size={12} color="#d97706" />
                <ThemedText style={styles.signatureTagText}>Signature requise</ThemedText>
              </View>
            )}
          </View>

          <ThemedText type="subtitle" style={[styles.documentTitle, { color: textColor }]}>
            {document.title}
          </ThemedText>

          {document.description && (
            <ThemedText style={[styles.documentDescription, { color: textSecondary }]}>
              {document.description}
            </ThemedText>
          )}

          <View style={[styles.metaRow, { borderTopColor: cardBorder }]}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={textSecondary} />
              <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                Créé le {document.createdAt.toLocaleDateString('fr-FR')}
              </ThemedText>
            </View>
            {document.expiryDate && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={textSecondary} />
                <ThemedText style={[styles.metaText, { color: textSecondary }]}>
                  Expire le {document.expiryDate.toLocaleDateString('fr-FR')}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Progress */}
        {document.requiresSignature && totalCount > 0 && (
          <Card style={[styles.progressCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <View style={styles.progressHeader}>
              <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                Progression des signatures
              </ThemedText>
              <ThemedText
                type="defaultSemiBold"
                style={{ color: percentage === 100 ? '#059669' : '#d97706' }}
              >
                {percentage}%
              </ThemedText>
            </View>

            <View style={[styles.progressBar, { backgroundColor: cardBorder }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percentage}%`,
                    backgroundColor: percentage === 100 ? '#059669' : '#d97706',
                  }
                ]}
              />
            </View>

            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#059669' }]} />
                <ThemedText style={[styles.statText, { color: textSecondary }]}>
                  {signedCount} signé{signedCount > 1 ? 's' : ''}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#d97706' }]} />
                <ThemedText style={[styles.statText, { color: textSecondary }]}>
                  {totalCount - signedCount} en attente
                </ThemedText>
              </View>
            </View>
          </Card>
        )}

        {/* Signature List */}
        {document.requiresSignature && (
          <>
            <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
              STATUT PAR SCOUT ({totalCount})
            </ThemedText>

            {signatureStatuses.length === 0 ? (
              <Card style={[styles.emptyCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
                <Ionicons name="people-outline" size={32} color={textSecondary} />
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  Aucun scout validé dans l'unité
                </ThemedText>
              </Card>
            ) : (
              signatureStatuses.map((status) => (
                <Card
                  key={status.scout.id}
                  style={[
                    styles.scoutCard,
                    {
                      backgroundColor: cardColor,
                      borderColor: status.isSigned ? '#059669' : cardBorder,
                      borderLeftColor: status.isSigned ? '#059669' : '#d97706',
                    }
                  ]}
                >
                  <View style={styles.scoutRow}>
                    <View style={[
                      styles.scoutAvatar,
                      { backgroundColor: status.isSigned ? '#d1fae5' : '#fef3c7' }
                    ]}>
                      <ThemedText style={[
                        styles.scoutAvatarText,
                        { color: status.isSigned ? '#059669' : '#d97706' }
                      ]}>
                        {status.scout.firstName.charAt(0)}
                      </ThemedText>
                    </View>

                    <View style={styles.scoutInfo}>
                      <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                        {status.scout.firstName} {status.scout.lastName}
                      </ThemedText>
                      {status.scout.totemName && (
                        <ThemedText style={[styles.totemName, { color: textSecondary }]}>
                          {status.scout.totemName}
                        </ThemedText>
                      )}
                      {status.signature && (
                        <ThemedText style={[styles.signatureInfo, { color: '#059669' }]}>
                          Signé le {status.signature.signedAt.toLocaleDateString('fr-FR')}
                        </ThemedText>
                      )}
                    </View>

                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: status.isSigned ? '#d1fae5' : '#fef3c7' }
                    ]}>
                      <Ionicons
                        name={status.isSigned ? 'checkmark-circle' : 'time'}
                        size={20}
                        color={status.isSigned ? '#059669' : '#d97706'}
                      />
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
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
    gap: 12,
    marginBottom: 20,
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
  documentCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  signatureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  signatureTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  documentTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  documentDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  progressCard: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  scoutCard: {
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  scoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoutAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoutAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoutInfo: {
    flex: 1,
  },
  totemName: {
    fontSize: 12,
    marginTop: 2,
  },
  signatureInfo: {
    fontSize: 11,
    marginTop: 4,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
