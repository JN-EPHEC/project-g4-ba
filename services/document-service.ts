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
import { Document, DocumentType, DocumentSignature, DocumentStatus } from '@/types';

export class DocumentService {
  private static readonly COLLECTION_NAME = 'documents';
  private static readonly SIGNATURES_COLLECTION = 'documentSignatures';

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
      requiresSignature: data.requiresSignature || false,
      expiryDate: data.expiryDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  private static convertSignature(data: DocumentData): DocumentSignature {
    return {
      id: data.id,
      documentId: data.documentId,
      scoutId: data.scoutId,
      parentId: data.parentId,
      signatureData: data.signatureData,
      signedAt: data.signedAt?.toDate() || new Date(),
      ipAddress: data.ipAddress,
    };
  }

  static async createDocument(
    title: string,
    description: string,
    type: DocumentType,
    fileUrl: string,
    createdBy: string,
    unitId?: string,
    scoutId?: string,
    requiresSignature: boolean = false,
    expiryDate?: Date
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
      requiresSignature,
      expiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null,
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

  /**
   * Récupère les documents nécessitant une signature pour une unité
   */
  static async getDocumentsRequiringSignature(unitId: string): Promise<Document[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('unitId', '==', unitId),
      where('requiresSignature', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.convertDocument({ id: doc.id, ...doc.data() }));
  }

  /**
   * Signe un document (par un parent)
   */
  static async signDocument(
    documentId: string,
    scoutId: string,
    parentId: string,
    signatureData: string
  ): Promise<DocumentSignature> {
    const now = new Date();
    const signatureDoc = {
      documentId,
      scoutId,
      parentId,
      signatureData,
      signedAt: Timestamp.fromDate(now),
    };

    const sigRef = doc(collection(db, this.SIGNATURES_COLLECTION));
    await setDoc(sigRef, signatureDoc);

    return this.convertSignature({ id: sigRef.id, ...signatureDoc });
  }

  /**
   * Vérifie si un document a été signé pour un scout
   */
  static async isDocumentSigned(documentId: string, scoutId: string): Promise<boolean> {
    const q = query(
      collection(db, this.SIGNATURES_COLLECTION),
      where('documentId', '==', documentId),
      where('scoutId', '==', scoutId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  /**
   * Récupère la signature d'un document pour un scout
   */
  static async getDocumentSignature(
    documentId: string,
    scoutId: string
  ): Promise<DocumentSignature | null> {
    const q = query(
      collection(db, this.SIGNATURES_COLLECTION),
      where('documentId', '==', documentId),
      where('scoutId', '==', scoutId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return this.convertSignature({ id: doc.id, ...doc.data() });
  }

  /**
   * Récupère toutes les signatures d'un parent
   */
  static async getSignaturesByParent(parentId: string): Promise<DocumentSignature[]> {
    const q = query(
      collection(db, this.SIGNATURES_COLLECTION),
      where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.convertSignature({ id: doc.id, ...doc.data() }));
  }

  /**
   * Récupère les statistiques d'autorisations pour une unité
   * Retourne le nombre de documents en attente de signature par scout
   */
  static async getUnitAuthorizationStats(
    unitId: string,
    scoutIds: string[]
  ): Promise<{
    totalDocuments: number;
    pendingSignatures: number;
    completedSignatures: number;
    scoutsWithPendingDocs: string[];
  }> {
    try {
      if (scoutIds.length === 0) {
        return {
          totalDocuments: 0,
          pendingSignatures: 0,
          completedSignatures: 0,
          scoutsWithPendingDocs: [],
        };
      }

      // Récupérer tous les documents nécessitant une signature pour cette unité
      const documents = await this.getDocumentsRequiringSignature(unitId);
      const totalDocuments = documents.length;

      if (totalDocuments === 0) {
        return {
          totalDocuments: 0,
          pendingSignatures: 0,
          completedSignatures: 0,
          scoutsWithPendingDocs: [],
        };
      }

      let completedSignatures = 0;
      const scoutsWithPendingDocs: string[] = [];

      // Pour chaque scout, vérifier combien de documents ont été signés
      for (const scoutId of scoutIds) {
        let hasPendingDoc = false;

        for (const document of documents) {
          const isSigned = await this.isDocumentSigned(document.id, scoutId);
          if (isSigned) {
            completedSignatures++;
          } else {
            hasPendingDoc = true;
          }
        }

        if (hasPendingDoc) {
          scoutsWithPendingDocs.push(scoutId);
        }
      }

      const totalExpectedSignatures = totalDocuments * scoutIds.length;
      const pendingSignatures = totalExpectedSignatures - completedSignatures;

      return {
        totalDocuments,
        pendingSignatures,
        completedSignatures,
        scoutsWithPendingDocs,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats d\'autorisations:', error);
      throw error;
    }
  }

  /**
   * Récupère les documents en attente de signature pour un scout (vue parent)
   */
  static async getPendingDocumentsForScout(
    scoutId: string,
    unitId: string
  ): Promise<Document[]> {
    const documents = await this.getDocumentsRequiringSignature(unitId);
    const pendingDocs: Document[] = [];

    for (const document of documents) {
      const isSigned = await this.isDocumentSigned(document.id, scoutId);
      if (!isSigned) {
        pendingDocs.push(document);
      }
    }

    return pendingDocs;
  }

  /**
   * Récupère tous les documents signés pour un scout
   */
  static async getSignedDocumentsForScout(
    scoutId: string,
    unitId: string
  ): Promise<{ document: Document; signature: DocumentSignature }[]> {
    const documents = await this.getDocumentsRequiringSignature(unitId);
    const signedDocs: { document: Document; signature: DocumentSignature }[] = [];

    for (const document of documents) {
      const signature = await this.getDocumentSignature(document.id, scoutId);
      if (signature) {
        signedDocs.push({ document, signature });
      }
    }

    return signedDocs;
  }
}

