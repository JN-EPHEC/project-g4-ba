/**
 * Types de rôles utilisateur dans WeCamp
 */
export enum UserRole {
  SCOUT = 'scout',
  PARENT = 'parent',
  ANIMATOR = 'animator',
}

/**
 * Interface de base pour un utilisateur
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePicture?: string;
  bio?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface pour un Scout
 */
export interface Scout extends User {
  role: UserRole.SCOUT;
  parentIds: string[];
  unitId: string;
  points: number;
  rank?: string;
  dateOfBirth: Date;
  totemName?: string; // Nom de totem scout
  totemAnimal?: string; // Animal du totem
  validated: boolean; // Validé par l'animateur
  validatedAt?: Date; // Date de validation
  validatedBy?: string; // ID de l'animateur qui a validé
}

/**
 * Interface pour un Parent
 */
export interface Parent extends User {
  role: UserRole.PARENT;
  scoutIds: string[];
  phone?: string;
}

/**
 * Interface pour un Animateur
 */
export interface Animator extends User {
  role: UserRole.ANIMATOR;
  unitId: string;
  isUnitLeader: boolean;
  specialties?: string[];
}

/**
 * Type union pour tous les types d'utilisateurs
 */
export type AnyUser = Scout | Parent | Animator;
