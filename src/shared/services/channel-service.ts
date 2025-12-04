import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  updateDoc,
  limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Channel,
  ChannelMessage,
  ChannelType,
  DEFAULT_CHANNELS,
  DEFAULT_CHANNEL_PERMISSIONS,
} from '@/src/shared/types/channel';
import { UserRole } from '@/types';

export class ChannelService {
  private static readonly CHANNELS_COLLECTION = 'channels';
  private static readonly MESSAGES_COLLECTION = 'channelMessages';

  /**
   * Créer les canaux par défaut pour une unité
   */
  static async createDefaultChannels(unitId: string, createdBy: string): Promise<Channel[]> {
    const channels: Channel[] = [];
    const now = new Date();

    for (const defaultChannel of DEFAULT_CHANNELS) {
      const channelRef = doc(collection(db, this.CHANNELS_COLLECTION));
      const channel: Channel = {
        ...defaultChannel,
        id: channelRef.id,
        unitId,
        createdBy,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(channelRef, {
        ...channel,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

      channels.push(channel);
    }

    return channels;
  }

  /**
   * Récupérer tous les canaux d'une unité
   */
  static async getChannelsByUnit(unitId: string): Promise<Channel[]> {
    const q = query(
      collection(db, this.CHANNELS_COLLECTION),
      where('unitId', '==', unitId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Channel[];
  }

  /**
   * Récupérer les canaux accessibles pour un rôle donné
   */
  static async getAccessibleChannels(unitId: string, userRole: UserRole): Promise<Channel[]> {
    const allChannels = await this.getChannelsByUnit(unitId);
    return allChannels.filter((channel) =>
      channel.permissions.canRead.includes(userRole)
    );
  }

  /**
   * Vérifier si les canaux par défaut existent, sinon les créer
   */
  static async ensureDefaultChannels(unitId: string, createdBy: string): Promise<Channel[]> {
    const existingChannels = await this.getChannelsByUnit(unitId);

    if (existingChannels.length === 0) {
      return this.createDefaultChannels(unitId, createdBy);
    }

    return existingChannels;
  }

  /**
   * Créer un canal personnalisé
   */
  static async createChannel(
    name: string,
    unitId: string,
    createdBy: string,
    options?: {
      description?: string;
      icon?: string;
      permissions?: { canRead: UserRole[]; canWrite: UserRole[] };
    }
  ): Promise<Channel> {
    const now = new Date();
    const channelRef = doc(collection(db, this.CHANNELS_COLLECTION));

    const channel: Channel = {
      id: channelRef.id,
      name,
      description: options?.description,
      type: ChannelType.CUSTOM,
      unitId,
      icon: options?.icon || '📌',
      permissions: options?.permissions || DEFAULT_CHANNEL_PERMISSIONS[ChannelType.CUSTOM],
      isDefault: false,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(channelRef, {
      ...channel,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    });

    return channel;
  }

  /**
   * Mettre à jour un canal
   */
  static async updateChannel(
    channelId: string,
    updates: Partial<Pick<Channel, 'name' | 'description' | 'icon' | 'permissions'>>
  ): Promise<void> {
    const channelRef = doc(db, this.CHANNELS_COLLECTION, channelId);
    await updateDoc(channelRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  /**
   * Supprimer un canal (seulement les canaux non-default)
   */
  static async deleteChannel(channelId: string): Promise<void> {
    const channelRef = doc(db, this.CHANNELS_COLLECTION, channelId);
    const channelDoc = await getDoc(channelRef);

    if (channelDoc.exists() && channelDoc.data().isDefault) {
      throw new Error('Impossible de supprimer un canal par défaut');
    }

    // Supprimer tous les messages du canal
    const messagesQuery = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('channelId', '==', channelId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);

    for (const messageDoc of messagesSnapshot.docs) {
      await deleteDoc(messageDoc.ref);
    }

    await deleteDoc(channelRef);
  }

  /**
   * Récupérer un canal par ID
   */
  static async getChannelById(channelId: string): Promise<Channel | null> {
    const channelRef = doc(db, this.CHANNELS_COLLECTION, channelId);
    const channelDoc = await getDoc(channelRef);

    if (!channelDoc.exists()) {
      return null;
    }

    return {
      id: channelDoc.id,
      ...channelDoc.data(),
      createdAt: channelDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: channelDoc.data().updatedAt?.toDate() || new Date(),
    } as Channel;
  }

  // ========== MESSAGES ==========

  /**
   * Envoyer un message dans un canal
   */
  static async sendMessage(
    channelId: string,
    authorId: string,
    content: string,
    attachment?: { type: 'image' | 'file'; url: string; name?: string }
  ): Promise<ChannelMessage> {
    const now = new Date();
    const messageRef = doc(collection(db, this.MESSAGES_COLLECTION));

    const message: ChannelMessage = {
      id: messageRef.id,
      channelId,
      authorId,
      content,
      attachment,
      isPinned: false,
      createdAt: now,
    };

    const messageData: Record<string, unknown> = {
      id: messageRef.id,
      channelId,
      authorId,
      content,
      isPinned: false,
      createdAt: Timestamp.fromDate(now),
    };

    if (attachment) {
      messageData.attachment = attachment;
    }

    await setDoc(messageRef, messageData);

    return message;
  }

  /**
   * Récupérer les messages d'un canal
   */
  static async getMessages(channelId: string, messageLimit = 50): Promise<ChannelMessage[]> {
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('channelId', '==', channelId),
      orderBy('createdAt', 'desc'),
      limit(messageLimit)
    );

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as ChannelMessage[];

    // Retourner dans l'ordre chronologique (plus ancien en premier)
    return messages.reverse();
  }

  /**
   * Épingler/désépingler un message
   */
  static async togglePinMessage(messageId: string, isPinned: boolean): Promise<void> {
    const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
    await updateDoc(messageRef, {
      isPinned,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  /**
   * Récupérer les messages épinglés d'un canal
   */
  static async getPinnedMessages(channelId: string): Promise<ChannelMessage[]> {
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('channelId', '==', channelId),
      where('isPinned', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as ChannelMessage[];
  }

  /**
   * Supprimer un message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
    await deleteDoc(messageRef);
  }

  /**
   * Vérifier si un utilisateur peut écrire dans un canal
   */
  static canWrite(channel: Channel, userRole: UserRole): boolean {
    return channel.permissions.canWrite.includes(userRole);
  }

  /**
   * Vérifier si un utilisateur peut lire un canal
   */
  static canRead(channel: Channel, userRole: UserRole): boolean {
    return channel.permissions.canRead.includes(userRole);
  }
}
