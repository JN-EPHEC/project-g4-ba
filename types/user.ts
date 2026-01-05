/**
 * Types de rôles utilisateur dans WeCamp
 */
export enum UserRole {
  SCOUT = 'scout',
  PARENT = 'parent',
  ANIMATOR = 'animator',
  WECAMP_ADMIN = 'wecamp_admin',
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
  sectionId?: string; // Section d'appartenance (ex: louveteaux, pionniers)
  points: number;
  rank?: string;
  dateOfBirth: Date;
  totemName?: string; // Nom de totem scout
  totemAnimal?: string; // Animal du totem (pour compatibilité)
  totemEmoji?: string; // Emoji personnalisé du totem
  totemTraits?: string; // Traits/qualités du totem (ex: "Force, courage, sagesse")
  validated: boolean; // Validé par l'animateur
  validatedAt?: Date; // Date de validation
  validatedBy?: string; // ID de l'animateur qui a validé
  lastNewsViewedAt?: Date; // Date de dernière consultation des nouveautés
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
  sectionId?: string; // Section gérée par l'animateur
  isUnitLeader: boolean; // Chef d'unité (supervise toutes les sections)
  isSectionLeader?: boolean; // Chef de section
  specialties?: string[];
  totemName?: string; // Nom de totem
  totemAnimal?: string; // Animal du totem (pour compatibilité)
  totemEmoji?: string; // Emoji personnalisé du totem
}

/**
 * Interface pour un Admin WeCamp
 */
export interface WeCampAdmin extends User {
  role: UserRole.WECAMP_ADMIN;
}

/**
 * Type union pour tous les types d'utilisateurs
 */
export type AnyUser = Scout | Parent | Animator | WeCampAdmin;
