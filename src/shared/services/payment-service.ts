import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Payment, PaymentType, PaymentStatus } from '@/types';

export class PaymentService {
  private static readonly COLLECTION_NAME = 'payments';

  private static convertPayment(data: DocumentData): Payment {
    return {
      id: data.id,
      scoutId: data.scoutId,
      type: data.type as PaymentType,
      amount: data.amount,
      dueDate: data.dueDate?.toDate() || new Date(),
      status: data.status as PaymentStatus,
      description: data.description,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  static async createPayment(
    scoutId: string,
    type: PaymentType,
    amount: number,
    dueDate: Date,
    description: string
  ): Promise<Payment> {
    const now = new Date();
    const paymentData = {
      scoutId,
      type,
      amount,
      dueDate: Timestamp.fromDate(dueDate),
      status: PaymentStatus.PENDING,
      description,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    const paymentRef = doc(collection(db, this.COLLECTION_NAME));
    await setDoc(paymentRef, paymentData);
    return this.convertPayment({ id: paymentRef.id, ...paymentData });
  }

  static async getPaymentsByScout(scoutId: string): Promise<Payment[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('scoutId', '==', scoutId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.convertPayment({ id: doc.id, ...doc.data() }));
  }

  static async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus
  ): Promise<void> {
    await updateDoc(doc(db, this.COLLECTION_NAME, paymentId), {
      status,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }
}

