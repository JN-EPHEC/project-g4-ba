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

const MAX_CHARACTERS = 200;

export interface MentionableUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface PostComposerProps {
  onSubmit: (content: string, attachmentUri?: string) => Promise<void>;
  placeholder?: string;
  /** Liste des utilisateurs mentionnables */
  mentionableUsers?: MentionableUser[];
}

export function PostComposer({
  onSubmit,
  placeholder = 'Quoi de neuf dans votre unité ?',
  mentionableUsers = [],
}: PostComposerProps) {
  const [content, setContent] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const inputRef = useRef<TextInput>(null);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Card style={styles.card}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={content}
          onChangeText={handleTextChange}
          multiline
          maxLength={MAX_CHARACTERS + 50}
        />

        {/* Liste des mentions */}
        {showMentions && filteredUsers.length > 0 && (
          <View style={styles.mentionsList}>
            <ScrollView
              style={styles.mentionsScroll}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
            >
              {filteredUsers.slice(0, 5).map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.mentionItem}
                  onPress={() => handleSelectMention(user)}
                >
                  <View style={styles.mentionAvatar}>
                    <ThemedText style={styles.mentionAvatarText}>
                      {user.firstName.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.mentionName}>
                    {user.firstName} {user.lastName}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Message si aucun utilisateur trouvé */}
        {showMentions && filteredUsers.length === 0 && mentionSearch.length > 0 && (
          <View style={styles.noResults}>
            <ThemedText style={styles.noResultsText}>
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

        <View style={styles.footer}>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePickImage}
              disabled={isSubmitting}
            >
              <Ionicons name="image-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
            {mentionableUsers.length > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMentionButtonPress}
                disabled={isSubmitting}
              >
                <Ionicons name="at" size={24} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.rightSection}>
            <ThemedText
              style={[
                styles.counter,
                isOverLimit && styles.counterError,
                charactersLeft <= 20 && !isOverLimit && styles.counterWarning,
              ]}
            >
              {charactersLeft}
            </ThemedText>

            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
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
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    marginBottom: 16,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  mentionsList: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  mentionsScroll: {
    maxHeight: 200,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4A4A4A',
  },
  mentionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mentionName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  noResults: {
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#999',
    fontSize: 14,
  },
  attachmentPreview: {
    marginTop: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counter: {
    color: '#666',
    fontSize: 14,
  },
  counterWarning: {
    color: '#f59e0b',
  },
  counterError: {
    color: '#ef4444',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#3A3A3A',
  },
});
