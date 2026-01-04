import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  Timestamp,
  updateDoc,
  addDoc,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  BadgeDefinition,
  ScoutBadge,
  BadgeWithDetails,
  BadgeCategory,
  BadgeCondition,
} from '@/types';

/**
 * Service pour gérer les badges
 */
export class BadgeService {
  private static readonly BADGES_COLLECTION = 'badges';
  private static readonly SCOUT_BADGES_COLLECTION = 'scoutBadges';

  /**
   * Convertit un document Firestore en BadgeDefinition
   * Supporte les anciennes et nouvelles structures de données
   */
  private static convertToBadgeDefinition(data: DocumentData): BadgeDefinition {
    // Migration: convertir l'ancienne structure vers la nouvelle
    let condition: BadgeCondition;

    if (data.condition) {
      // Nouvelle structure
      condition = data.condition;
    } else {
      // Ancienne structure - migration automatique
      if (data.isManual) {
        condition = { type: 'manual' };
      } else if (data.requiredPoints) {
        condition = { type: 'points', value: data.requiredPoints };
      } else if (data.requiredChallenges) {
        condition = { type: 'challenges', value: data.requiredChallenges };
      } else {
        condition = { type: 'manual' };
      }
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      category: data.category as BadgeCategory,
      condition,
      // Champs legacy pour rétrocompatibilité
      requiredPoints: data.requiredPoints,
      requiredChallenges: data.requiredChallenges,
      isManual: data.isManual,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      createdBy: data.createdBy,
    };
  }

  /**
   * Convertit un document Firestore en ScoutBadge
   */
  private static convertToScoutBadge(data: DocumentData): ScoutBadge {
    return {
      id: data.id,
      scoutId: data.scoutId,
      badgeId: data.badgeId,
      unlockedAt: data.unlockedAt?.toDate() || new Date(),
      awardedBy: data.awardedBy,
      comment: data.comment,
    };
  }

  /**
   * Récupère toutes les définitions de badges actifs
   */
  static async getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
    try {
      const q = query(
        collection(db, this.BADGES_COLLECTION),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const badges = snapshot.docs.map(doc =>
        this.convertToBadgeDefinition({ id: doc.id, ...doc.data() })
      );

      // Tri côté client pour éviter l'index composite
      return badges.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching badge definitions:', error);
      return [];
    }
  }

  /**
   * Récupère toutes les définitions de badges (incluant les inactifs)
   * Pour l'admin uniquement
   */
  static async getAllBadgeDefinitionsAdmin(): Promise<BadgeDefinition[]> {
    try {
      const snapshot = await getDocs(collection(db, this.BADGES_COLLECTION));
      const badges = snapshot.docs.map(doc =>
        this.convertToBadgeDefinition({ id: doc.id, ...doc.data() })
      );

      return badges.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching all badge definitions:', error);
      return [];
    }
  }

  /**
   * Crée un nouveau badge (Admin WeCamp uniquement)
   */
  static async createBadge(data: {
    name: string;
    description: string;
    icon: string;
    category: BadgeCategory;
    condition: BadgeCondition;
    createdBy?: string;
  }): Promise<BadgeDefinition> {
    try {
      const badgeData = {
        name: data.name,
        description: data.description,
        icon: data.icon,
        category: data.category,
        condition: data.condition,
        isActive: true,
        createdAt: Timestamp.now(),
        createdBy: data.createdBy || null,
      };

      const docRef = await addDoc(collection(db, this.BADGES_COLLECTION), badgeData);

      return {
        id: docRef.id,
        ...badgeData,
        createdAt: new Date(),
      } as BadgeDefinition;
    } catch (error) {
      console.error('Error creating badge:', error);
      throw error;
    }
  }

