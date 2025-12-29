import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  BadgeDefinition,
  ScoutBadge,
  BadgeWithDetails,
  BadgeCategory,
} from '@/types';

/**
 * Badges par défaut disponibles dans l'application
 */
const DEFAULT_BADGES: Omit<BadgeDefinition, 'id' | 'createdAt'>[] = [
  {
    name: 'Première flamme',
    description: 'Premier feu de camp réussi',
    icon: '🔥',
    category: BadgeCategory.NATURE,
    isManual: true,
  },
  {
    name: 'Randonneur',
    description: '50km parcourus en randonnée',
    icon: '🥾',
    category: BadgeCategory.SPORT,
    requiredPoints: 100,
    isManual: false,
  },
  {
    name: 'Secouriste',
    description: 'Formation premiers secours validée',
    icon: '🏥',
    category: BadgeCategory.PREMIERS_SECOURS,
    isManual: true,
  },
  {
    name: 'Chef étoilé',
    description: '5 repas préparés en camp',
    icon: '👨‍🍳',
    category: BadgeCategory.CUISINE,
    requiredChallenges: 5,
    isManual: false,
  },
  {
    name: 'Éco-héros',
    description: 'Participation à 3 actions écologiques',
    icon: '🌍',
    category: BadgeCategory.NATURE,
    requiredChallenges: 3,
    isManual: false,
  },
  {
    name: 'Noeud master',
    description: 'Maîtrise de 10 noeuds différents',
    icon: '🪢',
    category: BadgeCategory.TECHNIQUE,
    isManual: true,
  },
  {
    name: 'Explorateur',
    description: 'Participation à 5 activités',
    icon: '🧭',
    category: BadgeCategory.NATURE,
    requiredChallenges: 5,
    isManual: false,
  },
  {
    name: 'Ami des animaux',
    description: 'Observation et protection de la faune',
    icon: '🦊',
    category: BadgeCategory.NATURE,
    isManual: true,
  },
  {
    name: 'Artiste',
    description: '3 créations artistiques réalisées',
    icon: '🎨',
    category: BadgeCategory.CREATIVITE,
    requiredChallenges: 3,
    isManual: false,
  },
  {
    name: 'Champion',
    description: 'Atteindre 500 points',
    icon: '🏆',
    category: BadgeCategory.SPORT,
    requiredPoints: 500,
    isManual: false,
  },
];

/**
 * Service pour gérer les badges
 */
export class BadgeService {
  private static readonly BADGES_COLLECTION = 'badges';
  private static readonly SCOUT_BADGES_COLLECTION = 'scoutBadges';

  /**
   * Convertit un document Firestore en BadgeDefinition
   */
  private static convertToBadgeDefinition(data: DocumentData): BadgeDefinition {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      icon: data.icon,
      category: data.category as BadgeCategory,
      requiredPoints: data.requiredPoints,
      requiredChallenges: data.requiredChallenges,
      isManual: data.isManual ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
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
   * Initialise les badges par défaut dans Firebase (à appeler une seule fois)
   */
  static async initializeDefaultBadges(): Promise<void> {
    try {
      const existingBadges = await this.getAllBadgeDefinitions();

      if (existingBadges.length === 0) {
        console.log('Initializing default badges...');

        for (const badge of DEFAULT_BADGES) {
          const badgeRef = doc(collection(db, this.BADGES_COLLECTION));
          await setDoc(badgeRef, {
            ...badge,
            createdAt: Timestamp.fromDate(new Date()),
          });
        }

        console.log(`${DEFAULT_BADGES.length} badges initialized`);
      }
    } catch (error) {
      console.error('Error initializing badges:', error);
    }
  }

  /**
   * Récupère toutes les définitions de badges
   */
  static async getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
    try {
      const q = query(
        collection(db, this.BADGES_COLLECTION),
        orderBy('name', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc =>
        this.convertToBadgeDefinition({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Error fetching badge definitions:', error);
      return [];
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
    completedChallengesCount: number = 0
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
        if (!unlocked && !definition.isManual) {
          if (definition.requiredPoints) {
            progress = Math.min(100, Math.round((scoutPoints / definition.requiredPoints) * 100));
          } else if (definition.requiredChallenges) {
            progress = Math.min(100, Math.round((completedChallengesCount / definition.requiredChallenges) * 100));
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
    completedChallengesCount: number
  ): Promise<ScoutBadge[]> {
    try {
      const definitions = await this.getAllBadgeDefinitions();
      const existingBadges = await this.getScoutBadges(scoutId);
      const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));

      const newBadges: ScoutBadge[] = [];

      for (const definition of definitions) {
        // Skip si déjà obtenu ou si manuel
        if (existingBadgeIds.has(definition.id) || definition.isManual) {
          continue;
        }

        let shouldAward = false;

        if (definition.requiredPoints && scoutPoints >= definition.requiredPoints) {
          shouldAward = true;
        }

        if (definition.requiredChallenges && completedChallengesCount >= definition.requiredChallenges) {
          shouldAward = true;
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
}
