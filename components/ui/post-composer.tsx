import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { Card } from './card';
import { BrandColors, NeutralColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/design-tokens';
import { getDisplayName, getUserTotemEmoji } from '@/src/shared/utils/totem-utils';

const MAX_CHARACTERS = 200;

export interface MentionableUser {
  id: string;
  firstName: string;
  lastName: string;
  totemAnimal?: string;
  totemEmoji?: string;
}

export interface PostComposerProps {
  onSubmit: (content: string, attachmentUri?: string) => Promise<void>;
  placeholder?: string;
  /** Liste des utilisateurs mentionnables */
  mentionableUsers?: MentionableUser[];
  /** Mode compact pour style chat */
  compact?: boolean;
}

export function PostComposer({
  onSubmit,
  placeholder = 'Quoi de neuf dans votre unité ?',
  mentionableUsers = [],
  compact = false,
}: PostComposerProps) {
  const [content, setContent] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Theme colors
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const inputBg = useThemeColor({}, 'inputBackground');
  const inputBorder = useThemeColor({}, 'inputBorder');

  const charactersLeft = MAX_CHARACTERS - content.length;
  const isOverLimit = charactersLeft < 0;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = mentionableUsers.filter((user) => {
    if (!mentionSearch) return true; // Afficher tous si pas de recherche
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const search = mentionSearch.toLowerCase();
    return (
      fullName.includes(search) ||
      user.firstName.toLowerCase().startsWith(search) ||
      user.lastName.toLowerCase().startsWith(search)
    );
  });

  const handleTextChange = (text: string) => {
    setContent(text);

    // Chercher le dernier @ dans le texte
    const lastAtIndex = text.lastIndexOf('@');

    if (lastAtIndex !== -1 && mentionableUsers.length > 0) {
      // Texte après le @
      const textAfterAt = text.substring(lastAtIndex + 1);

      // Vérifier s'il y a un espace (mention terminée) ou si c'est un nouveau @
      // On considère qu'une mention est "en cours" si le texte après @ ne contient pas d'espace
      // OU si le texte après @ est vide (juste tapé @)
      if (!textAfterAt.includes(' ') || textAfterAt === '') {
        setShowMentions(true);
        setMentionSearch(textAfterAt);
      } else {
        setShowMentions(false);
        setMentionSearch('');
      }
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  const handleSelectMention = (user: MentionableUser) => {
    // Trouver le dernier @ et remplacer tout ce qui suit par la mention
    const lastAtIndex = content.lastIndexOf('@');
    if (lastAtIndex === -1) return;

    const beforeMention = content.substring(0, lastAtIndex);
    const mentionText = `@${user.firstName} ${user.lastName} `;
    const newContent = beforeMention + mentionText;

    setContent(newContent);
    setShowMentions(false);
    setMentionSearch('');

    // Remettre le focus sur l'input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAttachmentUri(result.assets[0].uri);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentUri(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), attachmentUri || undefined);
      setContent('');
      setAttachmentUri(null);
      setShowMentions(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMentionButtonPress = () => {
    // Ajouter @ au texte et afficher la liste
    const newContent = content + '@';
    setContent(newContent);
    setShowMentions(true);
    setMentionSearch('');
    inputRef.current?.focus();
  };

  // Mode compact (style chat)
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {/* Liste des mentions (au-dessus de l'input en mode compact) */}
        {showMentions && filteredUsers.length > 0 && (
          <View style={[styles.mentionsListCompact, { backgroundColor: inputBg, borderColor: cardBorder }]}>
            <ScrollView
              style={styles.mentionsScroll}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
            >
              {filteredUsers.slice(0, 5).map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.mentionItem, { borderBottomColor: cardBorder }]}
                  onPress={() => handleSelectMention(user)}
                >
                  <View style={[styles.mentionAvatar, { backgroundColor: BrandColors.primary[500] }]}>
                    <ThemedText style={styles.mentionAvatarText}>
                      {getUserTotemEmoji(user) || user.firstName.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.mentionName, { color: textColor }]}>
                    {getDisplayName(user)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Aperçu de l'image en mode compact */}
        {attachmentUri && (
          <View style={styles.attachmentPreviewCompact}>
            <Image
              source={{ uri: attachmentUri }}
              style={styles.previewImageCompact}
              contentFit="cover"
            />
            <TouchableOpacity
              style={styles.removeButtonCompact}
              onPress={handleRemoveAttachment}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input row */}
        <View style={[styles.compactInputRow, { backgroundColor: '#F5F0E8' }]}>
          <TouchableOpacity
            style={styles.compactActionButton}
            onPress={handlePickImage}
            disabled={isSubmitting}
          >
            <Ionicons name="attach" size={22} color={textSecondary} />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={[styles.compactInput, { color: textColor }]}
            placeholder={placeholder}
            placeholderTextColor={textSecondary}
            value={content}
            onChangeText={handleTextChange}
            multiline
            maxLength={MAX_CHARACTERS + 50}
          />

          <TouchableOpacity
            style={[
              styles.compactSubmitButton,
              { backgroundColor: BrandColors.accent[500] },
              !canSubmit && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Mode normal (card)
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Card style={[styles.card, { backgroundColor: cardColor, borderColor: cardBorder }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: textColor }]}
          placeholder={placeholder}
          placeholderTextColor={textSecondary}
          value={content}
          onChangeText={handleTextChange}
          multiline
          maxLength={MAX_CHARACTERS + 50}
        />

        {/* Liste des mentions */}
        {showMentions && filteredUsers.length > 0 && (
          <View style={[styles.mentionsList, { backgroundColor: inputBg, borderColor: cardBorder }]}>
            <ScrollView
              style={styles.mentionsScroll}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
            >
              {filteredUsers.slice(0, 5).map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.mentionItem, { borderBottomColor: cardBorder }]}
                  onPress={() => handleSelectMention(user)}
                >
                  <View style={[styles.mentionAvatar, { backgroundColor: BrandColors.primary[500] }]}>
                    <ThemedText style={styles.mentionAvatarText}>
                      {getUserTotemEmoji(user) || user.firstName.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.mentionName, { color: textColor }]}>
                    {getDisplayName(user)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Message si aucun utilisateur trouvé */}
        {showMentions && filteredUsers.length === 0 && mentionSearch.length > 0 && (
          <View style={[styles.noResults, { backgroundColor: inputBg }]}>
            <ThemedText style={[styles.noResultsText, { color: textSecondary }]}>
              Aucun membre trouvé pour "{mentionSearch}"
            </ThemedText>
          </View>
        )}

        {attachmentUri && (
          <View style={styles.attachmentPreview}>
            <Image
              source={{ uri: attachmentUri }}
              style={styles.previewImage}
              contentFit="cover"
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemoveAttachment}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.footer, { borderTopColor: cardBorder }]}>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${textSecondary}10` }]}
              onPress={handlePickImage}
              disabled={isSubmitting}
            >
              <Ionicons name="image-outline" size={22} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.rightSection}>
            <ThemedText
              style={[
                styles.counter,
                { color: textSecondary },
                isOverLimit && styles.counterError,
                charactersLeft <= 20 && !isOverLimit && styles.counterWarning,
              ]}
            >
              {charactersLeft}
            </ThemedText>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: BrandColors.accent[500] },
                !canSubmit && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="paper-plane" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Mode compact (chat)
  compactContainer: {
    width: '100%',
  },
  compactInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  compactInput: {
    flex: 1,
    fontSize: 15,
    minHeight: 36,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
  },
  compactActionButton: {
    padding: Spacing.sm,
  },
  compactSubmitButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentionsListCompact: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    maxHeight: 200,
    overflow: 'hidden',
    borderWidth: 1,
  },
  attachmentPreviewCompact: {
    marginBottom: Spacing.sm,
    position: 'relative',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  previewImageCompact: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
  },
  removeButtonCompact: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.full,
  },
  // Mode normal (card)
  card: {
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  input: {
    fontSize: 16,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  mentionsList: {
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
    maxHeight: 200,
    overflow: 'hidden',
    borderWidth: 1,
  },
  mentionsScroll: {
    maxHeight: 200,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  mentionAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mentionName: {
    fontSize: 15,
    fontWeight: '500',
  },
  noResults: {
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
  },
  attachmentPreview: {
    marginTop: Spacing.md,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: Radius.lg,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  counter: {
    fontSize: 14,
  },
  counterWarning: {
    color: BrandColors.accent[500],
  },
  counterError: {
    color: '#ef4444',
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: NeutralColors.gray[300],
  },
});
