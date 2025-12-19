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
 */
export const DEFAULT_LEVELS: Omit<LevelDefinition, 'id' | 'createdAt'>[] = [
  {
    name: 'Louveteau',
    minPoints: 0,
    maxPoints: 99,
    icon: '🐺',
    color: '#8B5CF6', // Violet
    order: 1,
  },
  {
    name: 'Éclaireur',
    minPoints: 100,
    maxPoints: 249,
    icon: '🔦',
    color: '#3B82F6', // Bleu
    order: 2,
  },
  {
    name: 'Aventurier',
    minPoints: 250,
    maxPoints: 499,
    icon: '🧭',
    color: '#10B981', // Vert
    order: 3,
  },
  {
    name: 'Pionnier',
    minPoints: 500,
    maxPoints: 999,
    icon: '⛺',
    color: '#F59E0B', // Orange
    order: 4,
  },
  {
    name: 'Ranger',
    minPoints: 1000,
    maxPoints: 1999,
    icon: '🏕️',
    color: '#EF4444', // Rouge
    order: 5,
  },
  {
    name: 'Guide',
    minPoints: 2000,
    maxPoints: 3499,
    icon: '🗺️',
    color: '#EC4899', // Rose
    order: 6,
  },
  {
    name: 'Chef de patrouille',
    minPoints: 3500,
    maxPoints: 4999,
    icon: '🎖️',
    color: '#6366F1', // Indigo
    order: 7,
  },
  {
    name: 'Maître Scout',
    minPoints: 5000,
    maxPoints: -1, // Infini
    icon: '👑',
    color: '#FFD700', // Or
    order: 8,
  },
];
