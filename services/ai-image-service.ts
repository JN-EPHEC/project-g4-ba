/**
 * Service pour la génération d'images par IA via Firebase Cloud Function
 * Utilise Hugging Face côté serveur pour éviter les problèmes CORS
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/config/firebase';

export interface TotemGenerationResult {
  success: boolean;
  imageBlob?: Blob;
  imageBase64?: string;
  imageUrl?: string;
  error?: string;
}

interface CloudFunctionResponse {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
}

/**
 * Service pour générer des images de totem via Cloud Function
 */
export class AIImageService {
  /**
   * Génère une image de totem via la Cloud Function
   */
  static async generateTotemImage(
    animalName: string,
    traits?: string
  ): Promise<TotemGenerationResult> {
    try {
      console.log(`[AIImageService] Génération d'image pour: ${animalName}`);

      // Appeler la Cloud Function
      const functions = getFunctions(app, 'europe-west1');
      const generateTotemImageFn = httpsCallable<
        { animalName: string; traits?: string },
        CloudFunctionResponse
      >(functions, 'generateTotemImage');

      const result = await generateTotemImageFn({ animalName, traits });

      if (result.data.success && result.data.imageBase64) {
        console.log('[AIImageService] Image générée avec succès');

        // Sur React Native, on ne peut pas créer de Blob depuis ArrayBuffer
        // On retourne directement le base64 et l'URL
        return {
          success: true,
          imageBase64: result.data.imageBase64,
          imageUrl: result.data.imageUrl,
        };
      }

      return {
        success: false,
        error: 'Réponse invalide du serveur',
      };

    } catch (error: any) {
      console.error('[AIImageService] Erreur:', error);

      // Gérer les erreurs Firebase Functions
      if (error.code) {
        switch (error.code) {
          case 'functions/unauthenticated':
            return { success: false, error: 'Vous devez être connecté pour générer une image' };
          case 'functions/unavailable':
            return { success: false, error: error.message || 'Service temporairement indisponible' };
          case 'functions/failed-precondition':
            return { success: false, error: 'Service IA non configuré' };
          default:
            return { success: false, error: error.message || 'Erreur lors de la génération' };
        }
      }

      return {
        success: false,
        error: error.message || 'Erreur inconnue',
      };
    }
  }

  /**
   * Génère une image avec retry automatique
   */
  static async generateTotemImageWithRetry(
    animalName: string,
    traits?: string,
    maxRetries: number = 2
  ): Promise<TotemGenerationResult> {
    let lastError = '';

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`[AIImageService] Tentative ${attempt + 1}/${maxRetries}`);
      const result = await this.generateTotemImage(animalName, traits);

      if (result.success) {
        return result;
      }

      lastError = result.error || 'Erreur inconnue';

      // Si c'est une erreur de chargement du modèle, attendre un peu
      if (result.error?.includes('chargement') || result.error?.includes('loading')) {
        await this.delay(5000); // Attendre 5 secondes
      } else if (attempt < maxRetries - 1) {
        await this.delay(2000); // Attendre 2 secondes avant de réessayer
      }
    }

    return {
      success: false,
      error: lastError,
    };
  }

  /**
   * Utilitaire pour attendre
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
