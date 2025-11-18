import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

/**
 * Composant d'authentification Firebase
 * Permet de créer un compte, se connecter et se déconnecter
 */
export default function AuthComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);

  // Écouter les changements d'état d'authentification
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Créer un compte
  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Succès', `Compte créé pour ${userCredential.user.email}`);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Erreur lors de la création du compte:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  // Se connecter
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Succès', `Connecté en tant que ${userCredential.user.email}`);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  // Se déconnecter
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('Succès', 'Déconnecté avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authentification Firebase</Text>

      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.userText}>Connecté en tant que:</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userId}>UID: {user.uid}</Text>

          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.buttonText}>Se déconnecter</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />

          <View style={styles.buttonGroup}>
            <Pressable style={styles.button} onPress={handleSignIn}>
              <Text style={styles.buttonText}>Se connecter</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.signUpButton]} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Créer un compte</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonGroup: {
    gap: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signUpButton: {
    backgroundColor: '#34C759',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  userText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
});
