/**
 * Système de rangs inspiré de Clash of Clans
 * Adapté au contexte scout
 */

export interface Rank {
  id: number;
  name: string;
  requiredXP: number;
  icon: string; // Ionicons name
  color: string;
  description: string;
}

export const RANKS: Rank[] = [
  {
    id: 1,
    name: 'Apprenti',
    requiredXP: 0,
    icon: 'leaf',
    color: '#10b981',
    description: 'Débute l\'aventure'
  },
  {
    id: 2,
    name: 'Explorateur',
    requiredXP: 100,
    icon: 'compass',
    color: '#3b82f6',
    description: 'Découvre le monde'
  },
  {
    id: 3,
    name: 'Aventurier',
    requiredXP: 300,
    icon: 'walk',
    color: '#6366f1',
    description: 'Ose l\'aventure'
  },
  {
    id: 4,
    name: 'Pionnier',
    requiredXP: 600,
    icon: 'trail-sign',
    color: '#8b5cf6',
    description: 'Trace son chemin'
  },
  {
    id: 5,
    name: 'Champion',
    requiredXP: 1000,
    icon: 'trophy',
    color: '#d946ef',
    description: 'Brille par ses exploits'
  },
  {
    id: 6,
    name: 'Héros',
    requiredXP: 1500,
    icon: 'shield-checkmark',
    color: '#ec4899',
    description: 'Inspire les autres'
  },
  {
    id: 7,
    name: 'Légende',
    requiredXP: 2200,
    icon: 'star',
    color: '#f59e0b',
    description: 'Marque l\'histoire'
  },
  {
    id: 8,
    name: 'Maître',
    requiredXP: 3000,
    icon: 'medal',
    color: '#f97316',
    description: 'Atteint l\'excellence'
  },
  {
    id: 9,
    name: 'Grand Maître',
    requiredXP: 4000,
    icon: 'ribbon',
    color: '#ef4444',
    description: 'Dépasse les limites'
  },
  {
    id: 10,
    name: 'Titan',
    requiredXP: 5500,
    icon: 'flash',
    color: '#dc2626',
    description: 'Sommet de la gloire'
  },
];

/**
 * Retourne le rang correspondant aux points XP
 */
export function getRankByXP(xp: number): Rank {
  return RANKS.reduce((acc, rank) =>
    xp >= rank.requiredXP ? rank : acc
  , RANKS[0]);
}

/**
 * Retourne le rang suivant ou null si c'est le rang maximum
 */
export function getNextRank(currentRank: Rank): Rank | null {
  return RANKS.find(r => r.id === currentRank.id + 1) || null;
}

/**
 * Calcule la progression vers le rang suivant
 */
export function getProgressToNextRank(xp: number): {
  current: number;
  required: number;
  percentage: number;
} {
  const currentRank = getRankByXP(xp);
  const nextRank = getNextRank(currentRank);

  if (!nextRank) {
    // Rang maximum atteint
    return { current: xp, required: xp, percentage: 100 };
  }

  const progress = xp - currentRank.requiredXP;
  const required = nextRank.requiredXP - currentRank.requiredXP;
  const percentage = Math.min((progress / required) * 100, 100);

  return { current: progress, required, percentage };
}
