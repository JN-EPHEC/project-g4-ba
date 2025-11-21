import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Event, EventType } from '@/types';

/**
 * Service pour gérer les événements
 */
export class EventService {
  private static readonly COLLECTION_NAME = 'events';

  /**
   * Convertit un document Firestore en événement
   */
  private static convertEvent(data: DocumentData): Event {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type as EventType,
      unitId: data.unitId,
      location: data.location,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      imageUrl: data.imageUrl,
      createdBy: data.createdBy,
      requiresParentConfirmation: data.requiresParentConfirmation || false,
      maxParticipants: data.maxParticipants,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  /**
   * Crée un nouvel événement
   */
  static async createEvent(
    title: string,
    description: string,
    type: EventType,
    startDate: Date,
    endDate: Date,
    location: string,
    createdBy: string,
    unitId: string,
    requiresParentConfirmation: boolean = false,
    maxParticipants?: number,
    imageUrl?: string
  ): Promise<Event> {
    try {
      const now = new Date();
      const eventData = {
        title,
        description,
        type,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        location,
        unitId,
        createdBy,
        requiresParentConfirmation,
        maxParticipants: maxParticipants || null,
        imageUrl: imageUrl || null,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const eventRef = doc(collection(db, this.COLLECTION_NAME));
      await setDoc(eventRef, eventData);

      return this.convertEvent({ id: eventRef.id, ...eventData });
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      throw error;
    }
  }

  /**
   * Récupère un événement par son ID
   */
  static async getEventById(eventId: string): Promise<Event | null> {
    try {
      const eventDoc = await getDoc(doc(db, this.COLLECTION_NAME, eventId));

      if (!eventDoc.exists()) {
        return null;
      }

      return this.convertEvent({ id: eventDoc.id, ...eventDoc.data() });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'événement:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les événements d'une unité
   */
  static async getEventsByUnit(unitId: string): Promise<Event[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('unitId', '==', unitId),
        orderBy('startDate', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        this.convertEvent({ id: doc.id, ...doc.data() })
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les événements à venir
   */
  static async getUpcomingEvents(unitId?: string): Promise<Event[]> {
    try {
      const now = Timestamp.fromDate(new Date());
      let events: Event[];

      if (unitId) {
        events = await this.getEventsByUnit(unitId);
      } else {
        const q = query(
          collection(db, this.COLLECTION_NAME),
          orderBy('startDate', 'asc')
        );
        const querySnapshot = await getDocs(q);
        events = querySnapshot.docs.map((doc) =>
          this.convertEvent({ id: doc.id, ...doc.data() })
        );
      }

      // Filtrer les événements à venir
      return events.filter((event) => {
        const start = Timestamp.fromDate(event.startDate);
        return start >= now;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des événements à venir:', error);
      throw error;
    }
  }

  /**
   * Met à jour un événement
   */
  static async updateEvent(
    eventId: string,
    updates: Partial<Omit<Event, 'id' | 'createdAt' | 'createdBy'>>
  ): Promise<void> {
    try {
      const eventRef = doc(db, this.COLLECTION_NAME, eventId);
      const firestoreUpdates: any = { ...updates };

      // Convertir les dates en Timestamp
      if (firestoreUpdates.startDate instanceof Date) {
        firestoreUpdates.startDate = Timestamp.fromDate(firestoreUpdates.startDate);
      }
      if (firestoreUpdates.endDate instanceof Date) {
        firestoreUpdates.endDate = Timestamp.fromDate(firestoreUpdates.endDate);
      }

      firestoreUpdates.updatedAt = Timestamp.fromDate(new Date());

      await updateDoc(eventRef, firestoreUpdates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error);
      throw error;
    }
  }

  /**
   * Supprime un événement
   */
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, eventId));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      throw error;
    }
  }
}

