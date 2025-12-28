import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { Radius, Spacing } from '@/constants/design-tokens';
import { ParentScoutService } from '@/services/parent-scout-service';
import { Scout } from '@/types';

interface LinkScoutModalProps {
  visible: boolean;
  onClose: () => void;
  parentId: string;
  onScoutLinked: () => void;
}

export function LinkScoutModal({
  visible,
  onClose,
  parentId,
  onScoutLinked,
}: LinkScoutModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Scout[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await ParentScoutService.searchScouts(query, parentId);
      setSearchResults(results);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsSearching(false);
    }
  }, [parentId]);

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: onConfirm },
      ]);
    }
  };

  const handleSelectScout = (scout: Scout) => {
    setSelectedScout(scout);
    showConfirm(
      'Confirmer la liaison',
      `Voulez-vous lier ${scout.firstName} ${scout.lastName} à votre compte ?`,
      () => handleLinkScout(scout)
    );
  };

  const handleLinkScout = async (scout: Scout) => {
    setIsLinking(true);
    try {
      await ParentScoutService.linkParentToScout(parentId, scout.id);
      showAlert(
        'Succès',
        `${scout.firstName} ${scout.lastName} a été lié à votre compte.`,
        () => {
          handleClose();
          onScoutLinked();
        }
      );
    } catch (error) {
      console.error('Erreur lors de la liaison:', error);
      showAlert('Erreur', 'Impossible de lier ce scout. Veuillez réessayer.');
    } finally {
      setIsLinking(false);
      setSelectedScout(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedScout(null);
    onClose();
  };

  const renderScoutItem = ({ item, index }: { item: Scout; index: number }) => (
    <Animated.View entering={FadeInDown.duration(200).delay(index * 50)}>
      <TouchableOpacity
        style={[
          styles.scoutItem,
          { backgroundColor: cardColor, borderColor: cardBorder },
        ]}
        onPress={() => handleSelectScout(item)}
        activeOpacity={0.7}
        disabled={isLinking}
      >
        <Avatar
          source={item.profilePicture}
          name={`${item.firstName} ${item.lastName}`}
          size="medium"
        />
        <View style={styles.scoutInfo}>
          <ThemedText style={[styles.scoutName, { color: textColor }]}>
            {item.firstName} {item.lastName}
          </ThemedText>
          {item.totemName && (
            <ThemedText style={[styles.scoutTotem, { color: textSecondary }]}>
              {item.totemEmoji || '🦊'} {item.totemName}
            </ThemedText>
          )}
        </View>
        <Ionicons name="add-circle" size={28} color={BrandColors.primary[500]} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.modalContainer, { backgroundColor }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" style={[styles.title, { color: textColor }]}>
              Lier un scout
            </ThemedText>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <Ionicons name="search" size={20} color={textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Rechercher par nom, prénom ou totem..."
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color={textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          <View style={styles.resultsContainer}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={BrandColors.primary[500]} />
                <ThemedText style={[styles.loadingText, { color: textSecondary }]}>
                  Recherche en cours...
                </ThemedText>
              </View>
            ) : searchQuery.length < 2 ? (
              <View style={styles.emptyState}>
                <Ionicons name="person-add-outline" size={48} color={textSecondary} />
                <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                  Rechercher un scout
                </ThemedText>
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  Entrez au moins 2 caractères pour rechercher un scout par son nom, prénom ou totem.
                </ThemedText>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={textSecondary} />
                <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
                  Aucun résultat
                </ThemedText>
                <ThemedText style={[styles.emptyText, { color: textSecondary }]}>
                  Aucun scout trouvé pour "{searchQuery}". Vérifiez l'orthographe ou essayez un autre nom.
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderScoutItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>

          {/* Loading overlay when linking */}
          {isLinking && (
            <View style={styles.linkingOverlay}>
              <ActivityIndicator size="large" color={BrandColors.primary[500]} />
              <ThemedText style={[styles.linkingText, { color: textColor }]}>
                Liaison en cours...
              </ThemedText>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: NeutralColors.gray[200],
  },
  title: {
    fontSize: 20,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  resultsContainer: {
    flex: 1,
    minHeight: 200,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  scoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  scoutInfo: {
    flex: 1,
  },
  scoutName: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoutTotem: {
    fontSize: 13,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  linkingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
