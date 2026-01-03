/**
 * Types pour les unités scoutes
 */

export enum UnitCategory {
  SCOUTS = 'scouts', // Les Scouts
  GUIDES = 'guides', // Les Guides
  PATRO = 'patro', // Le Patro
  SGP = 'sgp', // Scouts et Guides Pluralistes
  FAUCONS = 'faucons', // Faucons Rouges
}

export interface Unit {
  id: string;
  name: string;
  category: UnitCategory;
  description?: string;
  logoUrl?: string;
  groupId: string; // Groupe scout parent
  leaderId: string; // ID de l'animateur chef d'unité
  accessCode?: string; // Code d'accès pour rejoindre l'unité
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoutGroup {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phone: string;
  logoUrl?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}
