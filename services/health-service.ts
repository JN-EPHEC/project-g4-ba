import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  HealthRecord,
  HealthRecordInput,
  Allergy,
  Medication,
  EmergencyContact,
  BloodType,
} from '@/types';

/**
 * Helper pour nettoyer les données avant envoi à Firestore
 * Remplace undefined par null et nettoie les objets imbriqués
 */
function cleanForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item));
  }
  if (typeof obj === 'object' && !(obj instanceof Date) && !obj.toDate) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanForFirestore(value);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Service pour gérer les fiches santé dans Firestore
 */
export class HealthService {
  private static readonly COLLECTION_NAME = 'healthRecords';

  /**
   * Convertit un document Firestore en HealthRecord
   */
  private static convertHealthRecord(data: DocumentData): HealthRecord {
    return {
      id: data.id,
      scoutId: data.scoutId,
      bloodType: data.bloodType as BloodType | undefined,
      insuranceName: data.insuranceName,
      insuranceNumber: data.insuranceNumber,
      allergies: data.allergies || [],
      medications: data.medications || [],
      emergencyContacts: data.emergencyContacts || [],
      additionalNotes: data.additionalNotes,
      lastUpdatedAt: data.lastUpdatedAt?.toDate() || new Date(),
      lastUpdatedBy: data.lastUpdatedBy,
      signedByParentId: data.signedByParentId,
      signedByParentName: data.signedByParentName,
      signedAt: data.signedAt?.toDate(),
    };
  }

