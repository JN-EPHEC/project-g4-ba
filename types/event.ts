/**
 * Types pour la gestion des événements
 */

export enum EventType {
  MEETING = 'meeting',
  CAMP = 'camp',
  ACTIVITY = 'activity',
  TRAINING = 'training',
  OTHER = 'other',
}

export enum AttendanceStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  DECLINED = 'declined',
  ABSENT = 'absent',
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  unitId: string;
  location: string;
  startDate: Date;
  endDate: Date;
  imageUrl?: string;
  createdBy: string; // ID de l'animateur
  requiresParentConfirmation: boolean;
  maxParticipants?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  scoutId: string;
  status: AttendanceStatus;
  parentConfirmedAt?: Date;
  parentConfirmedBy?: string; // ID du parent
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
