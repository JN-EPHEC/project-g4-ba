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

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  FolderCard,
  FileCard,
  FileUploader,
  FolderCreator,
} from '@/src/features/drive/components';
import { DriveService } from '@/src/shared/services/drive-service';
import type { StorageFolder, StorageFile } from '@/src/shared/types/document';
import type { AnyUser } from '@/types';
import { UserRole } from '@/types';

interface DriveScreenProps {
  user: AnyUser;
  unitId: string;
  userRole: UserRole;
}

type ViewMode = 'folders' | 'folder-content' | 'search';

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
  const [showFolderCreator, setShowFolderCreator] = useState(false);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});

  const canManage = userRole === UserRole.ANIMATOR;

  const loadFolders = useCallback(async () => {
    if (!unitId) return;

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

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <ThemedText style={styles.loadingText}>
            Chargement des documents...
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
            tintColor="#3b82f6"
          />
        }
      >
        {/* En-tête */}
        <View style={styles.header}>
          {currentFolder ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#3b82f6" />
            </TouchableOpacity>
          ) : null}
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={styles.title}>
              {currentFolder ? currentFolder.name : 'Documents'}
            </ThemedText>
            {currentFolder && (
              <ThemedText style={styles.breadcrumb}>
                {folderPath.map((f) => f.name).join(' / ')}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Barre de recherche */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des fichiers..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Actions pour les animateurs */}
        {canManage && !showUploader && !showFolderCreator && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.actions}>
            {currentFolder && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowUploader(true)}
              >
                <Ionicons name="cloud-upload" size={20} color="#3b82f6" />
                <ThemedText style={styles.actionText}>Ajouter un fichier</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, !currentFolder && styles.actionButtonFull]}
              onPress={() => setShowFolderCreator(true)}
            >
              <Ionicons name="folder-open" size={20} color="#3b82f6" />
              <ThemedText style={styles.actionText}>Nouveau dossier</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Uploader */}
        {showUploader && currentFolder && (
          <FileUploader
            folderId={currentFolder.id}
            unitId={unitId}
            userId={user.id}
            onUploadComplete={handleUploadComplete}
            onCancel={() => setShowUploader(false)}
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
            <ThemedText style={styles.sectionTitle}>
              Résultats ({searchResults.length})
            </ThemedText>
            {searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>
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
            {folders.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyIcon}>📁</ThemedText>
                <ThemedText style={styles.emptyTitle}>Aucun dossier</ThemedText>
                <ThemedText style={styles.emptyText}>
                  Les dossiers de documents apparaîtront ici.
                </ThemedText>
              </View>
            ) : (
              folders.map((folder, index) => (
                <Animated.View
                  key={folder.id}
                  entering={FadeInDown.duration(300).delay(index * 50)}
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
                <ThemedText style={styles.sectionTitle}>Dossiers</ThemedText>
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
                <ThemedText style={styles.sectionTitle}>
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
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyIcon}>📄</ThemedText>
                <ThemedText style={styles.emptyTitle}>Dossier vide</ThemedText>
                <ThemedText style={styles.emptyText}>
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
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#999999',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
  },
  breadcrumb: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
  },
  actionButtonFull: {
    flex: undefined,
    width: '100%',
  },
  actionText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
