import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Conversation {
  id: string;
  name?: string;
  type: 'group' | 'private';
  unitId?: string;
  members: string[];
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export class MessagingService {
  private static readonly CONVERSATIONS_COLLECTION = 'conversations';
  private static readonly MESSAGES_COLLECTION = 'messages';

  static async createConversation(
    type: 'group' | 'private',
    members: string[],
    name?: string,
    unitId?: string
  ): Promise<Conversation> {
    const convData = {
      type,
      members,
      name,
      unitId: unitId || null,
      createdAt: Timestamp.fromDate(new Date()),
    };
    const convRef = doc(collection(db, this.CONVERSATIONS_COLLECTION));
    await setDoc(convRef, convData);
    return { id: convRef.id, ...convData, createdAt: convData.createdAt.toDate() };
  }

  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<Message> {
    const messageData = {
      conversationId,
      senderId,
      content,
      createdAt: Timestamp.fromDate(new Date()),
    };
    const messageRef = doc(collection(db, this.MESSAGES_COLLECTION));
    await setDoc(messageRef, messageData);
    return { id: messageRef.id, ...messageData, createdAt: messageData.createdAt.toDate() };
  }

  static async getConversations(userId: string): Promise<Conversation[]> {
    const q = query(
      collection(db, this.CONVERSATIONS_COLLECTION),
      where('members', 'array-contains', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Conversation[];
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    const q = query(
      collection(db, this.MESSAGES_COLLECTION),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Message[];
  }
}

