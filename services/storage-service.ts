import { storage } from '@/config/firebase';
import * as FileSystem from 'expo-file-system';
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes,
    type UploadResult,
} from 'firebase/storage';

/**
 * Service pour gérer l'upload de fichiers vers Firebase Storage
 */
export class StorageService {
  /**
   * Upload une image depuis une URI locale
   */
  static async uploadImage(
    localUri: string,
    path: string,
    metadata?: { contentType?: string }
  ): Promise<string> {
    try {
      console.log('📤 Début upload image:', path);

      // Lire les bytes du fichier directement
      console.log('📄 Lecture du fichier...');
      const fileBlob = await fetch(localUri).then((response) => response.blob());
      console.log('✅ Fichier lu, taille:', fileBlob.size, 'bytes');

      // Créer la référence dans Storage
      const storageRef = ref(storage, path);
      console.log('📝 Référence Storage créée');

      // Upload le fichier avec un timeout
      console.log('⏫ Upload en cours...');
      const uploadResult: UploadResult = await Promise.race([
        uploadBytes(storageRef, fileBlob, metadata),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: L\'upload prend trop de temps. Vérifiez que Firebase Storage est activé dans la console Firebase.')), 30000)
        )
      ]);
      console.log('✅ Upload terminé');

      // Récupérer l'URL de téléchargement
      console.log('🔗 Récupération de l\'URL...');
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log('✅ URL récupérée:', downloadURL);

      return downloadURL;
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'upload de l\'image:', error);
      console.error('❌ Code:', error?.code);
      console.error('❌ Message:', error?.message);

      if (error?.code === 'storage/unauthorized') {
        throw new Error('Accès non autorisé au stockage. Vérifiez que vous êtes connecté et que Firebase Storage est configuré.');
      } else if (error?.message?.includes('Timeout')) {
        throw error;
      } else {
        throw new Error(error?.message || 'Erreur lors de l\'upload de l\'image');
      }
    }
  }

  /**
   * Upload un avatar utilisateur
   */
  static async uploadAvatar(
    userId: string,
    localUri: string
  ): Promise<string> {
    const path = `avatars/${userId}/${Date.now()}.jpg`;
    return this.uploadImage(localUri, path, {
      contentType: 'image/jpeg',
    });
  }

  /**
   * Upload une photo de défi
   */
  static async uploadChallengePhoto(
    challengeId: string,
    submissionId: string,
    localUri: string
  ): Promise<string> {
    const path = `challenges/${challengeId}/submissions/${submissionId}/${Date.now()}.jpg`;
    return this.uploadImage(localUri, path, {
      contentType: 'image/jpeg',
    });
  }

  /**
   * Upload une photo d'album
   */
  static async uploadAlbumPhoto(
    albumId: string,
    photoId: string,
    localUri: string
  ): Promise<string> {
    const path = `albums/${albumId}/photos/${photoId}/${Date.now()}.jpg`;
    return this.uploadImage(localUri, path, {
      contentType: 'image/jpeg',
    });
  }

  /**
   * Upload une photo de post communautaire
   */
  static async uploadPostPhoto(
    postId: string,
    photoId: string,
    localUri: string
  ): Promise<string> {
    const path = `posts/${postId}/photos/${photoId}/${Date.now()}.jpg`;
    return this.uploadImage(localUri, path, {
      contentType: 'image/jpeg',
    });
  }

  /**
   * Upload un document PDF
   */
  static async uploadDocument(
    documentId: string,
    localUri: string,
    fileName: string
  ): Promise<string> {
    try {
      const fileBlob = await fetch(localUri).then((response) => response.blob());

      const path = `documents/${documentId}/${fileName}`;
      const storageRef = ref(storage, path);

      const uploadResult: UploadResult = await uploadBytes(storageRef, fileBlob, {
        contentType: 'application/pdf',
      });

      const downloadURL = await getDownloadURL(uploadResult.ref);
      return downloadURL;
    } catch (error) {
      console.error('Erreur lors de l\'upload du document:', error);
      throw error;
    }
  }

  /**
   * Supprime un fichier de Storage
   */
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL de téléchargement d'un fichier
   */
  static async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'URL:', error);
      throw error;
    }
  }
}

