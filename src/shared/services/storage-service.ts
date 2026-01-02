import { storage } from '@/config/firebase';
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
      // Lire les bytes du fichier via fetch (fonctionne sur web et native)
      const response = await fetch(localUri);
      if (!response.ok) {
        throw new Error('Le fichier n\'existe pas ou n\'est pas accessible');
      }
      const fileBlob = await response.blob();

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
   * Upload une image de fond pour un événement
   */
  static async uploadEventImage(
    localUri: string,
    userId: string
  ): Promise<string> {
    const path = `events/${userId}/${Date.now()}.jpg`;
    return this.uploadImage(localUri, path, {
      contentType: 'image/jpeg',
    });
  }

  /**
   * Upload une pièce jointe pour un post du fil d'unité
   */
  static async uploadPostAttachment(
    unitId: string,
    localUri: string,
    fileName?: string
  ): Promise<{ url: string; type: 'image' | 'file'; name: string }> {
    const timestamp = Date.now();
    const isImage = localUri.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    if (isImage) {
      const path = `units/${unitId}/feed/${timestamp}.jpg`;
      const url = await this.uploadImage(localUri, path, {
        contentType: 'image/jpeg',
      });
      return { url, type: 'image', name: fileName || 'image.jpg' };
    } else {
      const name = fileName || `file_${timestamp}`;
      const path = `units/${unitId}/feed/${name}`;
      const url = await this.uploadImage(localUri, path);
      return { url, type: 'file', name };
    }
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
   * Upload une image de totem générée par IA (depuis un Blob)
   */
  static async uploadTotemImage(
    userId: string,
    imageBlob: Blob
  ): Promise<string> {
    try {
      const path = `totems/${userId}/${Date.now()}.png`;
      const storageRef = ref(storage, path);

      const uploadResult: UploadResult = await uploadBytes(storageRef, imageBlob, {
        contentType: 'image/png',
      });

      const downloadURL = await getDownloadURL(uploadResult.ref);
      return downloadURL;
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image totem:', error);
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

