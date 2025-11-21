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
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Document, DocumentType } from '@/types';

export class DocumentService {
  private static readonly COLLECTION_NAME = 'documents';

  private static convertDocument(data: DocumentData): Document {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type as DocumentType,
      fileUrl: data.fileUrl,
      unitId: data.unitId,
      scoutId: data.scoutId,
      createdBy: data.createdBy,
      isNew: data.isNew || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  static async createDocument(
    title: string,
    description: string,
    type: DocumentType,
    fileUrl: string,
    createdBy: string,
    unitId?: string,
    scoutId?: string
  ): Promise<Document> {
    const now = new Date();
    const docData = {
      title,
      description,
      type,
      fileUrl,
      unitId: unitId || null,
      scoutId: scoutId || null,
      createdBy,
      isNew: true,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    const docRef = doc(collection(db, this.COLLECTION_NAME));
    await setDoc(docRef, docData);
    return this.convertDocument({ id: docRef.id, ...docData });
  }

  static async getDocuments(unitId?: string, scoutId?: string): Promise<Document[]> {
    let q;
    if (scoutId) {
      q = query(collection(db, this.COLLECTION_NAME), where('scoutId', '==', scoutId));
    } else if (unitId) {
      q = query(collection(db, this.COLLECTION_NAME), where('unitId', '==', unitId));
    } else {
      q = query(collection(db, this.COLLECTION_NAME));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.convertDocument({ id: doc.id, ...doc.data() }));
  }

  static async getDocumentById(documentId: string): Promise<Document | null> {
    const docSnap = await getDoc(doc(db, this.COLLECTION_NAME, documentId));
    if (!docSnap.exists()) return null;
    return this.convertDocument({ id: docSnap.id, ...docSnap.data() });
  }
}

