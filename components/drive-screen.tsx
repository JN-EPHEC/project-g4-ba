import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  FolderCard,
  FileCard,
  FileUploader,
  FolderCreator,
  ImageUploader,
} from '@/src/features/drive/components';
import { DriveService } from '@/src/shared/services/drive-service';
import type { StorageFolder, StorageFile } from '@/src/shared/types/document';
import { FolderCategory, FOLDER_LABELS } from '@/src/shared/types/document';
import type { AnyUser } from '@/types';
import { UserRole } from '@/types';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/design-tokens';

interface DriveScreenProps {
  user: AnyUser;
  unitId: string;
  userRole: UserRole;
}

type ViewMode = 'folders' | 'folder-content' | 'search';
type FilterCategory = 'all' | FolderCategory;

// Génère dynamiquement les onglets de filtre à partir de FOLDER_LABELS
const FILTER_TABS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'Tous' },
  ...Object.entries(FOLDER_LABELS).map(([key, label]) => ({
    key: key as FolderCategory,
    label,
  })),
];

export function DriveScreen({ user, unitId, userRole }: DriveScreenProps) {
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<StorageFolder | null>(null);
  const [folderPath, setFolderPath] = useState<StorageFolder[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('folders');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showFolderCreator, setShowFolderCreator] = useState(false);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');

  const canManage = userRole === UserRole.ANIMATOR;

  // Vérifier si on est dans un dossier Photos (ou sous-dossier d'un dossier Photos)
  const isInPhotosFolder = useCallback(() => {
    if (!currentFolder) return false;
    // Vérifier le dossier courant
    if (currentFolder.category === FolderCategory.PHOTOS) return true;
    // Vérifier le chemin (si un parent est un dossier Photos)
    return folderPath.some(f => f.category === FolderCategory.PHOTOS);
  }, [currentFolder, folderPath]);

  // Les scouts peuvent ajouter des photos dans les dossiers Photos
  const canAddPhotos = isInPhotosFolder();
  const iconColor = useThemeColor({}, 'icon');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const loadFolders = useCallback(async () => {
    if (!unitId) {
      setIsLoading(false);
      return;
    }

    try {
      // S'assurer que les dossiers par défaut existent
      if (canManage) {
        await DriveService.ensureDefaultFolders(unitId, user.id);
      }

      const loadedFolders = await DriveService.getFolders(unitId);
      setFolders(loadedFolders);

      // Charger le nombre de fichiers par dossier
      const counts: Record<string, number> = {};
      await Promise.all(
        loadedFolders.map(async (folder) => {
          const folderFiles = await DriveService.getFiles(folder.id);
          counts[folder.id] = folderFiles.length;
        })
      );
      setFileCounts(counts);
    } catch (error) {
      console.error('[Drive] Erreur chargement dossiers:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [unitId, user.id, canManage]);

  const loadFolderContent = useCallback(async (folder: StorageFolder) => {
    try {
      const folderFiles = await DriveService.getFiles(folder.id);
      setFiles(folderFiles);

      // Charger aussi les sous-dossiers
      const subFolders = await DriveService.getFolders(folder.unitId, folder.id);
      setFolders(subFolders);
    } catch (error) {
      console.error('[Drive] Erreur chargement contenu:', error);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (currentFolder) {
      loadFolderContent(currentFolder);
      setIsRefreshing(false);
    } else {
      loadFolders();
    }
  };

  const handleOpenFolder = (folder: StorageFolder) => {
    setCurrentFolder(folder);
    setFolderPath((prev) => [...prev, folder]);
    setViewMode('folder-content');
    loadFolderContent(folder);
  };

  const handleBack = () => {
    if (folderPath.length > 1) {
      const newPath = folderPath.slice(0, -1);
      const parentFolder = newPath[newPath.length - 1];
      setFolderPath(newPath);
      setCurrentFolder(parentFolder);
      loadFolderContent(parentFolder);
    } else {
      setCurrentFolder(null);
      setFolderPath([]);
      setViewMode('folders');
      setFiles([]);
      loadFolders();
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      if (viewMode === 'search') {
        setViewMode(currentFolder ? 'folder-content' : 'folders');
      }
      return;
    }

    setViewMode('search');
    try {
      const results = await DriveService.searchFiles(unitId, query.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('[Drive] Erreur recherche:', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await DriveService.deleteFile(fileId);
      if (viewMode === 'search') {
        setSearchResults((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (error) {
      console.error('[Drive] Erreur suppression fichier:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await DriveService.deleteFolder(folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      // Mettre à jour les compteurs de fichiers
      setFileCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[folderId];
        return newCounts;
      });
    } catch (error) {
      console.error('[Drive] Erreur suppression dossier:', error);
    }
  };

  const handleUploadComplete = () => {
    setShowUploader(false);
    setShowImageUploader(false);
    if (currentFolder) {
      loadFolderContent(currentFolder);
    }
  };

  const handleFolderCreated = () => {
    setShowFolderCreator(false);
    if (currentFolder) {
      loadFolderContent(currentFolder);
    } else {
      loadFolders();
    }
  };

  // Filtrer les dossiers par catégorie
  const filteredFolders = folders.filter((folder) => {
    if (selectedFilter === 'all') return true;
    return folder.category === selectedFilter;
  });

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary[500]} />
          <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
            Chargement des documents...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!unitId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={BrandColors.accent[500]} />
          <ThemedText type="subtitle" style={[styles.emptyTitle, { color: textColor }]}>
            Aucune unité associée
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
            Votre compte n'est pas encore rattaché à une unité scoute. Contactez votre animateur.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={BrandColors.primary[500]}
          />
        }
      >
        {/* En-tête */}
        <View style={styles.header}>
          {currentFolder ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={BrandColors.primary[500]} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={[styles.title, { color: textColor }]}>
              {currentFolder ? currentFolder.name : 'Documents'}
            </ThemedText>
            {currentFolder && (
              <ThemedText style={[styles.breadcrumb, { color: textSecondary }]}>
                {folderPath.map((f) => f.name).join(' / ')}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Barre de recherche */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.searchContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}
        >
          <Ionicons name="search" size={20} color={textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Rechercher des fichiers..."
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={textSecondary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filtres par catégorie - seulement en vue dossiers */}
        {viewMode === 'folders' && (
          <Animated.View entering={FadeIn.duration(300).delay(100)} style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {FILTER_TABS.map((tab) => {
                const isActive = selectedFilter === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.filterTab,
                      {
                        backgroundColor: isActive ? BrandColors.primary[500] : cardColor,
                        borderColor: isActive ? BrandColors.primary[500] : cardBorder,
                      }
                    ]}
                    onPress={() => setSelectedFilter(tab.key)}
                  >
                    <ThemedText
                      style={[
                        styles.filterTabText,
                        { color: isActive ? '#FFFFFF' : textSecondary }
                      ]}
                    >
                      {tab.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Bouton Nouveau dossier (pour animateurs, en vue dossiers) */}
        {canManage && viewMode === 'folders' && !showFolderCreator && (
          <Animated.View entering={FadeIn.duration(300).delay(150)}>
            <TouchableOpacity
              style={[styles.newFolderButton, { borderColor: BrandColors.primary[500] }]}
              onPress={() => setShowFolderCreator(true)}
            >
              <Ionicons name="add" size={24} color={BrandColors.primary[500]} />
              <ThemedText style={[styles.newFolderText, { color: BrandColors.primary[500] }]}>
                Nouveau dossier
              </ThemedText>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Actions en vue contenu de dossier - Animateurs */}
        {canManage && viewMode === 'folder-content' && !showUploader && !showImageUploader && !showFolderCreator && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${BrandColors.accent[500]}15`, borderColor: BrandColors.accent[500] }]}
              onPress={() => setShowUploader(true)}
            >
              <Ionicons name="cloud-upload" size={20} color={BrandColors.accent[500]} />
              <ThemedText style={[styles.actionText, { color: BrandColors.accent[500] }]}>Ajouter un fichier</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${BrandColors.primary[500]}15`, borderColor: BrandColors.primary[500] }]}
              onPress={() => setShowFolderCreator(true)}
            >
              <Ionicons name="folder-open" size={20} color={BrandColors.primary[500]} />
              <ThemedText style={[styles.actionText, { color: BrandColors.primary[500] }]}>Nouveau dossier</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Bouton Ajouter une photo - Scouts dans dossiers Photos */}
        {!canManage && canAddPhotos && viewMode === 'folder-content' && !showImageUploader && (
          <Animated.View entering={FadeIn.duration(300)}>
            <TouchableOpacity
              style={[styles.addPhotoButton, { backgroundColor: BrandColors.secondary[500] }]}
              onPress={() => setShowImageUploader(true)}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <ThemedText style={styles.addPhotoButtonText}>Ajouter une photo</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Uploader fichiers (animateurs) */}
        {showUploader && currentFolder && (
          <FileUploader
            folderId={currentFolder.id}
            unitId={unitId}
            userId={user.id}
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUploader(false)}
          />
        )}

        {/* Uploader photos (scouts dans dossiers Photos) */}
        {showImageUploader && currentFolder && (
          <ImageUploader
            folderId={currentFolder.id}
            unitId={unitId}
            userId={user.id}
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowImageUploader(false)}
          />
        )}

        {/* Créateur de dossier */}
        {showFolderCreator && (
          <FolderCreator
            unitId={unitId}
            userId={user.id}
            parentId={currentFolder?.id}
            onCreated={handleFolderCreated}
            onCancel={() => setShowFolderCreator(false)}
          />
        )}

        {/* Résultats de recherche */}
        {viewMode === 'search' && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
              Résultats ({searchResults.length})
            </ThemedText>
            {searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  Aucun fichier trouvé pour "{searchQuery}"
                </ThemedText>
              </View>
            ) : (
              searchResults.map((file, index) => (
                <Animated.View
                  key={file.id}
                  entering={FadeInDown.duration(300).delay(index * 30)}
                >
                  <FileCard
                    file={file}
                    canDelete={canManage}
                    onDelete={() => handleDeleteFile(file.id)}
                  />
                </Animated.View>
              ))
            )}
          </View>
        )}

        {/* Liste des dossiers (vue principale) */}
        {viewMode === 'folders' && (
          <View style={styles.section}>
            {/* Compteur et tri */}
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.folderCount, { color: textSecondary }]}>
                {filteredFolders.length} dossier{filteredFolders.length !== 1 ? 's' : ''}
              </ThemedText>
              <TouchableOpacity style={styles.sortButton}>
                <ThemedText style={[styles.sortText, { color: BrandColors.primary[500] }]}>
                  Trier
                </ThemedText>
                <Ionicons name="chevron-down" size={16} color={BrandColors.primary[500]} />
              </TouchableOpacity>
            </View>

            {/* Dossier spécial Autorisations pour les animateurs */}
            {canManage && selectedFilter === 'all' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <View style={[styles.authorizationsFolderCard, { backgroundColor: cardColor, borderColor: cardBorder }]}>
                  <TouchableOpacity
                    onPress={() => router.push('/(animator)/documents/authorizations')}
                    activeOpacity={0.7}
                    style={styles.authorizationsFolderMain}
                  >
                    <View style={[styles.authorizationsFolderIcon, { backgroundColor: '#fef3c715' }]}>
                      <Ionicons name="folder" size={28} color="#f59e0b" />
                    </View>
                    <View style={styles.authorizationsFolderContent}>
                      <ThemedText style={[styles.authorizationsFolderName, { color: textColor }]} numberOfLines={1}>
                        Autorisations à signer
                      </ThemedText>
                      <View style={styles.authorizationsFolderMeta}>
                        <View style={[styles.authorizationsCategoryBadge, { backgroundColor: '#fef3c7' }]}>
                          <ThemedText style={styles.authorizationsCategoryText}>
                            Signatures
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {filteredFolders.length === 0 && !(canManage && selectedFilter === 'all') ? (
              <View style={[styles.emptyState, { backgroundColor: cardColor, borderColor: cardBorder }]}>
                <Ionicons name="folder-open-outline" size={48} color={textSecondary} />
                <ThemedText style={[styles.emptyTitle, { color: textColor }]}>Aucun dossier</ThemedText>
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  {selectedFilter !== 'all'
                    ? `Aucun dossier dans la catégorie "${FILTER_TABS.find(t => t.key === selectedFilter)?.label}"`
                    : 'Les dossiers de documents apparaîtront ici.'}
                </ThemedText>
              </View>
            ) : (
              filteredFolders.map((folder, index) => (
                <Animated.View
                  key={folder.id}
                  entering={FadeInDown.duration(300).delay((canManage && selectedFilter === 'all' ? index + 1 : index) * 50)}
                >
                  <FolderCard
                    folder={folder}
                    fileCount={fileCounts[folder.id]}
                    onPress={() => handleOpenFolder(folder)}
                    canDelete={canManage}
                    onDelete={() => handleDeleteFolder(folder.id)}
                  />
                </Animated.View>
              ))
            )}
          </View>
        )}

        {/* Contenu d'un dossier */}
        {viewMode === 'folder-content' && (
          <View style={styles.section}>
            {/* Sous-dossiers */}
            {folders.length > 0 && (
              <>
                <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>Dossiers</ThemedText>
                {folders.map((folder, index) => (
                  <Animated.View
                    key={folder.id}
                    entering={FadeInDown.duration(300).delay(index * 30)}
                  >
                    <FolderCard
                      folder={folder}
                      onPress={() => handleOpenFolder(folder)}
                      canDelete={canManage}
                      onDelete={() => handleDeleteFolder(folder.id)}
                    />
                  </Animated.View>
                ))}
              </>
            )}

            {/* Fichiers */}
            {files.length > 0 && (
              <>
                <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
                  Fichiers ({files.length})
                </ThemedText>
                {files.map((file, index) => (
                  <Animated.View
                    key={file.id}
                    entering={FadeInDown.duration(300).delay(index * 30)}
                  >
                    <FileCard
                      file={file}
                      canDelete={canManage}
                      onDelete={() => handleDeleteFile(file.id)}
                    />
                  </Animated.View>
                ))}
              </>
            )}

            {/* État vide */}
            {files.length === 0 && folders.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: cardColor, borderColor: cardBorder }]}>
                <Ionicons name="document-outline" size={48} color={textSecondary} />
                <ThemedText style={[styles.emptyTitle, { color: textColor }]}>Dossier vide</ThemedText>
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  {canManage
                    ? 'Ajoutez des fichiers ou créez des sous-dossiers.'
                    : 'Aucun fichier dans ce dossier.'}
                </ThemedText>
              </View>
            )}
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
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 60,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  breadcrumb: {
    fontSize: 13,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.md,
  },
  filterContainer: {
    marginBottom: Spacing.md,
  },
  filterScroll: {
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  authorizationsFolderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  authorizationsFolderMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  authorizationsFolderIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorizationsFolderContent: {
    flex: 1,
    gap: 4,
  },
  authorizationsFolderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  authorizationsFolderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  authorizationsCategoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  authorizationsCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  },
  newFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  newFolderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addPhotoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  folderCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
