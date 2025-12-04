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
    canRead: [UserRole.SCOUT, UserRole.PARENT, UserRole.ANIMATOR],
    canWrite: [UserRole.ANIMATOR],
  },
  [ChannelType.GENERAL]: {
    canRead: [UserRole.SCOUT, UserRole.PARENT, UserRole.ANIMATOR],
    canWrite: [UserRole.SCOUT, UserRole.PARENT, UserRole.ANIMATOR],
  },
  [ChannelType.PARENTS]: {
    canRead: [UserRole.PARENT, UserRole.ANIMATOR],
    canWrite: [UserRole.PARENT, UserRole.ANIMATOR],
  },
  [ChannelType.CUSTOM]: {
    canRead: [UserRole.SCOUT, UserRole.PARENT, UserRole.ANIMATOR],
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
  createdAt: Date;
  updatedAt?: Date;
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
    name: 'Parents',
    description: 'Espace de discussion parents-animateurs',
    type: ChannelType.PARENTS,
    icon: '👨‍👩‍👧',
    permissions: DEFAULT_CHANNEL_PERMISSIONS[ChannelType.PARENTS],
    isDefault: true,
  },
];
