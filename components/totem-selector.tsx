import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { BrandColors } from '@/constants/theme';
import { Spacing, Radius } from '@/constants/design-tokens';

// Liste des animaux totem scouts traditionnels
export const TOTEM_ANIMALS = [
  // Mammifères
  { id: 'aigle', name: 'Aigle', emoji: '🦅', category: 'Oiseaux', traits: 'Vision, liberté, courage' },
  { id: 'loup', name: 'Loup', emoji: '🐺', category: 'Mammifères', traits: 'Loyauté, esprit de meute' },
  { id: 'ours', name: 'Ours', emoji: '🐻', category: 'Mammifères', traits: 'Force, protection' },
  { id: 'cerf', name: 'Cerf', emoji: '🦌', category: 'Mammifères', traits: 'Noblesse, grâce' },
  { id: 'renard', name: 'Renard', emoji: '🦊', category: 'Mammifères', traits: 'Ruse, adaptabilité' },
  { id: 'lion', name: 'Lion', emoji: '🦁', category: 'Mammifères', traits: 'Courage, leadership' },
  { id: 'tigre', name: 'Tigre', emoji: '🐯', category: 'Mammifères', traits: 'Puissance, indépendance' },
  { id: 'leopard', name: 'Léopard', emoji: '🐆', category: 'Mammifères', traits: 'Agilité, discrétion' },
  { id: 'elephant', name: 'Éléphant', emoji: '🐘', category: 'Mammifères', traits: 'Sagesse, mémoire' },
  { id: 'cheval', name: 'Cheval', emoji: '🐴', category: 'Mammifères', traits: 'Liberté, endurance' },
  { id: 'bison', name: 'Bison', emoji: '🦬', category: 'Mammifères', traits: 'Force, détermination' },
  { id: 'sanglier', name: 'Sanglier', emoji: '🐗', category: 'Mammifères', traits: 'Bravoure, ténacité' },
  { id: 'castor', name: 'Castor', emoji: '🦫', category: 'Mammifères', traits: 'Travail, ingéniosité' },
  { id: 'loutre', name: 'Loutre', emoji: '🦦', category: 'Mammifères', traits: 'Joie, curiosité' },
  { id: 'blaireau', name: 'Blaireau', emoji: '🦡', category: 'Mammifères', traits: 'Persévérance, courage' },
  { id: 'herisson', name: 'Hérisson', emoji: '🦔', category: 'Mammifères', traits: 'Protection, prudence' },
  { id: 'ecureuil', name: 'Écureuil', emoji: '🐿️', category: 'Mammifères', traits: 'Prévoyance, agilité' },
  { id: 'lapin', name: 'Lapin', emoji: '🐰', category: 'Mammifères', traits: 'Rapidité, vigilance' },

  // Oiseaux
  { id: 'hibou', name: 'Hibou', emoji: '🦉', category: 'Oiseaux', traits: 'Sagesse, intuition' },
  { id: 'faucon', name: 'Faucon', emoji: '🦅', category: 'Oiseaux', traits: 'Précision, vitesse' },
  { id: 'corbeau', name: 'Corbeau', emoji: '🐦‍⬛', category: 'Oiseaux', traits: 'Intelligence, mystère' },
  { id: 'cygne', name: 'Cygne', emoji: '🦢', category: 'Oiseaux', traits: 'Grâce, pureté' },
  { id: 'heron', name: 'Héron', emoji: '🦩', category: 'Oiseaux', traits: 'Patience, concentration' },
  { id: 'pelican', name: 'Pélican', emoji: '🦅', category: 'Oiseaux', traits: 'Générosité, dévouement' },
  { id: 'mouette', name: 'Mouette', emoji: '🕊️', category: 'Oiseaux', traits: 'Liberté, opportunisme' },
  { id: 'pic', name: 'Pic-vert', emoji: '🐦', category: 'Oiseaux', traits: 'Détermination, rythme' },

  // Reptiles et amphibiens
  { id: 'tortue', name: 'Tortue', emoji: '🐢', category: 'Reptiles', traits: 'Sagesse, longévité' },
  { id: 'serpent', name: 'Serpent', emoji: '🐍', category: 'Reptiles', traits: 'Transformation, renouveau' },
  { id: 'crocodile', name: 'Crocodile', emoji: '🐊', category: 'Reptiles', traits: 'Patience, puissance' },
  { id: 'lezard', name: 'Lézard', emoji: '🦎', category: 'Reptiles', traits: 'Adaptabilité, régénération' },
  { id: 'grenouille', name: 'Grenouille', emoji: '🐸', category: 'Amphibiens', traits: 'Transition, purification' },

  // Animaux marins
  { id: 'dauphin', name: 'Dauphin', emoji: '🐬', category: 'Marins', traits: 'Intelligence, harmonie' },
  { id: 'baleine', name: 'Baleine', emoji: '🐋', category: 'Marins', traits: 'Profondeur, communication' },
  { id: 'requin', name: 'Requin', emoji: '🦈', category: 'Marins', traits: 'Instinct, efficacité' },
  { id: 'pieuvre', name: 'Pieuvre', emoji: '🐙', category: 'Marins', traits: 'Intelligence, flexibilité' },
  { id: 'phoque', name: 'Phoque', emoji: '🦭', category: 'Marins', traits: 'Équilibre, imagination' },

  // Insectes
  { id: 'abeille', name: 'Abeille', emoji: '🐝', category: 'Insectes', traits: 'Travail, communauté' },
  { id: 'papillon', name: 'Papillon', emoji: '🦋', category: 'Insectes', traits: 'Transformation, légèreté' },
  { id: 'fourmi', name: 'Fourmi', emoji: '🐜', category: 'Insectes', traits: 'Organisation, force' },
  { id: 'libellule', name: 'Libellule', emoji: '🪰', category: 'Insectes', traits: 'Changement, adaptabilité' },
  { id: 'scarabee', name: 'Scarabée', emoji: '🪲', category: 'Insectes', traits: 'Persévérance, renaissance' },
];

