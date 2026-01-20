import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card, PrimaryButton } from '@/components/ui';
import { DriveScreen } from '@/components/drive-screen';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { ParentScoutService } from '@/services/parent-scout-service';
import { DocumentService } from '@/services/document-service';
import { HealthService } from '@/services/health-service';
import { UnitService } from '@/services/unit-service';
import { Parent, Scout, Document, HealthRecord, UserRole, Unit } from '@/types';

interface ScoutDocuments {
  scout: Scout;
  pendingDocuments: Document[];
  signedDocuments: Document[];
  healthRecord: HealthRecord | null;
}

interface ScoutUnit {
  scout: Scout;
  unit: Unit | null;
}

type TabType = 'signatures' | 'drive';

export default function ParentDocumentsScreen() {
  const { user } = useAuth();
  const parent = user as Parent;
  const [activeTab, setActiveTab] = useState<TabType>('signatures');
  const [scoutDocuments, setScoutDocuments] = useState<ScoutDocuments[]>([]);
  const [scoutUnits, setScoutUnits] = useState<ScoutUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<{ doc: Document; scoutId: string } | null>(null);
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const loadDocuments = useCallback(async () => {
    if (!parent?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Récupérer tous les scouts du parent
      const scouts = await ParentScoutService.getScoutsByParent(parent.id);

      // Pour chaque scout, récupérer les documents, la fiche santé et l'unité
      const documentsData: ScoutDocuments[] = [];
      const unitsData: ScoutUnit[] = [];
      const unitIds = new Set<string>();

      for (const scout of scouts) {
        let pendingDocuments: Document[] = [];
        let signedDocuments: Document[] = [];
        let healthRecord: HealthRecord | null = null;
        let unit: Unit | null = null;

        if (scout.unitId) {
          unitIds.add(scout.unitId);

          // Documents en attente de signature
          pendingDocuments = await DocumentService.getPendingDocumentsForScout(
            scout.id,
            scout.unitId
          );

          // Documents déjà signés
          const signed = await DocumentService.getSignedDocumentsForScout(
            scout.id,
            scout.unitId
          );
          signedDocuments = signed.map((s) => s.document);

          // Récupérer l'unité
          try {
            unit = await UnitService.getUnitById(scout.unitId);
          } catch (error) {
            console.error('Erreur chargement unité:', error);
          }
        }

        // Fiche santé
        healthRecord = await HealthService.getHealthRecord(scout.id);

        documentsData.push({
          scout,
          pendingDocuments,
          signedDocuments,
          healthRecord,
        });

        unitsData.push({
          scout,
          unit,
        });
      }

      setScoutDocuments(documentsData);
      setScoutUnits(unitsData);

      // Sélectionner la première unité par défaut
      if (unitIds.size > 0 && !selectedUnitId) {
        setSelectedUnitId(Array.from(unitIds)[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [parent?.id, selectedUnitId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSignDocument = async () => {
    if (!selectedDocument || !parent?.id || !signatureText.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet pour signer');
      return;
    }

    try {
      setIsSigning(true);

      const docTitle = selectedDocument.doc.title;

      // Signer le document
      await DocumentService.signDocument(
        selectedDocument.doc.id,
        selectedDocument.scoutId,
        parent.id,
        signatureText.trim()
      );

      setSignatureModalVisible(false);
      setSelectedDocument(null);
      setSignatureText('');

      // Afficher la notification de succès
      setSuccessMessage(`"${docTitle}" a été signé avec succès`);
      setTimeout(() => setSuccessMessage(null), 4000);

      // Recharger les documents
      await loadDocuments();
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      Alert.alert('Erreur', 'Impossible de signer le document');
    } finally {
      setIsSigning(false);
    }
  };

  const openSignatureModal = (doc: Document, scoutId: string) => {
    setSelectedDocument({ doc, scoutId });
    setSignatureText(`${parent?.firstName} ${parent?.lastName}`);
    setSignatureModalVisible(true);
  };

  const getTotalPendingCount = () => {
    return scoutDocuments.reduce((total, sd) => total + sd.pendingDocuments.length, 0);
  };

  const getHealthRecordStatus = (healthRecord: HealthRecord | null) => {
    if (!healthRecord) {
      return { status: 'missing', label: 'Non remplie', color: '#DC2626' };
    }
    if (!healthRecord.signedByParentId) {
      return { status: 'unsigned', label: 'Non signée', color: '#D97706' };
    }
    return { status: 'complete', label: 'Complète', color: '#059669' };
  };

  // Obtenir les unités uniques
  const getUniqueUnits = () => {
    const unitMap = new Map<string, { unit: Unit; scoutNames: string[] }>();

    scoutUnits.forEach(({ scout, unit }) => {
      if (unit && scout.unitId) {
        if (unitMap.has(scout.unitId)) {
          unitMap.get(scout.unitId)!.scoutNames.push(scout.firstName);
        } else {
          unitMap.set(scout.unitId, { unit, scoutNames: [scout.firstName] });
        }
      }
    });

    return Array.from(unitMap.entries());
  };

  const uniqueUnits = getUniqueUnits();

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={styles.loadingText}>Chargement des documents...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const totalPending = getTotalPendingCount();

  // Rendu du contenu "À signer"
  const renderSignaturesTab = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
      {/* Résumé */}
      {totalPending > 0 && (
        <Card style={[styles.summaryCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          <View style={styles.summaryContent}>
            <View style={[styles.summaryIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="document-text" size={24} color="#DC2626" />
            </View>
            <View style={styles.summaryText}>
              <ThemedText style={[styles.summaryTitle, { color: '#DC2626' }]}>
                {totalPending} {totalPending === 1 ? 'document' : 'documents'} en attente
              </ThemedText>
              <ThemedText style={[styles.summarySubtitle, { color: '#7F1D1D' }]}>
                Veuillez signer les autorisations ci-dessous
              </ThemedText>
            </View>
          </View>
        </Card>
      )}

      {scoutDocuments.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="person-outline" size={48} color={textSecondary} />
          <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
            Aucun enfant associé à votre compte
          </ThemedText>
        </Card>
      ) : (
        scoutDocuments.map((sd) => {
          const healthStatus = getHealthRecordStatus(sd.healthRecord);

          return (
            <View key={sd.scout.id} style={styles.scoutSection}>
              {/* En-tête scout */}
              <View style={styles.scoutHeader}>
                <View style={[styles.scoutAvatar, { backgroundColor: BrandColors.primary[100] }]}>
                  <ThemedText style={styles.scoutAvatarText}>
                    {sd.scout.firstName.charAt(0)}
                  </ThemedText>
                </View>
                <View style={styles.scoutInfo}>
                  <ThemedText type="subtitle" style={{ color: textColor }}>
                    {sd.scout.firstName} {sd.scout.lastName}
                  </ThemedText>
                  {sd.scout.totemName && (
                    <ThemedText style={[styles.totemName, { color: textSecondary }]}>
                      {sd.scout.totemName}
                    </ThemedText>
                  )}
                </View>
              </View>

              {/* Fiche santé */}
              <Card style={[styles.healthCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="medkit" size={20} color={BrandColors.primary[500]} />
                    <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                      Fiche santé
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${healthStatus.color}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: healthStatus.color }]} />
                    <ThemedText style={[styles.statusText, { color: healthStatus.color }]}>
                      {healthStatus.label}
                    </ThemedText>
                  </View>
                </View>

                {healthStatus.status === 'missing' && (
                  <ThemedText style={[styles.healthDescription, { color: textSecondary }]}>
                    La fiche santé de votre enfant n'a pas encore été remplie.
                  </ThemedText>
                )}
                {healthStatus.status === 'unsigned' && (
                  <ThemedText style={[styles.healthDescription, { color: textSecondary }]}>
                    La fiche santé a été remplie mais nécessite votre signature.
                  </ThemedText>
                )}
                {healthStatus.status === 'complete' && sd.healthRecord && (
                  <ThemedText style={[styles.healthDescription, { color: textSecondary }]}>
                    Signée le {sd.healthRecord.signedAt?.toLocaleDateString('fr-FR')} par {sd.healthRecord.signedByParentName}
                  </ThemedText>
                )}
              </Card>

              {/* Documents en attente */}
              {sd.pendingDocuments.length > 0 && (
                <View style={styles.documentsSection}>
                  <ThemedText style={[styles.sectionLabel, { color: textSecondary }]}>
                    DOCUMENTS EN ATTENTE
                  </ThemedText>
                  {sd.pendingDocuments.map((doc) => (
                    <Card
                      key={doc.id}
                      style={[styles.documentCard, { backgroundColor: cardColor, borderColor: '#FBBF24' }]}
                    >
                      <View style={styles.documentContent}>
                        <View style={[styles.documentIcon, { backgroundColor: '#FEF3C7' }]}>
                          <Ionicons name="document-text" size={24} color="#D97706" />
                        </View>
                        <View style={styles.documentInfo}>
                          <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
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
                        </View>
                      </View>
                      <PrimaryButton
                        title="Signer"
                        onPress={() => openSignatureModal(doc, sd.scout.id)}
                        style={styles.signButton}
                      />
                    </Card>
                  ))}
                </View>
              )}

              {/* Documents signés */}
              {sd.signedDocuments.length > 0 && (
                <View style={styles.documentsSection}>
                  <ThemedText style={[styles.sectionLabel, { color: textSecondary }]}>
                    DOCUMENTS SIGNÉS
                  </ThemedText>
                  {sd.signedDocuments.map((doc) => (
                    <Card
                      key={doc.id}
                      style={[styles.documentCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
                    >
                      <View style={styles.documentContent}>
                        <View style={[styles.documentIcon, { backgroundColor: '#D1FAE5' }]}>
                          <Ionicons name="checkmark-circle" size={24} color="#059669" />
                        </View>
                        <View style={styles.documentInfo}>
                          <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                            {doc.title}
                          </ThemedText>
                          <ThemedText style={[styles.signedText, { color: '#059669' }]}>
                            Signé
                          </ThemedText>
                        </View>
                      </View>
                    </Card>
                  ))}
                </View>
              )}

              {sd.pendingDocuments.length === 0 && sd.signedDocuments.length === 0 && (
                <Card style={[styles.noDocumentsCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
                  <Ionicons name="documents-outline" size={32} color={textSecondary} />
                  <ThemedText style={[styles.noDocumentsText, { color: textSecondary }]}>
                    Aucun document pour le moment
                  </ThemedText>
                </Card>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );

  // Rendu du contenu "Documents de l'unité"
  const renderDriveTab = () => {
    if (uniqueUnits.length === 0) {
      return (
        <View style={styles.emptyDriveContainer}>
          <Ionicons name="folder-outline" size={64} color={textSecondary} />
          <ThemedText style={[styles.emptyDriveText, { color: textSecondary }]}>
            Aucune unité disponible
          </ThemedText>
          <ThemedText style={[styles.emptyDriveSubtext, { color: textSecondary }]}>
            Vos enfants doivent être inscrits dans une unité pour accéder aux documents partagés.
          </ThemedText>
        </View>
      );
    }

    // Si plusieurs unités, afficher un sélecteur
    if (uniqueUnits.length > 1) {
      return (
        <View style={{ flex: 1 }}>
          {/* Sélecteur d'unité */}
          <View style={[styles.unitSelector, { backgroundColor: cardColor, borderBottomColor: cardBorder }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitSelectorContent}>
              {uniqueUnits.map(([unitId, { unit, scoutNames }]) => (
                <TouchableOpacity
                  key={unitId}
                  style={[
                    styles.unitChip,
                    selectedUnitId === unitId && styles.unitChipActive,
                    { borderColor: selectedUnitId === unitId ? BrandColors.primary[500] : cardBorder }
                  ]}
                  onPress={() => setSelectedUnitId(unitId)}
                >
                  <ThemedText
                    style={[
                      styles.unitChipText,
                      { color: selectedUnitId === unitId ? BrandColors.primary[500] : textColor }
                    ]}
                  >
                    {unit?.name || 'Unité'}
                  </ThemedText>
                  <ThemedText style={[styles.unitChipSubtext, { color: textSecondary }]}>
                    {scoutNames.join(', ')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* DriveScreen pour l'unité sélectionnée */}
          {selectedUnitId && (
            <DriveScreen
              user={user!}
              unitId={selectedUnitId}
              userRole={UserRole.PARENT}
            />
          )}
        </View>
      );
    }

    // Une seule unité
    const [unitId] = uniqueUnits[0];
    return (
      <DriveScreen
        user={user!}
        unitId={unitId}
        userRole={UserRole.PARENT}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Toast de succès */}
      {successMessage && (
        <Animated.View
          entering={SlideInUp.duration(300)}
          exiting={SlideOutUp.duration(300)}
          style={styles.successToast}
        >
          <View style={styles.successToastContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.successTextContainer}>
              <ThemedText style={styles.successTitle}>Document signé</ThemedText>
              <ThemedText style={styles.successMessage}>{successMessage}</ThemedText>
            </View>
            <TouchableOpacity onPress={() => setSuccessMessage(null)} style={styles.successCloseButton}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Header avec titre et onglets */}
      <View style={styles.headerContainer}>
        <ThemedText type="title" style={[styles.title, { color: BrandColors.primary[600] }]}>
          Documents
        </ThemedText>

        {/* Onglets */}
        <View style={[styles.tabsContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'signatures' && [styles.tabActive, { backgroundColor: BrandColors.primary[500] }]
            ]}
            onPress={() => setActiveTab('signatures')}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={activeTab === 'signatures' ? '#FFFFFF' : textSecondary}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === 'signatures' ? '#FFFFFF' : textSecondary }
              ]}
            >
              À signer
            </ThemedText>
            {totalPending > 0 && (
              <View style={[styles.tabBadge, activeTab === 'signatures' && styles.tabBadgeActive]}>
                <ThemedText style={styles.tabBadgeText}>{totalPending}</ThemedText>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'drive' && [styles.tabActive, { backgroundColor: BrandColors.primary[500] }]
            ]}
            onPress={() => setActiveTab('drive')}
          >
            <Ionicons
              name="folder-outline"
              size={18}
              color={activeTab === 'drive' ? '#FFFFFF' : textSecondary}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === 'drive' ? '#FFFFFF' : textSecondary }
              ]}
            >
              Fichiers partagés
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'signatures' ? renderSignaturesTab() : renderDriveTab()}

      {/* Modal de signature */}
      <Modal
        visible={signatureModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSignatureModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={{ color: textColor }}>
                Signer le document
              </ThemedText>
              <TouchableOpacity onPress={() => setSignatureModalVisible(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            {selectedDocument && (
              <>
                <Card style={[styles.modalDocumentInfo, { backgroundColor: cardColor, borderColor: cardBorder }]}>
                  <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
                    {selectedDocument.doc.title}
                  </ThemedText>
                  {selectedDocument.doc.description && (
                    <ThemedText style={[styles.modalDocDescription, { color: textSecondary }]}>
                      {selectedDocument.doc.description}
                    </ThemedText>
                  )}
                </Card>

                <View style={styles.signatureSection}>
                  <ThemedText style={[styles.signatureLabel, { color: textColor }]}>
                    Entrez votre nom complet pour signer :
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.signatureInput,
                      { backgroundColor: cardColor, borderColor: cardBorder, color: textColor },
                    ]}
                    value={signatureText}
                    onChangeText={setSignatureText}
                    placeholder="Votre nom complet"
                    placeholderTextColor={textSecondary}
                  />
                  <ThemedText style={[styles.signatureHint, { color: textSecondary }]}>
                    En signant, vous confirmez avoir lu et accepté les termes du document.
                  </ThemedText>
                </View>

                <PrimaryButton
                  title={isSigning ? 'Signature...' : 'Confirmer la signature'}
                  onPress={handleSignDocument}
                  disabled={isSigning || !signatureText.trim()}
                  style={styles.confirmButton}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: BrandColors.primary[500],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 100,
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
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  summarySubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
  },
  scoutSection: {
    marginBottom: 24,
  },
  scoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  scoutAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoutAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.primary[600],
  },
  scoutInfo: {
    flex: 1,
  },
  totemName: {
    fontSize: 13,
    marginTop: 2,
  },
  healthCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  healthDescription: {
    fontSize: 13,
  },
  documentsSection: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  documentCard: {
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  signButton: {
    marginTop: 4,
  },
  signedText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  noDocumentsCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  noDocumentsText: {
    fontSize: 14,
  },
  // Drive tab
  emptyDriveContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyDriveText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDriveSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  unitSelector: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  unitSelectorContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  unitChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 120,
  },
  unitChipActive: {
    backgroundColor: `${BrandColors.primary[500]}10`,
  },
  unitChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unitChipSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalDocumentInfo: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  modalDocDescription: {
    fontSize: 13,
    marginTop: 8,
  },
  signatureSection: {
    marginBottom: 20,
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  signatureInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  signatureHint: {
    fontSize: 12,
  },
  confirmButton: {
    marginTop: 8,
  },
  // Toast de succès
  successToast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: '#059669',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  successToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  successIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  successMessage: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginTop: 2,
  },
  successCloseButton: {
    padding: 4,
  },
});
