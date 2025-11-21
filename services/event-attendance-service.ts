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
import { EventAttendance, AttendanceStatus } from '@/types';

export class EventAttendanceService {
  private static readonly COLLECTION_NAME = 'eventAttendances';

  private static convertAttendance(data: DocumentData): EventAttendance {
    return {
      id: data.id,
      eventId: data.eventId,
      scoutId: data.scoutId,
      status: data.status as AttendanceStatus,
      parentConfirmedAt: data.parentConfirmedAt?.toDate(),
      parentConfirmedBy: data.parentConfirmedBy,
      notes: data.notes,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }

  static async registerAttendance(
    eventId: string,
    scoutId: string,
    status: AttendanceStatus = AttendanceStatus.PENDING
  ): Promise<EventAttendance> {
    const now = new Date();
    const attendanceData = {
      eventId,
      scoutId,
      status,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const attendanceRef = doc(collection(db, this.COLLECTION_NAME));
    await setDoc(attendanceRef, attendanceData);
    return this.convertAttendance({ id: attendanceRef.id, ...attendanceData });
  }

  static async confirmAttendance(
    attendanceId: string,
    parentId?: string
  ): Promise<void> {
    const updates: any = {
      status: AttendanceStatus.CONFIRMED,
      updatedAt: Timestamp.fromDate(new Date()),
    };
    if (parentId) {
      updates.parentConfirmedBy = parentId;
      updates.parentConfirmedAt = Timestamp.fromDate(new Date());
    }
    await updateDoc(doc(db, this.COLLECTION_NAME, attendanceId), updates);
  }

  static async declineAttendance(attendanceId: string): Promise<void> {
    await updateDoc(doc(db, this.COLLECTION_NAME, attendanceId), {
      status: AttendanceStatus.DECLINED,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  static async getAttendanceByEvent(eventId: string): Promise<EventAttendance[]> {
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where('eventId', '==', eventId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      this.convertAttendance({ id: doc.id, ...doc.data() })
    );
  }
}

