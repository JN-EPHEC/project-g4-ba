/**
 * Types pour le système de niveaux des scouts
 */

/**
 * Définition d'un niveau dans le système de progression
 */
export interface LevelDefinition {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number; // -1 pour le dernier niveau (infini)
  icon: string;
  color: string;
  order: number; // Ordre du niveau (1, 2, 3...)
  createdAt: Date;
}

/**
 * Informations de niveau calculées pour un scout
 */
export interface ScoutLevelInfo {
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  currentPoints: number;
  pointsInCurrentLevel: number; // Points depuis le début du niveau actuel
  pointsToNextLevel: number; // Points restants pour le prochain niveau
  progress: number; // Pourcentage de progression (0-100)
  isMaxLevel: boolean;
}

/**
 * Niveaux par défaut pour initialisation
 * Palette: Vert forêt (#2D5A45), Orange terracotta (#D97B4A), Taupe (#8B7E74)
 */
export const DEFAULT_LEVELS: Omit<LevelDefinition, 'id' | 'createdAt'>[] = [
  {
    name: 'Louveteau',
    minPoints: 0,
    maxPoints: 99,
    icon: '🐺',
    color: '#8bbaaa', // Vert clair (primary[300])
    order: 1,
  },
  {
    name: 'Éclaireur',
    minPoints: 100,
    maxPoints: 249,
    icon: '🔦',
    color: '#5d9a86', // Vert moyen (primary[400])
    order: 2,
  },
  {
    name: 'Aventurier',
    minPoints: 250,
    maxPoints: 499,
    icon: '🧭',
    color: '#2D5A45', // Vert forêt (primary[500])
    order: 3,
  },
  {
    name: 'Pionnier',
    minPoints: 500,
    maxPoints: 999,
    icon: '⛺',
    color: '#e99265', // Orange clair (accent[400])
    order: 4,
  },
  {
    name: 'Ranger',
    minPoints: 1000,
    maxPoints: 1999,
    icon: '🏕️',
    color: '#D97B4A', // Orange terracotta (accent[500])
    order: 5,
  },
  {
    name: 'Guide',
    minPoints: 2000,
    maxPoints: 3499,
    icon: '🗺️',
    color: '#c46839', // Orange foncé (accent[600])
    order: 6,
  },
  {
    name: 'Chef de patrouille',
    minPoints: 3500,
    maxPoints: 4999,
    icon: '🎖️',
    color: '#1f4031', // Vert très foncé (primary[700])
    order: 7,
  },
  {
    name: 'Maître Scout',
    minPoints: 5000,
    maxPoints: -1, // Infini
    icon: '👑',
    color: '#a3552e', // Bronze doré (accent[700])
    order: 8,
  },
];
