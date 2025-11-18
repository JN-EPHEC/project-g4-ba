/**
 * Page de test Firebase
 * Accessible via /firebase-test
 */

import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { PrimaryButton, Card } from '@/components/ui';
import { testFirebaseConnection, testFirebaseAuth } from '@/utils/firebase-test';

export default function FirebaseTestScreen() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runConnectionTest = async () => {
    setIsRunning(true);
    setTestResults(null);

    console.log('🧪 Lancement du test de connexion Firebase...');
    const result = await testFirebaseConnection();

    setTestResults(result);
    setIsRunning(false);

    if (result.success) {
      Alert.alert('Succès', result.message);
    } else {
      Alert.alert('Erreur', result.message);
    }
  };

  const runAuthTest = async () => {
    setIsRunning(true);
    setTestResults(null);

    console.log('🧪 Lancement du test d\'authentification Firebase...');
    const result = await testFirebaseAuth();

    setTestResults(result);
    setIsRunning(false);

    if (result.success) {
      Alert.alert('Succès', result.message);
    } else {
      Alert.alert('Erreur', result.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Test Firebase
        </ThemedText>

        <ThemedText style={styles.description}>
          Cette page permet de tester la connexion Firebase et d'identifier les problèmes de configuration.
        </ThemedText>

        <Card style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Test de connexion
          </ThemedText>
          <ThemedText style={styles.cardDescription}>
            Vérifie que Firebase Auth, Firestore et Storage sont correctement initialisés.
          </ThemedText>

          <PrimaryButton
            title={isRunning ? 'Test en cours...' : 'Lancer le test de connexion'}
            onPress={runConnectionTest}
            disabled={isRunning}
            style={styles.button}
          />
        </Card>

        <Card style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Test d'authentification
          </ThemedText>
          <ThemedText style={styles.cardDescription}>
            Crée un compte de test, se connecte et se déconnecte pour vérifier que l'authentification fonctionne.
          </ThemedText>

          <PrimaryButton
            title={isRunning ? 'Test en cours...' : 'Lancer le test d\'authentification'}
            onPress={runAuthTest}
            disabled={isRunning}
            style={styles.button}
          />
        </Card>

        {testResults && (
          <Card style={[styles.card, testResults.success ? styles.successCard : styles.errorCard]}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Résultats
            </ThemedText>

            <ThemedText style={styles.resultMessage}>
              {testResults.success ? '✅' : '❌'} {testResults.message}
            </ThemedText>

            <ThemedText style={styles.detailsTitle}>Détails:</ThemedText>
            <ThemedText style={styles.details}>
              {JSON.stringify(testResults.details, null, 2)}
            </ThemedText>
          </Card>
        )}

        <Card style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Instructions
          </ThemedText>
          <ThemedText style={styles.instruction}>
            1. Ouvrez la console de votre navigateur (F12) pour voir les logs détaillés
          </ThemedText>
          <ThemedText style={styles.instruction}>
            2. Lancez les tests ci-dessus
          </ThemedText>
          <ThemedText style={styles.instruction}>
            3. Vérifiez les résultats et les messages d'erreur
          </ThemedText>
          <ThemedText style={styles.instruction}>
            4. Si le test échoue, vérifiez que:
          </ThemedText>
          <ThemedText style={styles.subInstruction}>
            • Firebase Authentication Email/Password est activé
          </ThemedText>
          <ThemedText style={styles.subInstruction}>
            • Firestore Database est créé
          </ThemedText>
          <ThemedText style={styles.subInstruction}>
            • Les règles de sécurité permettent l'écriture
          </ThemedText>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7,
  },
  button: {
    marginTop: 8,
  },
  successCard: {
    borderColor: '#10b981',
    borderWidth: 2,
  },
  errorCard: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  resultMessage: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  details: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  instruction: {
    fontSize: 14,
    marginBottom: 8,
  },
  subInstruction: {
    fontSize: 13,
    marginLeft: 16,
    marginBottom: 4,
    opacity: 0.8,
  },
});
