import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';

/**
 * Composant Storage Firebase
 * Permet d'uploader un fichier de test vers Firebase Storage
 */
export default function StorageComponent() {
  const [uploadStatus, setUploadStatus] = useState('');
  const [downloadURL, setDownloadURL] = useState('');

  // Upload quelques octets de test
  const handleUploadTestBytes = async () => {
    try {
      setUploadStatus('Upload en cours...');
      setDownloadURL('');

      // Créer un petit fichier de test (quelques octets)
      const timestamp = Date.now();
      const testData = `Test upload - ${new Date().toISOString()}`;
      const blob = new Blob([testData], { type: 'text/plain' });

      // Créer une référence vers le fichier dans Storage
      const storageRef = ref(storage, `images/TEST_${timestamp}.txt`);

      // Uploader le fichier
      console.log('📤 Upload du fichier de test...');
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('✅ Upload réussi!', snapshot);

      // Récupérer l'URL de téléchargement
      const url = await getDownloadURL(storageRef);
      console.log('🔗 URL de téléchargement:', url);

      setUploadStatus('Upload réussi!');
      setDownloadURL(url);
      Alert.alert('Succès', `Fichier uploadé!\nNom: TEST_${timestamp}.txt`);
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'upload:', error);
      setUploadStatus(`Erreur: ${error.message}`);
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Storage - Test Upload</Text>

      <Text style={styles.description}>
        Cliquez sur le bouton ci-dessous pour uploader un petit fichier de test vers Firebase Storage.
      </Text>

      <Pressable style={styles.button} onPress={handleUploadTestBytes}>
        <Text style={styles.buttonText}>Upload test bytes</Text>
      </Pressable>

      {uploadStatus && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{uploadStatus}</Text>
        </View>
      )}

      {downloadURL && (
        <View style={styles.urlContainer}>
          <Text style={styles.urlLabel}>URL de téléchargement:</Text>
          <Text style={styles.urlText} numberOfLines={3}>
            {downloadURL}
          </Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Informations:</Text>
        <Text style={styles.infoText}>
          • Le fichier est uploadé dans le dossier "images/" de votre Storage
        </Text>
        <Text style={styles.infoText}>
          • Le nom du fichier contient un timestamp pour éviter les doublons
        </Text>
        <Text style={styles.infoText}>
          • Vérifiez votre console Firebase Storage pour voir le fichier
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  urlContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  urlLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  urlText: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  infoContainer: {
    backgroundColor: '#e8f4f8',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
});
