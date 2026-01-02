/**
 * Types pour le système de défis
 */

export enum ChallengeStatus {
  ACTIVE = 'active',
  STARTED = 'started', // Scout a commencé le défi
  COMPLETED = 'completed',
  PENDING_VALIDATION = 'pending_validation',
  EXPIRED = 'expired',
}

export enum ChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: ChallengeDifficulty;
  unitId?: string; // Si null, le défi est disponible pour tous
  imageUrl?: string;
  startDate: Date;
  endDate: Date;
  createdBy: string; // ID de l'animateur
  createdAt: Date;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  scoutId: string;
  proofImageUrl?: string; // Photo de preuve optionnelle
  startedAt?: Date; // Date où le scout a commencé le défi
  submittedAt?: Date; // Date de soumission (optionnel si juste commencé)
  status: ChallengeStatus;
  validatedBy?: string; // ID du parent qui valide
  validatedAt?: Date;
  comment?: string;
  scoutComment?: string; // Commentaire du scout
}
