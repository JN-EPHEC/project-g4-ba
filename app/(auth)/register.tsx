import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// DateTimePicker only for native platforms
const DateTimePicker = Platform.OS !== 'web'
  ? require('@react-native-community/datetimepicker').default
  : null;

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: new Date(2010, 0, 1),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, dateOfBirth: selectedDate });
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "L'email est requis";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    const today = new Date();
    const age = today.getFullYear() - formData.dateOfBirth.getFullYear();
    if (age < 5 || age > 100) {
      newErrors.dateOfBirth = 'La date de naissance doit correspondre à un âge entre 5 et 100 ans';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    // Rediriger vers la sélection du rôle
    router.push({
      pathname: '/(auth)/role-selection',
      params: {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth.toISOString(),
      },
    });
    setIsLoading(false);
  };

  const handleBackToLogin = () => {
    router.push('/(auth)/auth');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header vert */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Ionicons name="person-add" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.headerTitle}>Créer un compte</Text>
        <Text style={styles.headerSubtitle}>Rejoignez l'aventure WeCamp</Text>
      </View>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Formulaire d'inscription */}
        <View style={styles.card}>
          {/* Prénom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom</Text>
            <View style={[styles.inputWrapper, errors.firstName && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Jean"
                placeholderTextColor="#6B7280"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                autoComplete="given-name"
              />
            </View>
            {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
          </View>

          {/* Nom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom</Text>
            <View style={[styles.inputWrapper, errors.lastName && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Dupont"
                placeholderTextColor="#6B7280"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                autoComplete="family-name"
              />
            </View>
            {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="votre.email@exemple.com"
                placeholderTextColor="#6B7280"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          {/* Date de naissance */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de naissance</Text>
            {Platform.OS === 'web' ? (
              <View style={[styles.inputWrapper, errors.dateOfBirth && styles.inputError]}>
                <Ionicons name="calendar-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <input
                  type="date"
                  value={formData.dateOfBirth.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    if (!isNaN(date.getTime())) {
                      setFormData({ ...formData, dateOfBirth: date });
                    }
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  min="1920-01-01"
                  style={{
                    flex: 1,
                    paddingTop: 14,
                    paddingBottom: 14,
                    fontSize: 16,
                    color: '#1A1A1A',
                    border: 'none',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.inputWrapper, errors.dateOfBirth && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <Text style={styles.dateText}>{formatDate(formData.dateOfBirth)}</Text>
              </TouchableOpacity>
            )}
            {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}
          </View>

          {Platform.OS !== 'web' && showDatePicker && DateTimePicker && (
            <DateTimePicker
              value={formData.dateOfBirth}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
            />
          )}

          {/* Mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6B7280"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                autoComplete="password-new"
              />
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {/* Confirmer mot de passe */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6B7280"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry
                autoComplete="password-new"
              />
            </View>
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Continuer</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Lien vers connexion */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  header: {
    backgroundColor: '#2D5A3D',
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 8,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  dateText: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#2D5A3D',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 15,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D97B4A',
  },
});