interface TotemSelectorProps {
  selectedAnimal: string;
  onSelectAnimal: (animal: string) => void;
  selectedEmoji?: string;
  onSelectEmoji?: (emoji: string) => void;
}

export function TotemSelector({ selectedAnimal, onSelectAnimal, selectedEmoji, onSelectEmoji }: TotemSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customEmoji, setCustomEmoji] = useState(selectedEmoji || '');

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const selectedTotem = TOTEM_ANIMALS.find((a) => a.name === selectedAnimal);

  const filteredAnimals = searchQuery
    ? TOTEM_ANIMALS.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.traits.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : TOTEM_ANIMALS;

  // Grouper par catégorie
  const groupedAnimals = filteredAnimals.reduce((acc, animal) => {
    if (!acc[animal.category]) {
      acc[animal.category] = [];
    }
    acc[animal.category].push(animal);
    return acc;
  }, {} as Record<string, typeof TOTEM_ANIMALS>);

  const handleSelect = (animal: typeof TOTEM_ANIMALS[0]) => {
    onSelectAnimal(animal.name);
    // Mettre à jour l'emoji avec celui de l'animal sélectionné
    if (onSelectEmoji) {
      onSelectEmoji(animal.emoji);
      setCustomEmoji(animal.emoji);
    }
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleCustomEmojiChange = (emoji: string) => {
    setCustomEmoji(emoji);
    if (onSelectEmoji) {
      onSelectEmoji(emoji);
    }
  };

  // Déterminer l'emoji à afficher (priorité: emoji personnalisé > emoji de l'animal)
  const displayEmoji = customEmoji || selectedEmoji || selectedTotem?.emoji;

  return (
    <View>
      {/* Champ emoji personnalisé */}
      <View style={[styles.customEmojiContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
        <View style={styles.customEmojiLeft}>
          <View style={[styles.emojiPreview, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
            <ThemedText style={styles.emojiPreviewText}>
              {displayEmoji || '🐾'}
            </ThemedText>
          </View>
          <View style={styles.customEmojiInputWrapper}>
            <ThemedText style={[styles.customEmojiLabel, { color: textSecondary }]}>
              Mon emoji totem
            </ThemedText>
            <TextInput
              style={[styles.customEmojiInput, { color: textColor, borderColor: cardBorder }]}
              value={customEmoji}
              onChangeText={handleCustomEmojiChange}
              placeholder="Tape un emoji..."
              placeholderTextColor={textSecondary}
              maxLength={2}
            />
          </View>
        </View>
      </View>

      {/* Bouton de sélection */}
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: cardColor, borderColor: cardBorder }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {selectedTotem ? (
          <View style={styles.selectedContent}>
            <View style={[styles.emojiContainer, { backgroundColor: `${BrandColors.accent[500]}15` }]}>
              <ThemedText style={styles.emoji}>{displayEmoji || selectedTotem.emoji}</ThemedText>
            </View>
            <View style={styles.selectedInfo}>
              <ThemedText style={[styles.selectedName, { color: textColor }]}>
                {selectedTotem.name}
              </ThemedText>
              <ThemedText style={[styles.selectedTraits, { color: textSecondary }]}>
                {selectedTotem.traits}
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContent}>
            <Ionicons name="paw-outline" size={24} color={textSecondary} />
            <ThemedText style={[styles.placeholderText, { color: textSecondary }]}>
              Ou choisir parmi les animaux
            </ThemedText>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={textSecondary} />
      </TouchableOpacity>

      {/* Modal de sélection */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: cardColor, borderBottomColor: cardBorder }]}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>
              Choisis ton animal totem
            </ThemedText>
            <View style={styles.closeButtonPlaceholder} />
          </View>

          {/* Barre de recherche */}
          <View style={[styles.searchContainer, { backgroundColor: cardColor, borderColor: cardBorder }]}>
            <Ionicons name="search" size={20} color={textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Rechercher un animal..."
              placeholderTextColor={textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Liste des animaux */}
          <ScrollView style={styles.animalsList} contentContainerStyle={styles.animalsListContent}>
            {Object.entries(groupedAnimals).map(([category, animals]) => (
              <View key={category} style={styles.categorySection}>
                <ThemedText style={[styles.categoryTitle, { color: textSecondary }]}>
                  {category}
                </ThemedText>
                <View style={styles.animalsGrid}>
                  {animals.map((animal) => {
                    const isSelected = selectedAnimal === animal.name;
                    return (
                      <TouchableOpacity
                        key={animal.id}
                        style={[
                          styles.animalCard,
                          { backgroundColor: cardColor, borderColor: cardBorder },
                          isSelected && styles.animalCardSelected,
                        ]}
                        onPress={() => handleSelect(animal)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.animalEmoji,
                          { backgroundColor: isSelected ? `${BrandColors.accent[500]}20` : `${textSecondary}10` }
                        ]}>
                          <ThemedText style={styles.animalEmojiText}>{animal.emoji}</ThemedText>
                        </View>
                        <ThemedText
                          style={[
                            styles.animalName,
                            { color: textColor },
                            isSelected && { color: BrandColors.accent[500] },
                          ]}
                          numberOfLines={1}
                        >
                          {animal.name}
                        </ThemedText>
                        <ThemedText
                          style={[styles.animalTraits, { color: textSecondary }]}
                          numberOfLines={2}
                        >
                          {animal.traits}
                        </ThemedText>
                        {isSelected && (
                          <View style={styles.checkmark}>
                            <Ionicons name="checkmark-circle" size={20} color={BrandColors.accent[500]} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {filteredAnimals.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={textSecondary} />
                <ThemedText style={[styles.emptyStateText, { color: textSecondary }]}>
                  Aucun animal trouvé
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  customEmojiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  customEmojiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  emojiPreview: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPreviewText: {
    fontSize: 32,
  },
  customEmojiInputWrapper: {
    flex: 1,
  },
  customEmojiLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  customEmojiInput: {
    fontSize: 24,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    textAlign: 'center',
    width: 80,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedTraits: {
    fontSize: 13,
    marginTop: 2,
  },
  placeholderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  placeholderText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonPlaceholder: {
    width: 40,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  animalsList: {
    flex: 1,
  },
  animalsListContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  animalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  animalCard: {
    width: '31%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  animalCardSelected: {
    borderColor: BrandColors.accent[500],
    borderWidth: 2,
  },
  animalEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  animalEmojiText: {
    fontSize: 32,
  },
  animalName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  animalTraits: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  checkmark: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyStateText: {
    fontSize: 16,
  },
});