  /**
   * Récupère la fiche santé d'un scout
   */
  static async getHealthRecord(scoutId: string): Promise<HealthRecord | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, scoutId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.convertHealthRecord({ id: docSnap.id, ...docSnap.data() });
    } catch (error) {
      console.error('Erreur lors de la récupération de la fiche santé:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle fiche santé pour un scout
   */
  static async createHealthRecord(
    scoutId: string,
    data: HealthRecordInput,
    updatedBy: string
  ): Promise<HealthRecord> {
    try {
      const now = new Date();

      // Nettoyer les données pour Firestore (remplacer undefined par null)
      const cleanedAllergies = cleanForFirestore(data.allergies || []);
      const cleanedMedications = cleanForFirestore(data.medications || []);
      const cleanedContacts = cleanForFirestore(data.emergencyContacts || []);

      const healthRecordData = {
        scoutId,
        bloodType: data.bloodType || null,
        insuranceName: data.insuranceName || null,
        insuranceNumber: data.insuranceNumber || null,
        allergies: cleanedAllergies,
        medications: cleanedMedications,
        emergencyContacts: cleanedContacts,
        additionalNotes: data.additionalNotes || null,
        lastUpdatedAt: Timestamp.fromDate(now),
        lastUpdatedBy: updatedBy,
        signedByParentId: null,
        signedByParentName: null,
        signedAt: null,
      };

      await setDoc(doc(db, this.COLLECTION_NAME, scoutId), healthRecordData);

      return this.convertHealthRecord({ id: scoutId, ...healthRecordData });
    } catch (error) {
      console.error('Erreur lors de la création de la fiche santé:', error);
      throw error;
    }
  }

  /**
   * Met à jour une fiche santé
   */
  static async updateHealthRecord(
    scoutId: string,
    data: Partial<HealthRecordInput>,
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, scoutId);

      // Nettoyer et filtrer les valeurs undefined
      const updates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          // Nettoyer les objets imbriqués pour Firestore
          updates[key] = cleanForFirestore(value);
        }
      }

      updates.lastUpdatedAt = Timestamp.fromDate(new Date());
      updates.lastUpdatedBy = updatedBy;

      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la fiche santé:', error);
      throw error;
    }
  }

  /**
   * Ajoute une allergie à la fiche santé
   */
  static async addAllergy(
    scoutId: string,
    allergy: Allergy,
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, scoutId);
      await updateDoc(docRef, {
        allergies: arrayUnion(allergy),
        lastUpdatedAt: Timestamp.fromDate(new Date()),
        lastUpdatedBy: updatedBy,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'allergie:', error);
      throw error;
    }
  }

  /**
   * Supprime une allergie de la fiche santé
   */
  static async removeAllergy(
    scoutId: string,
    allergy: Allergy,
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, scoutId);
      await updateDoc(docRef, {
        allergies: arrayRemove(allergy),
        lastUpdatedAt: Timestamp.fromDate(new Date()),
        lastUpdatedBy: updatedBy,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'allergie:', error);
      throw error;
    }
  }

  /**
   * Ajoute un médicament à la fiche santé
   */
  static async addMedication(
    scoutId: string,
    medication: Medication,
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, scoutId);
      await updateDoc(docRef, {
        medications: arrayUnion(medication),
        lastUpdatedAt: Timestamp.fromDate(new Date()),
        lastUpdatedBy: updatedBy,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du médicament:', error);
      throw error;
    }
  }

  /**
   * Supprime un médicament de la fiche santé
   */
  static async removeMedication(
    scoutId: string,
    medication: Medication,
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, scoutId);
      await updateDoc(docRef, {
        medications: arrayRemove(medication),
        lastUpdatedAt: Timestamp.fromDate(new Date()),
        lastUpdatedBy: updatedBy,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du médicament:', error);
      throw error;
    }
  }

  /**
   * Ajoute un contact d'urgence à la fiche santé
   */
  static async addEmergencyContact(
    scoutId: string,
    contact: EmergencyContact,
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, scoutId);
      await updateDoc(docRef, {
        emergencyContacts: arrayUnion(contact),
        lastUpdatedAt: Timestamp.fromDate(new Date()),
        lastUpdatedBy: updatedBy,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du contact d\'urgence:', error);
      throw error;
    }
  }

  /**
   * Supprime un contact d'urgence de la fiche santé
   */
  static async removeEmergencyContact(
    scoutId: string,
    contact: EmergencyContact,
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, scoutId);
      await updateDoc(docRef, {
        emergencyContacts: arrayRemove(contact),
        lastUpdatedAt: Timestamp.fromDate(new Date()),
        lastUpdatedBy: updatedBy,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du contact d\'urgence:', error);
      throw error;
    }
  }

  /**
   * Signe la fiche santé (par un parent)
   */
  static async signHealthRecord(
    scoutId: string,
    parentId: string,
    parentName: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, scoutId);
      await updateDoc(docRef, {
        signedByParentId: parentId,
        signedByParentName: parentName,
        signedAt: Timestamp.fromDate(new Date()),
        lastUpdatedAt: Timestamp.fromDate(new Date()),
        lastUpdatedBy: parentId,
      });
    } catch (error) {
      console.error('Erreur lors de la signature de la fiche santé:', error);
      throw error;
    }
  }

  /**
   * Récupère le contact d'urgence principal
   */
  static getPrimaryEmergencyContact(
    healthRecord: HealthRecord
  ): EmergencyContact | null {
    return healthRecord.emergencyContacts.find((c) => c.isPrimary) || null;
  }

  /**
   * Crée ou met à jour une fiche santé (upsert)
   */
  static async upsertHealthRecord(
    scoutId: string,
    data: HealthRecordInput,
    updatedBy: string
  ): Promise<HealthRecord> {
    try {
      const existing = await this.getHealthRecord(scoutId);

      if (existing) {
        await this.updateHealthRecord(scoutId, data, updatedBy);
        const updated = await this.getHealthRecord(scoutId);
        return updated!;
      } else {
        return await this.createHealthRecord(scoutId, data, updatedBy);
      }
    } catch (error) {
      console.error('Erreur lors de l\'upsert de la fiche santé:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques de santé d'une unité
   * Retourne le nombre de fiches manquantes, non signées, et complètes
   */
  static async getUnitHealthStats(scoutIds: string[]): Promise<{
    total: number;
    missing: number;
    unsigned: number;
    complete: number;
    scoutsWithoutRecord: string[];
    scoutsWithUnsignedRecord: string[];
  }> {
    try {
      if (scoutIds.length === 0) {
        return {
          total: 0,
          missing: 0,
          unsigned: 0,
          complete: 0,
          scoutsWithoutRecord: [],
          scoutsWithUnsignedRecord: [],
        };
      }

      const scoutsWithoutRecord: string[] = [];
      const scoutsWithUnsignedRecord: string[] = [];
      let complete = 0;

      // Vérifier chaque scout
      for (const scoutId of scoutIds) {
        const healthRecord = await this.getHealthRecord(scoutId);

        if (!healthRecord) {
          // Pas de fiche santé
          scoutsWithoutRecord.push(scoutId);
        } else if (!healthRecord.signedByParentId) {
          // Fiche non signée par un parent
          scoutsWithUnsignedRecord.push(scoutId);
        } else {
          // Fiche complète et signée
          complete++;
        }
      }

      return {
        total: scoutIds.length,
        missing: scoutsWithoutRecord.length,
        unsigned: scoutsWithUnsignedRecord.length,
        complete,
        scoutsWithoutRecord,
        scoutsWithUnsignedRecord,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats de santé:', error);
      throw error;
    }
  }

  /**
   * Vérifie si une fiche santé est complète (a les informations essentielles)
   * Complète = contacts d'urgence + signature parent
   */
  static isHealthRecordComplete(record: HealthRecord): boolean {
    return (
      record.emergencyContacts.length > 0 &&
      record.signedByParentId !== null &&
      record.signedByParentId !== undefined
    );
  }

  /**
   * Vérifie si une fiche santé a les informations de base remplies
   * (sans exiger la signature parentale)
   */
  static hasBasicHealthInfo(record: HealthRecord): boolean {
    return record.emergencyContacts.length > 0;
  }

  /**
   * Vérifie si une fiche santé nécessite une signature parentale
   */
  static needsParentSignature(record: HealthRecord): boolean {
    return (
      record.emergencyContacts.length > 0 &&
      (record.signedByParentId === null || record.signedByParentId === undefined)
    );
  }
}
