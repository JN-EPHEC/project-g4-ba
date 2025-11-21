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
      // Lire le fichier
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        throw new Error('Le fichier n\'existe pas');
      }

      // Lire les bytes du fichier
      const fileBlob = await fetch(localUri).then((response) => response.blob());

      // Créer la référence dans Storage
      const storageRef = ref(storage, path);

      // Upload le fichier
      const uploadResult: UploadResult = await uploadBytes(
        storageRef,
        fileBlob,
        metadata
      );

      // Récupérer l'URL de téléchargement
      const downloadURL = await getDownloadURL(uploadResult.ref);

      return downloadURL;
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      throw error;
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

