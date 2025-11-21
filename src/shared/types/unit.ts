/**
 * Types pour les unités scoutes
 */

export enum UnitCategory {
  CASTORS = 'castors', // 6-8 ans
  LOUVETEAUX = 'louveteaux', // 8-12 ans
  ECLAIREURS = 'eclaireurs', // 12-16 ans
  PIONNIERS = 'pionniers', // 16-18 ans
  COMPAGNONS = 'compagnons', // 18+ ans
}

export interface Unit {
  id: string;
  name: string;
  category: UnitCategory;
  description?: string;
  logoUrl?: string;
  groupId: string; // Groupe scout parent
  leaderId: string; // ID de l'animateur chef d'unité
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
