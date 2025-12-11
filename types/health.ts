/**
 * Types pour la gestion des fiches santé
 */

/**
 * Sévérité d'une allergie
 */
export enum AllergySeverity {
  LIGHT = 'light',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

/**
 * Groupes sanguins
 */
export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

/**
 * Allergie
 */
export interface Allergy {
  id: string;
  name: string;
  severity: AllergySeverity;
  description?: string;
  requiresEpiPen: boolean;
}

/**
 * Médicament
 */
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  isVital: boolean;
}

/**
 * Contact d'urgence
 */
export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
  avatarEmoji?: string;
}

/**
 * Fiche santé complète d'un scout
 */
export interface HealthRecord {
  id: string;
  scoutId: string;
  bloodType?: BloodType;
  insuranceName?: string;
  insuranceNumber?: string;
  allergies: Allergy[];
  medications: Medication[];
  emergencyContacts: EmergencyContact[];
  additionalNotes?: string;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
  signedByParentId?: string;
  signedByParentName?: string;
  signedAt?: Date;
}

/**
 * Données pour créer/mettre à jour une fiche santé
 */
export interface HealthRecordInput {
  bloodType?: BloodType;
  insuranceName?: string;
  insuranceNumber?: string;
  allergies?: Allergy[];
  medications?: Medication[];
  emergencyContacts?: EmergencyContact[];
  additionalNotes?: string;
}
