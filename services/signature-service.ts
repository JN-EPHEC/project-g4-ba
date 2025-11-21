import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface DocumentSignature {
  id: string;
  documentId: string;
  signedBy: string;
  signatureData: string;
  signedAt: Date;
  ipAddress?: string;
}

export class SignatureService {
  private static readonly COLLECTION_NAME = 'documentSignatures';

  static async signDocument(
    documentId: string,
    signedBy: string,
    signatureData: string
  ): Promise<DocumentSignature> {
    const signatureData_obj = {
      documentId,
      signedBy,
      signatureData,
      signedAt: Timestamp.fromDate(new Date()),
    };
    const sigRef = doc(collection(db, this.COLLECTION_NAME));
    await setDoc(sigRef, signatureData_obj);
    return {
      id: sigRef.id,
      ...signatureData_obj,
      signedAt: signatureData_obj.signedAt.toDate(),
    };
  }

  static async getSignaturesByDocument(documentId: string): Promise<DocumentSignature[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('documentId', '==', documentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      signedAt: doc.data().signedAt?.toDate() || new Date(),
    })) as DocumentSignature[];
  }
}

