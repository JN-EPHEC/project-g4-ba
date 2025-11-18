import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

/**
 * Page d'accueil - Landing page
 * Affiche des boutons pour naviguer vers Auth, Storage et Firestore
 */
export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exemple Firebase + Expo</Text>
      <Text style={styles.subtitle}>
        Authentification, Storage et Firestore
      </Text>

      <View style={styles.buttonContainer}>
        <Link href="/auth" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Aller à authentification</Text>
          </Pressable>
        </Link>

        <Link href="/storage" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Aller au storage</Text>
          </Pressable>
        </Link>

        <Link href="/firestore" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Exemple Firestore (CRUD)</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