  /**
   * Met à jour un badge existant (Admin WeCamp uniquement)
   */
  static async updateBadge(
    badgeId: string,
    data: Partial<{
      name: string;
      description: string;
      icon: string;
      category: BadgeCategory;
      condition: BadgeCondition;
    }>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, this.BADGES_COLLECTION, badgeId), data);
    } catch (error) {
      console.error('Error updating badge:', error);
      throw error;
    }
  }

  /**
   * Supprime un badge (soft delete - désactive)
   */
  static async deleteBadge(badgeId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.BADGES_COLLECTION, badgeId), {
        isActive: false,
      });
    } catch (error) {
      console.error('Error deleting badge:', error);
      throw error;
    }
  }

  /**
   * Supprime définitivement un badge (hard delete)
   */
  static async hardDeleteBadge(badgeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.BADGES_COLLECTION, badgeId));
    } catch (error) {
      console.error('Error hard deleting badge:', error);
      throw error;
    }
  }

  /**
   * Supprime tous les badges (pour reset complet)
   */
  static async deleteAllBadges(): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, this.BADGES_COLLECTION));
      let count = 0;
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, this.BADGES_COLLECTION, docSnap.id));
        count++;
      }
      return count;
    } catch (error) {
      console.error('Error deleting all badges:', error);
      throw error;
    }
  }

  /**
   * Réactive un badge précédemment supprimé
   */
  static async reactivateBadge(badgeId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.BADGES_COLLECTION, badgeId), {
        isActive: true,
      });
    } catch (error) {
      console.error('Error reactivating badge:', error);
      throw error;
    }
  }

  /**
   * Compte le nombre total de badges attribués
   */
  static async getTotalBadgesAwarded(): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, this.SCOUT_BADGES_COLLECTION));
      return snapshot.size;
    } catch (error) {
      console.error('Error counting badges awarded:', error);
      return 0;
    }
  }

  /**
   * Récupère une définition de badge par ID
   */
  static async getBadgeDefinitionById(badgeId: string): Promise<BadgeDefinition | null> {
    try {
      const badgeDoc = await getDoc(doc(db, this.BADGES_COLLECTION, badgeId));

      if (!badgeDoc.exists()) {
        return null;
      }

      return this.convertToBadgeDefinition({ id: badgeDoc.id, ...badgeDoc.data() });
    } catch (error) {
      console.error('Error fetching badge definition:', error);
      return null;
    }
  }

  /**
   * Récupère tous les badges d'un scout
   */
  static async getScoutBadges(scoutId: string): Promise<ScoutBadge[]> {
    try {
      const q = query(
        collection(db, this.SCOUT_BADGES_COLLECTION),
        where('scoutId', '==', scoutId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc =>
        this.convertToScoutBadge({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Error fetching scout badges:', error);
      return [];
    }
  }

  /**
   * Récupère les badges avec détails pour un scout
   * Inclut les badges débloqués et la progression vers les autres
   */
  static async getBadgesWithDetailsForScout(
    scoutId: string,
    scoutPoints: number = 0,
    completedChallengesCount: number = 0,
    challengesByCategory?: Record<string, number>
  ): Promise<BadgeWithDetails[]> {
    try {
      // Récupérer toutes les définitions de badges
      const definitions = await this.getAllBadgeDefinitions();

      // Récupérer les badges du scout
      const scoutBadges = await this.getScoutBadges(scoutId);
      const unlockedBadgeIds = new Set(scoutBadges.map(b => b.badgeId));

      // Créer la liste des badges avec détails
      const badgesWithDetails: BadgeWithDetails[] = definitions.map(definition => {
        const scoutBadge = scoutBadges.find(b => b.badgeId === definition.id);
        const unlocked = unlockedBadgeIds.has(definition.id);

        // Calculer la progression pour les badges non débloqués
        let progress: number | undefined;
        if (!unlocked && definition.condition.type !== 'manual') {
          const condition = definition.condition;

          if (condition.type === 'points' && condition.value) {
            progress = Math.min(100, Math.round((scoutPoints / condition.value) * 100));
          } else if (condition.type === 'challenges' && condition.value) {
            progress = Math.min(100, Math.round((completedChallengesCount / condition.value) * 100));
          } else if (condition.type === 'challenges_category' && condition.value && condition.challengeCategory) {
            const categoryCount = challengesByCategory?.[condition.challengeCategory] || 0;
            progress = Math.min(100, Math.round((categoryCount / condition.value) * 100));
          }
        }

        return {
          id: definition.id,
          name: definition.name,
          icon: definition.icon,
          description: definition.description,
          category: definition.category,
          unlocked,
          unlockedAt: scoutBadge?.unlockedAt,
          progress,
        };
      });

      // Trier: débloqués en premier, puis par progression
      return badgesWithDetails.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        if (!a.unlocked && !b.unlocked) {
          return (b.progress || 0) - (a.progress || 0);
        }
        return 0;
      });
    } catch (error) {
      console.error('Error fetching badges with details:', error);
      return [];
    }
  }

  /**
   * Attribue un badge à un scout
   */
  static async awardBadge(
    scoutId: string,
    badgeId: string,
    awardedBy?: string,
    comment?: string
  ): Promise<ScoutBadge | null> {
    try {
      // Vérifier que le badge existe
      const badge = await this.getBadgeDefinitionById(badgeId);
      if (!badge) {
        throw new Error('Badge not found');
      }

      // Vérifier que le scout n'a pas déjà ce badge
      const existingBadges = await this.getScoutBadges(scoutId);
      if (existingBadges.some(b => b.badgeId === badgeId)) {
        console.log('Scout already has this badge');
        return null;
      }

      const scoutBadgeData: Record<string, any> = {
        scoutId,
        badgeId,
        unlockedAt: Timestamp.fromDate(new Date()),
      };

      // N'ajouter que les champs définis (Firebase n'accepte pas undefined)
      if (awardedBy) {
        scoutBadgeData.awardedBy = awardedBy;
      }
      if (comment) {
        scoutBadgeData.comment = comment;
      }

      const scoutBadgeRef = doc(collection(db, this.SCOUT_BADGES_COLLECTION));
      await setDoc(scoutBadgeRef, scoutBadgeData);

      return this.convertToScoutBadge({ id: scoutBadgeRef.id, ...scoutBadgeData });
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  /**
   * Vérifie et attribue automatiquement les badges basés sur les points/défis
   */
  static async checkAndAwardAutomaticBadges(
    scoutId: string,
    scoutPoints: number,
    completedChallengesCount: number,
    challengesByCategory?: Record<string, number>
  ): Promise<ScoutBadge[]> {
    try {
      const definitions = await this.getAllBadgeDefinitions();
      const existingBadges = await this.getScoutBadges(scoutId);
      const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));

      const newBadges: ScoutBadge[] = [];

      for (const definition of definitions) {
        // Skip si déjà obtenu ou si manuel
        if (existingBadgeIds.has(definition.id) || definition.condition.type === 'manual') {
          continue;
        }

        let shouldAward = false;
        const condition = definition.condition;

        if (condition.type === 'points' && condition.value && scoutPoints >= condition.value) {
          shouldAward = true;
        }

        if (condition.type === 'challenges' && condition.value && completedChallengesCount >= condition.value) {
          shouldAward = true;
        }

        if (condition.type === 'challenges_category' && condition.value && condition.challengeCategory) {
          const categoryCount = challengesByCategory?.[condition.challengeCategory] || 0;
          if (categoryCount >= condition.value) {
            shouldAward = true;
          }
        }

        if (shouldAward) {
          const newBadge = await this.awardBadge(scoutId, definition.id, undefined, 'Automatiquement attribué');
          if (newBadge) {
            newBadges.push(newBadge);
          }
        }
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking automatic badges:', error);
      return [];
    }
  }

  /**
   * Formate la condition d'un badge pour l'affichage
   */
  static formatCondition(condition: BadgeCondition): string {
    switch (condition.type) {
      case 'points':
        return `${condition.value} points`;
      case 'challenges':
        return `${condition.value} défis complétés`;
      case 'challenges_category':
        return `${condition.value} défis ${condition.challengeCategory}`;
      case 'manual':
        return 'Attribution manuelle';
      default:
        return 'Condition inconnue';
    }
  }
}
