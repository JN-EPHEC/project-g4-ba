import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { DocumentService } from '@/services/document-service';
import { UnitService } from '@/services/unit-service';
import { Animator, Document, DocumentType } from '@/types';

interface DocumentWithStats extends Document {
  signedCount: number;
  totalScouts: number;
}

export default function AuthorizationsScreen() {
  const { user } = useAuth();
  const animator = user as Animator;
  const [documents, setDocuments] = useState<DocumentWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const iconColor = useThemeColor({}, 'icon');

  const loadDocuments = useCallback(async () => {
    if (!animator?.unitId) return;

    try {
      // Récupérer les documents de l'unité
      const docs = await DocumentService.getDocuments(animator.unitId);

      // Récupérer les scouts validés de l'unité
      const scouts = await UnitService.getScoutsByUnit(animator.unitId);
      const validatedScouts = scouts.filter(s => s.validated);

      // Pour chaque document qui nécessite une signature, compter les signatures
      const docsWithStats: DocumentWithStats[] = await Promise.all(
        docs.map(async (doc) => {
          if (!doc.requiresSignature) {
            return { ...doc, signedCount: 0, totalScouts: 0 };
          }

          let signedCount = 0;
          for (const scout of validatedScouts) {
            const isSigned = await DocumentService.isDocumentSigned(doc.id, scout.id);
            if (isSigned) signedCount++;
          }

          return {
            ...doc,
            signedCount,
            totalScouts: validatedScouts.length,
          };
        })
      );

      // Trier par date de création (plus récent en premier)
      docsWithStats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setDocuments(docsWithStats);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    }
  }, [animator?.unitId]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadDocuments();
      setIsLoading(false);
    };
    load();
  }, [loadDocuments]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDocuments();
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

  const getSignatureProgress = (doc: DocumentWithStats) => {
    if (!doc.requiresSignature || doc.totalScouts === 0) return null;
    const percentage = Math.round((doc.signedCount / doc.totalScouts) * 100);
    return { percentage, signed: doc.signedCount, total: doc.totalScouts };
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={styles.loadingText}>Chargement des autorisations...</ThemedText>
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
            Autorisations
          </ThemedText>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: BrandColors.primary[500] }]}
            onPress={() => router.push('/(animator)/documents/authorizations/create')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Résumé */}
        <Card style={[styles.summaryCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText type="title" style={styles.summaryValue}>
                {documents.length}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>
                Documents
              </ThemedText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: cardBorder }]} />
            <View style={styles.summaryItem}>
              <ThemedText type="title" style={styles.summaryValue}>
                {documents.filter(d => d.requiresSignature).length}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>
                À signer
              </ThemedText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: cardBorder }]} />
            <View style={styles.summaryItem}>
              <ThemedText type="title" style={[styles.summaryValue, { color: '#059669' }]}>
                {documents.filter(d => d.requiresSignature && d.signedCount === d.totalScouts && d.totalScouts > 0).length}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: textSecondary }]}>
                Complets
              </ThemedText>
            </View>
          </View>
        </Card>

        {documents.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <Ionicons name="document-text-outline" size={48} color={textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
              Aucune autorisation
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
              Créez votre première autorisation à faire signer par les parents
            </ThemedText>
            <PrimaryButton
              title="Créer une autorisation"
              onPress={() => router.push('/(animator)/documents/authorizations/create')}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          documents.map((doc) => {
            const progress = getSignatureProgress(doc);
            const typeColor = getDocumentTypeColor(doc.type);

            return (
              <TouchableOpacity
                key={doc.id}
                onPress={() => router.push(`/(animator)/documents/authorizations/${doc.id}`)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.documentCard,
                    { backgroundColor: cardColor, borderColor: cardBorder, borderLeftColor: typeColor }
                  ]}
                >
                  <View style={styles.documentHeader}>
                    <View style={[styles.typeTag, { backgroundColor: `${typeColor}15` }]}>
                      <ThemedText style={[styles.typeTagText, { color: typeColor }]}>
                        {getDocumentTypeLabel(doc.type)}
                      </ThemedText>
                    </View>
                    {doc.requiresSignature && (
                      <View style={[styles.signatureTag, { backgroundColor: '#fef3c7' }]}>
                        <Ionicons name="create" size={12} color="#d97706" />
                        <ThemedText style={styles.signatureTagText}>Signature</ThemedText>
                      </View>
                    )}
                  </View>

                  <ThemedText type="defaultSemiBold" style={[styles.documentTitle, { color: textColor }]}>
                    {doc.title}
                  </ThemedText>

                  {doc.description && (
                    <ThemedText
                      style={[styles.documentDescription, { color: textSecondary }]}
                      numberOfLines={2}
                    >
                      {doc.description}
                    </ThemedText>
                  )}

                  {progress && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <ThemedText style={[styles.progressText, { color: textSecondary }]}>
                          Signatures : {progress.signed}/{progress.total}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.progressPercentage,
                            { color: progress.percentage === 100 ? '#059669' : '#d97706' }
                          ]}
                        >
                          {progress.percentage}%
                        </ThemedText>
                      </View>
                      <View style={[styles.progressBar, { backgroundColor: cardBorder }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${progress.percentage}%`,
                              backgroundColor: progress.percentage === 100 ? '#059669' : '#d97706'
                            }
                          ]}
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.documentFooter}>
                    <ThemedText style={[styles.dateText, { color: textSecondary }]}>
                      Créé le {doc.createdAt.toLocaleDateString('fr-FR')}
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={18} color={iconColor} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 20,
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
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
  emptyButton: {
    marginTop: 8,
  },
  documentCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  documentHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  signatureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  signatureTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d97706',
  },
  documentTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 13,
    marginBottom: 12,
  },
  progressSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  documentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
  },
});
