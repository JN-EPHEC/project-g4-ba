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

/**
 * Types pour le système de stockage de documents (Drive)
 */

/** Catégories de dossiers prédéfinies */
export enum FolderCategory {
  ADMINISTRATIVE = 'administrative',
  ACTIVITIES = 'activities',
  PHOTOS = 'photos',
  PLANNING = 'planning',
  RESOURCES = 'resources',
  OTHER = 'other',
}

/** Icônes par défaut pour chaque catégorie */
export const FOLDER_ICONS: Record<FolderCategory, string> = {
  [FolderCategory.ADMINISTRATIVE]: '📋',
  [FolderCategory.ACTIVITIES]: '🏕️',
  [FolderCategory.PHOTOS]: '📷',
  [FolderCategory.PLANNING]: '📅',
  [FolderCategory.RESOURCES]: '📚',
  [FolderCategory.OTHER]: '📁',
};

/** Labels français pour les catégories */
export const FOLDER_LABELS: Record<FolderCategory, string> = {
  [FolderCategory.ADMINISTRATIVE]: 'Administratif',
  [FolderCategory.ACTIVITIES]: 'Activités',
  [FolderCategory.PHOTOS]: 'Photos',
  [FolderCategory.PLANNING]: 'Planning',
  [FolderCategory.RESOURCES]: 'Ressources',
  [FolderCategory.OTHER]: 'Autres',
};

/** Un dossier dans le système de stockage */
export interface StorageFolder {
  id: string;
  name: string;
  category: FolderCategory;
  description?: string;
  icon?: string;
  unitId: string;
  parentId?: string; // Pour les sous-dossiers
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Type de fichier stocké */
export enum StorageFileType {
  PDF = 'pdf',
  IMAGE = 'image',
  DOCUMENT = 'document', // Word, etc.
  SPREADSHEET = 'spreadsheet', // Excel, etc.
  PRESENTATION = 'presentation', // PowerPoint, etc.
  OTHER = 'other',
}

/** Un fichier stocké */
export interface StorageFile {
  id: string;
  name: string;
  description?: string;
  folderId: string;
  unitId: string;
  fileUrl: string;
  fileType: StorageFileType;
  mimeType: string;
  size: number; // En bytes
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Helper pour déterminer le type de fichier depuis le mimeType */
export function getFileTypeFromMime(mimeType: string): StorageFileType {
  if (mimeType === 'application/pdf') return StorageFileType.PDF;
  if (mimeType.startsWith('image/')) return StorageFileType.IMAGE;
  if (mimeType.includes('word') || mimeType.includes('document')) return StorageFileType.DOCUMENT;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return StorageFileType.SPREADSHEET;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return StorageFileType.PRESENTATION;
  return StorageFileType.OTHER;
}

/** Icônes pour les types de fichiers */
export const FILE_TYPE_ICONS: Record<StorageFileType, string> = {
  [StorageFileType.PDF]: '📄',
  [StorageFileType.IMAGE]: '🖼️',
  [StorageFileType.DOCUMENT]: '📝',
  [StorageFileType.SPREADSHEET]: '📊',
  [StorageFileType.PRESENTATION]: '📽️',
  [StorageFileType.OTHER]: '📎',
};
