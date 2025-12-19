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
 * Définition d'un badge (template)
 */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requiredPoints?: number; // Points requis pour débloquer automatiquement
  requiredChallenges?: number; // Nombre de défis requis
  isManual: boolean; // Si true, doit être attribué manuellement par un animateur
  createdAt: Date;
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
