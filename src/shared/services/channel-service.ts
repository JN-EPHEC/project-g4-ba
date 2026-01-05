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
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Channel,
  ChannelMessage,
  MessageComment,
  MessageReaction,
  ChannelType,
  DEFAULT_CHANNELS,
  DEFAULT_CHANNEL_PERMISSIONS,
} from '@/src/shared/types/channel';
import { UserRole } from '@/types';

export class ChannelService {
  private static readonly CHANNELS_COLLECTION = 'channels';
  private static readonly MESSAGES_COLLECTION = 'channelMessages';
  private static readonly COMMENTS_COLLECTION = 'messageComments';

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
   * Met aussi à jour les permissions des canaux existants si elles ont changé
   */
  static async ensureDefaultChannels(unitId: string, createdBy: string): Promise<Channel[]> {
    const existingChannels = await this.getChannelsByUnit(unitId);

    if (existingChannels.length === 0) {
      return this.createDefaultChannels(unitId, createdBy);
    }

    // Mettre à jour les permissions des canaux existants si nécessaire
    for (const channel of existingChannels) {
      const defaultPerms = DEFAULT_CHANNEL_PERMISSIONS[channel.type];
      if (defaultPerms) {
        const currentCanRead = JSON.stringify(channel.permissions.canRead.sort());
        const defaultCanRead = JSON.stringify(defaultPerms.canRead.sort());
        const currentCanWrite = JSON.stringify(channel.permissions.canWrite.sort());
        const defaultCanWrite = JSON.stringify(defaultPerms.canWrite.sort());

        if (currentCanRead !== defaultCanRead || currentCanWrite !== defaultCanWrite) {
          await this.updateChannel(channel.id, { permissions: defaultPerms });
          channel.permissions = defaultPerms;
        }
      }
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

    // Retourner du plus récent au plus ancien
    return messages;
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

  /**
   * Mettre à jour les permissions de tous les canaux pour correspondre aux permissions par défaut
   */
  static async syncAllChannelPermissions(): Promise<number> {
    const q = query(collection(db, this.CHANNELS_COLLECTION));
    const snapshot = await getDocs(q);
    let updatedCount = 0;

    for (const docSnap of snapshot.docs) {
      const channel = docSnap.data() as Channel;
      const defaultPerms = DEFAULT_CHANNEL_PERMISSIONS[channel.type];

      if (defaultPerms) {
        const currentCanRead = JSON.stringify([...(channel.permissions?.canRead || [])].sort());
        const defaultCanRead = JSON.stringify([...defaultPerms.canRead].sort());
        const currentCanWrite = JSON.stringify([...(channel.permissions?.canWrite || [])].sort());
        const defaultCanWrite = JSON.stringify([...defaultPerms.canWrite].sort());

        if (currentCanRead !== defaultCanRead || currentCanWrite !== defaultCanWrite) {
          await updateDoc(docSnap.ref, {
            permissions: defaultPerms,
            updatedAt: Timestamp.fromDate(new Date()),
          });
          updatedCount++;
        }
      }
    }

    return updatedCount;
  }

  // ========== MESSAGES NON LUS ==========

  private static readonly READ_STATUS_COLLECTION = 'channelReadStatus';

  /**
   * Marquer un canal comme lu pour un utilisateur
   */
  static async markChannelAsRead(channelId: string, userId: string): Promise<void> {
    const readStatusRef = doc(db, this.READ_STATUS_COLLECTION, `${userId}_${channelId}`);
    await setDoc(readStatusRef, {
      userId,
      channelId,
      lastReadAt: Timestamp.fromDate(new Date()),
    });
  }

  /**
   * Récupérer la date de dernière lecture d'un canal par un utilisateur
   */
  static async getLastReadAt(channelId: string, userId: string): Promise<Date | null> {
    const readStatusRef = doc(db, this.READ_STATUS_COLLECTION, `${userId}_${channelId}`);
    const readStatusDoc = await getDoc(readStatusRef);

    if (!readStatusDoc.exists()) {
      return null;
    }

    return readStatusDoc.data().lastReadAt?.toDate() || null;
  }

  /**
   * Compter les messages non lus d'un canal pour un utilisateur
   */
  static async getUnreadCount(channelId: string, userId: string): Promise<number> {
    const lastReadAt = await this.getLastReadAt(channelId, userId);

    let q;
    if (lastReadAt) {
      q = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('channelId', '==', channelId),
        where('createdAt', '>', Timestamp.fromDate(lastReadAt)),
        where('authorId', '!=', userId)
      );
    } else {
      // Si jamais lu, compter tous les messages sauf les siens
      q = query(
        collection(db, this.MESSAGES_COLLECTION),
        where('channelId', '==', channelId),
        where('authorId', '!=', userId)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * Récupérer le dernier message d'un canal
   */
  static async getLastMessage(channelId: string): Promise<ChannelMessage | null> {
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('channelId', '==', channelId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as ChannelMessage;
  }

  /**
   * Récupérer les infos de messages non lus pour tous les canaux d'une unité
   */
  static async getUnreadSummary(
    unitId: string,
    userId: string,
    userRole: UserRole
  ): Promise<{
    totalUnread: number;
    channelUnreads: Array<{
      channel: Channel;
      unreadCount: number;
      lastMessage: ChannelMessage | null;
    }>;
  }> {
    const channels = await this.getAccessibleChannels(unitId, userRole);
    let totalUnread = 0;
    const channelUnreads: Array<{
      channel: Channel;
      unreadCount: number;
      lastMessage: ChannelMessage | null;
    }> = [];

    for (const channel of channels) {
      const unreadCount = await this.getUnreadCount(channel.id, userId);
      const lastMessage = await this.getLastMessage(channel.id);

      if (unreadCount > 0 || lastMessage) {
        channelUnreads.push({
          channel,
          unreadCount,
          lastMessage,
        });
        totalUnread += unreadCount;
      }
    }

    // Trier par nombre de messages non lus (desc) puis par date du dernier message
    channelUnreads.sort((a, b) => {
      if (b.unreadCount !== a.unreadCount) {
        return b.unreadCount - a.unreadCount;
      }
      const aTime = a.lastMessage?.createdAt?.getTime() || 0;
      const bTime = b.lastMessage?.createdAt?.getTime() || 0;
      return bTime - aTime;
    });

    return { totalUnread, channelUnreads };
  }

  // ========== LIKES ==========

  /**
   * Ajouter ou retirer un like sur un message
   */
  static async toggleLikeMessage(messageId: string, userId: string): Promise<boolean> {
    const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message non trouvé');
    }

    const likes = messageDoc.data().likes || [];
    const hasLiked = likes.includes(userId);

    if (hasLiked) {
      // Retirer le like
      await updateDoc(messageRef, {
        likes: arrayRemove(userId),
        likesCount: increment(-1),
      });
      return false;
    } else {
      // Ajouter le like
      await updateDoc(messageRef, {
        likes: arrayUnion(userId),
        likesCount: increment(1),
      });
      return true;
    }
  }

  /**
   * Ajouter ou retirer une réaction emoji sur un message
   * @returns Les nouvelles réactions du message
   */
  static async toggleReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<MessageReaction[]> {
    const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message non trouvé');
    }

    const data = messageDoc.data();
    const reactions: MessageReaction[] = data.reactions || [];

    // Trouver si cette réaction existe déjà
    const existingReactionIndex = reactions.findIndex((r) => r.emoji === emoji);

    if (existingReactionIndex !== -1) {
      const existingReaction = reactions[existingReactionIndex];
      const hasUserReacted = existingReaction.userIds.includes(userId);

      if (hasUserReacted) {
        // Retirer la réaction de l'utilisateur
        existingReaction.userIds = existingReaction.userIds.filter((id) => id !== userId);
        existingReaction.count--;

        // Si plus personne n'a cette réaction, la supprimer
        if (existingReaction.count === 0) {
          reactions.splice(existingReactionIndex, 1);
        }
      } else {
        // Ajouter l'utilisateur à cette réaction
        existingReaction.userIds.push(userId);
        existingReaction.count++;
      }
    } else {
      // Créer une nouvelle réaction
      reactions.push({
        emoji,
        userIds: [userId],
        count: 1,
      });
    }

    // Mettre à jour Firestore
    await updateDoc(messageRef, { reactions });

    return reactions;
  }

  /**
   * Obtenir les réactions d'un message
   */
  static async getReactions(messageId: string): Promise<MessageReaction[]> {
    const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      return [];
    }

    return messageDoc.data().reactions || [];
  }

  /**
   * Vérifier si un utilisateur a liké un message
   */
  static async hasUserLiked(messageId: string, userId: string): Promise<boolean> {
    const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      return false;
    }

    const likes = messageDoc.data().likes || [];
    return likes.includes(userId);
  }

  // ========== COMMENTAIRES ==========

  /**
   * Ajouter un commentaire sur un message
   */
  static async addComment(
    messageId: string,
    channelId: string,
    authorId: string,
    content: string
  ): Promise<MessageComment> {
    const now = new Date();
    const commentRef = doc(collection(db, this.COMMENTS_COLLECTION));

    const comment: MessageComment = {
      id: commentRef.id,
      messageId,
      channelId,
      authorId,
      content,
      createdAt: now,
    };

    await setDoc(commentRef, {
      ...comment,
      createdAt: Timestamp.fromDate(now),
    });

    // Incrémenter le compteur de commentaires sur le message
    const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
    await updateDoc(messageRef, {
      commentsCount: increment(1),
    });

    return comment;
  }

  /**
   * Récupérer les commentaires d'un message
   */
  static async getComments(messageId: string): Promise<MessageComment[]> {
    console.log('[ChannelService] getComments for messageId:', messageId);
    try {
      // Requête simple sans orderBy d'abord pour déboguer
      const q = query(
        collection(db, this.COMMENTS_COLLECTION),
        where('messageId', '==', messageId)
      );

      const snapshot = await getDocs(q);
      console.log('[ChannelService] getComments snapshot size:', snapshot.size);

      const comments = snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
        createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
      })) as MessageComment[];

      // Trier manuellement par date de création
      comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      console.log('[ChannelService] getComments result:', comments);
      return comments;
    } catch (error) {
      console.error('[ChannelService] getComments error:', error);
      throw error;
    }
  }

  /**
   * Supprimer un commentaire
   */
  static async deleteComment(commentId: string, messageId: string): Promise<void> {
    const commentRef = doc(db, this.COMMENTS_COLLECTION, commentId);
    await deleteDoc(commentRef);

    // Décrémenter le compteur de commentaires sur le message
    const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
    await updateDoc(messageRef, {
      commentsCount: increment(-1),
    });
  }

  /**
   * Récupérer le nombre de commentaires d'un message
   */
  static async getCommentsCount(messageId: string): Promise<number> {
    const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      return 0;
    }

    return messageDoc.data().commentsCount || 0;
  }
}
