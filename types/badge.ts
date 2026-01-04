/**
 * Types pour le système de badges
 */

/**
 * Catégories de badges
 */
export enum BadgeCategory {
  NATURE = 'nature',
  CUISINE = 'cuisine',
  SPORT = 'sport',
  PREMIERS_SECOURS = 'premiers_secours',
  CREATIVITE = 'creativite',
  SOCIAL = 'social',
  TECHNIQUE = 'technique',
}

/**
 * Types de conditions pour débloquer un badge
 */
export type BadgeConditionType = 'points' | 'challenges' | 'challenges_category' | 'manual';

/**
 * Condition de déblocage d'un badge
 */
export interface BadgeCondition {
  type: BadgeConditionType;
  value?: number; // Points requis ou nombre de défis
  challengeCategory?: string; // Catégorie de défis (si type = challenges_category)
}

/**
 * Définition d'un badge (template)
 */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;

  // Nouvelle structure de conditions (flexible)
  condition: BadgeCondition;

  // Champs legacy (pour rétrocompatibilité, à supprimer après migration)
  requiredPoints?: number;
  requiredChallenges?: number;
  isManual?: boolean;

  isActive: boolean; // Pour soft delete
  createdAt: Date;
  createdBy?: string; // ID de l'admin qui a créé le badge
}

/**
 * Badge attribué à un scout
 */
export interface ScoutBadge {
  id: string;
  scoutId: string;
  badgeId: string;
  unlockedAt: Date;
  awardedBy?: string; // ID de l'animateur qui a attribué le badge (si manuel)
  comment?: string;
}

/**
 * Badge avec ses détails pour l'affichage
 */
export interface BadgeWithDetails {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: BadgeCategory;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number; // 0-100, pour les badges basés sur les points/défis
}
