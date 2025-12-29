/**
 * Types pour le système de défis
 */

export enum ChallengeStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PENDING_VALIDATION = 'pending_validation',
  EXPIRED = 'expired',
}

export enum ChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum ChallengeCategory {
  NATURE = 'nature',
  SPORT = 'sport',
  TECHNIQUE = 'technique',
  CUISINE = 'cuisine',
  CREATIVITY = 'creativity',
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: ChallengeDifficulty;
  category?: ChallengeCategory;
  emoji?: string; // Custom emoji for the challenge
  unitId?: string; // Si null, le défi est disponible pour tous
  imageUrl?: string;
  startDate: Date;
  endDate: Date;
  createdBy: string; // ID de l'animateur
  createdAt: Date;
  participantsCount?: number; // Nombre de participants
  // Options
  isGlobal?: boolean; // Visible par tous les groupes
  allowMultipleValidations?: boolean; // Permettre plusieurs validations
  notifyMembers?: boolean; // Notifier les membres
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  scoutId: string;
  proofImageUrl?: string; // Photo de preuve optionnelle
  submittedAt: Date;
  status: ChallengeStatus;
  validatedBy?: string; // ID de l'animateur qui valide
  validatedAt?: Date;
  comment?: string; // Commentaire de l'animateur lors de la validation
  scoutComment?: string; // Commentaire du scout lors de la soumission
}
