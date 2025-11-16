/**
 * Types pour la gestion des documents et signatures
 */

export enum DocumentType {
  AUTHORIZATION = 'authorization',
  MEDICAL = 'medical',
  GENERAL = 'general',
  PAYMENT = 'payment',
}

export enum DocumentStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  EXPIRED = 'expired',
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  fileUrl: string;
  unitId?: string; // Si null, document général pour tous
  scoutId?: string; // Si défini, document spécifique à un scout
  requiresSignature: boolean;
  expiryDate?: Date;
  createdBy: string; // ID de l'animateur
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentSignature {
  id: string;
  documentId: string;
  scoutId: string;
  parentId: string;
  signatureData: string; // Base64 de la signature
  signedAt: Date;
  ipAddress?: string;
}
