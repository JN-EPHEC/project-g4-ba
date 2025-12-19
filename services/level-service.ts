import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  LevelDefinition,
  ScoutLevelInfo,
  DEFAULT_LEVELS,
} from '@/types';

/**
 * Service pour gérer les niveaux des scouts
 */
export class LevelService {
  private static readonly LEVELS_COLLECTION = 'levels';
  private static cachedLevels: LevelDefinition[] | null = null;

  /**
   * Convertit un document Firestore en LevelDefinition
   */
  private static convertToLevelDefinition(data: DocumentData): LevelDefinition {
    return {
      id: data.id,
      name: data.name,
      minPoints: data.minPoints,
      maxPoints: data.maxPoints,
      icon: data.icon,
      color: data.color,
      order: data.order,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  }

  /**
   * Initialise les niveaux par défaut dans Firebase (à appeler une seule fois)
   */
  static async initializeDefaultLevels(): Promise<void> {
    try {
      const existingLevels = await this.getAllLevels();

      if (existingLevels.length === 0) {
        console.log('Initializing default levels...');

        for (const level of DEFAULT_LEVELS) {
          const levelRef = doc(collection(db, this.LEVELS_COLLECTION));
          await setDoc(levelRef, {
            ...level,
            createdAt: Timestamp.fromDate(new Date()),
          });
        }

        console.log(`${DEFAULT_LEVELS.length} levels initialized`);
        // Invalider le cache après initialisation
        this.cachedLevels = null;
      }
    } catch (error) {
      console.error('Error initializing levels:', error);
    }
  }

  /**
   * Récupère tous les niveaux (avec cache)
   */
  static async getAllLevels(): Promise<LevelDefinition[]> {
    // Retourner le cache si disponible
    if (this.cachedLevels) {
      return this.cachedLevels;
    }

    try {
      const q = query(
        collection(db, this.LEVELS_COLLECTION),
        orderBy('order', 'asc')
      );

      const snapshot = await getDocs(q);
      const levels = snapshot.docs.map(doc =>
        this.convertToLevelDefinition({ id: doc.id, ...doc.data() })
      );

      // Mettre en cache
      this.cachedLevels = levels;
      return levels;
    } catch (error) {
      console.error('Error fetching levels:', error);
      return [];
    }
  }

  /**
   * Calcule les informations de niveau pour un scout basé sur ses points
   */
  static async getScoutLevelInfo(points: number): Promise<ScoutLevelInfo | null> {
    try {
      // Initialiser les niveaux si nécessaire
      await this.initializeDefaultLevels();

      const levels = await this.getAllLevels();

      if (levels.length === 0) {
        console.warn('No levels found in database');
        return null;
      }

      // Trouver le niveau actuel basé sur les points
      let currentLevel: LevelDefinition | null = null;
      let nextLevel: LevelDefinition | null = null;

      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const isInRange =
          points >= level.minPoints &&
          (level.maxPoints === -1 || points <= level.maxPoints);

        if (isInRange) {
          currentLevel = level;
          nextLevel = i < levels.length - 1 ? levels[i + 1] : null;
          break;
        }
      }

      // Si aucun niveau trouvé, utiliser le premier niveau
      if (!currentLevel) {
        currentLevel = levels[0];
        nextLevel = levels.length > 1 ? levels[1] : null;
      }

      // Calculer la progression
      const pointsInCurrentLevel = points - currentLevel.minPoints;
      const isMaxLevel = currentLevel.maxPoints === -1;

      let pointsToNextLevel = 0;
      let progress = 100;

      if (!isMaxLevel && nextLevel) {
        const levelRange = currentLevel.maxPoints - currentLevel.minPoints + 1;
        pointsToNextLevel = currentLevel.maxPoints - points + 1;
        progress = Math.min(100, Math.round((pointsInCurrentLevel / levelRange) * 100));
      }

      return {
        currentLevel,
        nextLevel,
        currentPoints: points,
        pointsInCurrentLevel,
        pointsToNextLevel,
        progress,
        isMaxLevel,
      };
    } catch (error) {
      console.error('Error calculating scout level info:', error);
      return null;
    }
  }

  /**
   * Récupère le niveau suivant pour un niveau donné
   */
  static async getNextLevel(currentLevelOrder: number): Promise<LevelDefinition | null> {
    const levels = await this.getAllLevels();
    return levels.find(l => l.order === currentLevelOrder + 1) || null;
  }

  /**
   * Récupère un niveau par son ordre
   */
  static async getLevelByOrder(order: number): Promise<LevelDefinition | null> {
    const levels = await this.getAllLevels();
    return levels.find(l => l.order === order) || null;
  }

  /**
   * Invalide le cache des niveaux (utile après une mise à jour)
   */
  static invalidateCache(): void {
    this.cachedLevels = null;
  }

  /**
   * Calcule les informations de niveau de manière synchrone avec les niveaux par défaut
   * (Utile quand on ne peut pas attendre Firebase)
   */
  static getScoutLevelInfoSync(points: number): ScoutLevelInfo {
    // Créer des LevelDefinition à partir des DEFAULT_LEVELS
    const levels: LevelDefinition[] = DEFAULT_LEVELS.map((level, index) => ({
      ...level,
      id: `default-${index}`,
      createdAt: new Date(),
    }));

    // Trouver le niveau actuel
    let currentLevel = levels[0];
    let nextLevel: LevelDefinition | null = levels.length > 1 ? levels[1] : null;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const isInRange =
        points >= level.minPoints &&
        (level.maxPoints === -1 || points <= level.maxPoints);

      if (isInRange) {
        currentLevel = level;
        nextLevel = i < levels.length - 1 ? levels[i + 1] : null;
        break;
      }
    }

    // Calculer la progression
    const pointsInCurrentLevel = points - currentLevel.minPoints;
    const isMaxLevel = currentLevel.maxPoints === -1;

    let pointsToNextLevel = 0;
    let progress = 100;

    if (!isMaxLevel && nextLevel) {
      const levelRange = currentLevel.maxPoints - currentLevel.minPoints + 1;
      pointsToNextLevel = currentLevel.maxPoints - points + 1;
      progress = Math.min(100, Math.round((pointsInCurrentLevel / levelRange) * 100));
    }

    return {
      currentLevel,
      nextLevel,
      currentPoints: points,
      pointsInCurrentLevel,
      pointsToNextLevel,
      progress,
      isMaxLevel,
    };
  }
}
