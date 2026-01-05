import { UserRole } from '@/types';

/**
 * Types de canaux prédéfinis
 */
export enum ChannelType {
  ANNOUNCEMENTS = 'announcements', // Annonces (lecture pour tous, écriture animateurs)
  GENERAL = 'general',             // Général (tous peuvent écrire)
  PARENTS = 'parents',             // Parents + Animateurs uniquement
  CUSTOM = 'custom',               // Canal personnalisé
}

/**
 * Permissions d'un canal
 */
export interface ChannelPermissions {
  canRead: UserRole[];   // Qui peut lire
  canWrite: UserRole[];  // Qui peut écrire
}

/**
 * Configuration par défaut des permissions selon le type de canal
 */
export const DEFAULT_CHANNEL_PERMISSIONS: Record<ChannelType, ChannelPermissions> = {
  [ChannelType.ANNOUNCEMENTS]: {
    canRead: [UserRole.SCOUT, UserRole.ANIMATOR], // Parents n'ont pas accès aux annonces générales
    canWrite: [UserRole.ANIMATOR],
  },
  [ChannelType.GENERAL]: {
    canRead: [UserRole.SCOUT, UserRole.ANIMATOR], // Parents n'ont pas accès au général
    canWrite: [UserRole.SCOUT, UserRole.ANIMATOR],
  },
  [ChannelType.PARENTS]: {
    canRead: [UserRole.PARENT, UserRole.ANIMATOR], // Seul canal accessible aux parents
    canWrite: [UserRole.ANIMATOR], // Seuls les animateurs peuvent écrire (annonces)
  },
  [ChannelType.CUSTOM]: {
    canRead: [UserRole.SCOUT, UserRole.ANIMATOR],
    canWrite: [UserRole.ANIMATOR],
  },
};

/**
 * Canal de discussion
 */
export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: ChannelType;
  unitId: string;
  icon?: string;           // Emoji ou nom d'icône
  permissions: ChannelPermissions;
  isDefault: boolean;      // Canal par défaut (ne peut pas être supprimé)
  createdBy: string;       // ID de l'animateur créateur
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Réaction sur un message (emoji + utilisateurs)
 */
export interface MessageReaction {
  emoji: string;           // L'emoji de la réaction
  userIds: string[];       // Liste des utilisateurs ayant réagi avec cet emoji
  count: number;           // Nombre total de réactions
}

/**
 * Message dans un canal
 */
export interface ChannelMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name?: string;
  };
  isPinned: boolean;       // Message épinglé
  likes?: string[];        // Array des userIds qui ont liké (legacy)
  likesCount?: number;     // Compteur de likes (legacy)
  reactions?: MessageReaction[]; // Nouvelles réactions multi-emoji
  commentsCount?: number;  // Nombre de commentaires
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Commentaire sur un message
 */
export interface MessageComment {
  id: string;
  messageId: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

/**
 * Canaux par défaut à créer pour chaque unité
 */
export const DEFAULT_CHANNELS: Omit<Channel, 'id' | 'unitId' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Annonces',
    description: 'Annonces importantes de l\'unité',
    type: ChannelType.ANNOUNCEMENTS,
    icon: '📢',
    permissions: DEFAULT_CHANNEL_PERMISSIONS[ChannelType.ANNOUNCEMENTS],
    isDefault: true,
  },
  {
    name: 'Général',
    description: 'Discussions générales',
    type: ChannelType.GENERAL,
    icon: '💬',
    permissions: DEFAULT_CHANNEL_PERMISSIONS[ChannelType.GENERAL],
    isDefault: true,
  },
  {
    name: 'Annonces Parents',
    description: 'Annonces et informations pour les parents',
    type: ChannelType.PARENTS,
    icon: '👨‍👩‍👧',
    permissions: DEFAULT_CHANNEL_PERMISSIONS[ChannelType.PARENTS],
    isDefault: true,
  },
];
