import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { Card } from './card';

const MAX_CHARACTERS = 200;

export interface PostComposerProps {
  onSubmit: (content: string, attachmentUri?: string) => Promise<void>;
  placeholder?: string;
}

export function PostComposer({
  onSubmit,
  placeholder = 'Quoi de neuf dans votre unité ?',
}: PostComposerProps) {
  const [content, setContent] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charactersLeft = MAX_CHARACTERS - content.length;
  const isOverLimit = charactersLeft < 0;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Card style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={content}
          onChangeText={setContent}
          multiline
          maxLength={MAX_CHARACTERS + 50}
        />

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
