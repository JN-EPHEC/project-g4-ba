import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/context/auth-context';
import { GDPRService } from '@/services/gdpr-service';
import { BrandColors } from '@/constants/theme';
import { auth } from '@/config/firebase';
import { UserRole } from '@/types';

const STATUS_BAR_HEIGHT = Platform.select({
  ios: Constants.statusBarHeight || 44,
  android: Constants.statusBarHeight || 24,
  web: 0,
  default: 0,
});

interface DeleteAccountScreenProps {
  userRole: UserRole;
}

export function DeleteAccountScreen({ userRole }: DeleteAccountScreenProps) {
  const { user, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  const getDeletedDataList = () => {
    const commonData = [
      'Votre profil et informations personnelles',
      'Vos messages et publications',
      'Vos photos de profil',
    ];

    switch (userRole) {
      case UserRole.SCOUT:
        return [
          ...commonData,
          'Votre fiche sante (allergies, medicaments, contacts d\'urgence)',
          'Vos soumissions de defis',
          'Vos points et progression',
          'Vos badges obtenus',
        ];
      case UserRole.PARENT:
        return [
          ...commonData,
          'Les liens avec les comptes de vos enfants',
          'Les signatures de documents',
        ];
      case UserRole.ANIMATOR:
        return [
          ...commonData,
          'Votre role d\'animateur sera retire',
        ];
      default:
        return commonData;
    }
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }

    if (!user) {
      setError('Utilisateur non connecte');
      return;
    }

    // Confirmation finale
    const confirmMessage = 'Cette action est IRREVERSIBLE. Toutes vos donnees seront definitivement supprimees. Etes-vous sur de vouloir continuer ?';

    if (Platform.OS === 'web') {
      if (!window.confirm(confirmMessage)) {
        return;
      }
    } else {
      return new Promise<void>((resolve) => {
        Alert.alert(
          'Confirmation finale',
          confirmMessage,
          [
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => resolve(),
            },
            {
              text: 'Supprimer definitivement',
              style: 'destructive',
              onPress: async () => {
                await performDeletion();
                resolve();
              },
            },
          ]
        );
      });
    }

    await performDeletion();
  };

  const performDeletion = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // 1. Re-authentifier l'utilisateur
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('Utilisateur non connecte');
      }

      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Supprimer toutes les donnees
      await GDPRService.deleteUserData(user!.id, userRole);

      // 3. Afficher un message de confirmation
      if (Platform.OS === 'web') {
        window.alert('Votre compte a ete supprime avec succes. Vous allez etre redirige vers la page d\'accueil.');
        router.replace('/(auth)/auth');
      } else {
        Alert.alert(
          'Compte supprime',
          'Votre compte a ete supprime avec succes.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/auth'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);

      let errorMessage = 'Une erreur est survenue lors de la suppression';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Mot de passe incorrect';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Veuillez reessayer plus tard.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Supprimer mon compte
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning Box */}
        <View style={[styles.warningBox, { backgroundColor: '#FEE2E2', borderColor: '#DC2626' }]}>
          <Ionicons name="warning" size={24} color="#DC2626" />
          <View style={styles.warningContent}>
            <ThemedText style={[styles.warningTitle, { color: '#991B1B' }]}>
              Action irreversible
            </ThemedText>
            <ThemedText style={[styles.warningText, { color: '#B91C1C' }]}>
              La suppression de votre compte est definitive et ne peut pas etre annulee.
            </ThemedText>
          </View>
        </View>

        {/* What will be deleted */}
        <View style={[styles.section, { backgroundColor: cardColor, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>
            Donnees qui seront supprimees :
          </ThemedText>
          {getDeletedDataList().map((item, index) => (
            <View key={index} style={styles.bulletContainer}>
              <Ionicons name="close-circle" size={18} color="#DC2626" />
              <ThemedText style={[styles.bulletText, { color: textSecondary }]}>
                {item}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Password confirmation */}
        <View style={[styles.section, { backgroundColor: cardColor, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>
            Confirmez votre identite
          </ThemedText>
          <ThemedText style={[styles.sectionDescription, { color: textSecondary }]}>
            Pour des raisons de securite, veuillez entrer votre mot de passe pour confirmer la suppression.
          </ThemedText>

          <View style={[styles.inputWrapper, { borderColor: error ? '#DC2626' : borderColor }]}>
            <Ionicons name="lock-closed-outline" size={20} color={textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Votre mot de passe"
              placeholderTextColor={textSecondary}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isDeleting}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={textSecondary}
              />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          activeOpacity={0.8}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <ThemedText style={styles.deleteButtonText}>
                Supprimer definitivement mon compte
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel link */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isDeleting}
        >
          <ThemedText style={[styles.cancelButtonText, { color: BrandColors.primary[500] }]}>
            Annuler et conserver mon compte
          </ThemedText>
        </TouchableOpacity>

        {/* GDPR info */}
        <View style={styles.gdprInfo}>
          <Ionicons name="information-circle-outline" size={16} color={textSecondary} />
          <ThemedText style={[styles.gdprText, { color: textSecondary }]}>
            Conformement au RGPD, vous avez le droit de demander la suppression de vos donnees personnelles.
            Cette action supprime definitivement toutes vos informations de nos serveurs.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: STATUS_BAR_HEIGHT + 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  warningBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#DC2626',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  gdprInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  gdprText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
