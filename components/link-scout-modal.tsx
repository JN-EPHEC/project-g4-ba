import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
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
  const [linkCode, setLinkCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedScout, setLinkedScout] = useState<Scout | null>(null);

  const inputRef = useRef<TextInput>(null);

  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const backgroundColor = useThemeColor({}, 'background');

  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
  };

  // Formater le code automatiquement (ABC-123-XYZ)
  const formatCode = (text: string): string => {
    // Supprimer tout ce qui n'est pas lettre ou chiffre
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Formater avec les tirets
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 9)}`;
    }
  };

  const handleCodeChange = (text: string) => {
    const formatted = formatCode(text);
    setLinkCode(formatted);
    setError(null);
  };

  const handleLinkScout = async () => {
    if (linkCode.length !== 11) {
      setError('Le code doit être au format ABC-123-XYZ');
      return;
    }

    setIsLinking(true);
    setError(null);

    try {
      const result = await ParentScoutService.linkParentToScoutByCode(parentId, linkCode);

      if (result.success && result.scout) {
        setLinkedScout(result.scout);
      } else {
        setError(result.error || 'Code invalide');
      }
    } catch (error) {
      console.error('Erreur lors de la liaison:', error);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setLinkCode('');
    setError(null);
    setLinkedScout(null);
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
    onScoutLinked();
  };

  // Affichage après liaison réussie
  if (linkedScout) {
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
            <View style={styles.successContainer}>
              <Animated.View entering={FadeInDown.duration(300).delay(100)}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={64} color={BrandColors.primary[500]} />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(300).delay(200)}>
                <ThemedText type="subtitle" style={[styles.successTitle, { color: textColor }]}>
                  Scout lié avec succès !
                </ThemedText>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(300).delay(300)}
                style={[styles.scoutCard, { backgroundColor: cardColor, borderColor: cardBorder }]}
              >
                <Avatar
                  source={linkedScout.profilePicture}
                  name={`${linkedScout.firstName} ${linkedScout.lastName}`}
                  size="large"
                />
                <ThemedText style={[styles.scoutName, { color: textColor }]}>
                  {linkedScout.firstName} {linkedScout.lastName}
                </ThemedText>
                {linkedScout.totemName && (
                  <ThemedText style={[styles.scoutTotem, { color: textSecondary }]}>
                    {linkedScout.totemEmoji || '🦊'} {linkedScout.totemName}
                  </ThemedText>
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(300).delay(400)} style={styles.successActions}>
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={handleSuccess}
                >
                  <ThemedText style={styles.successButtonText}>Continuer</ThemedText>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
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

          {/* Content */}
          <View style={styles.content}>
            {/* Instructions */}
            <View style={styles.instructions}>
              <View style={styles.instructionIcon}>
                <Ionicons name="key-outline" size={32} color={BrandColors.primary[500]} />
              </View>
              <ThemedText style={[styles.instructionTitle, { color: textColor }]}>
                Code de liaison
              </ThemedText>
              <ThemedText style={[styles.instructionText, { color: textSecondary }]}>
                Demandez le code de liaison à votre enfant ou à son animateur.
                Ce code se trouve dans le profil du scout.
              </ThemedText>
            </View>

            {/* Code Input */}
            <View style={styles.codeInputWrapper}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: cardColor,
                    borderColor: error ? '#E53935' : cardBorder,
                    color: textColor,
                  },
                ]}
                placeholder="ABC-123-XYZ"
                placeholderTextColor={textSecondary}
                value={linkCode}
                onChangeText={handleCodeChange}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={11}
                keyboardType="default"
                textAlign="center"
              />
              {error && (
                <Animated.View entering={FadeIn.duration(200)}>
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                </Animated.View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                linkCode.length !== 11 && styles.submitButtonDisabled,
              ]}
              onPress={handleLinkScout}
              disabled={linkCode.length !== 11 || isLinking}
            >
              {isLinking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="link" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.submitButtonText}>Lier le scout</ThemedText>
                </>
              )}
            </TouchableOpacity>

            {/* Help */}
            <View style={styles.helpContainer}>
              <Ionicons name="help-circle-outline" size={18} color={textSecondary} />
              <ThemedText style={[styles.helpText, { color: textSecondary }]}>
                Le code est unique à chaque scout et garantit la sécurité de vos enfants.
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
    maxWidth: 420,
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  instructions: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  instructionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BrandColors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  codeInputWrapper: {
    gap: Spacing.sm,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    textAlign: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: BrandColors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
  },
  submitButtonDisabled: {
    backgroundColor: NeutralColors.gray[300],
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  // Success state
  successContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  successIcon: {
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  scoutCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    marginVertical: Spacing.md,
    width: '100%',
  },
  scoutName: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  scoutTotem: {
    fontSize: 14,
  },
  successActions: {
    width: '100%',
    marginTop: Spacing.md,
  },
  successButton: {
    backgroundColor: BrandColors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
