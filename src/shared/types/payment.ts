/**
 * Types pour la gestion des paiements et cotisations
 */

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  MEMBERSHIP = 'membership',
  CAMP = 'camp',
  ACTIVITY = 'activity',
  EQUIPMENT = 'equipment',
  OTHER = 'other',
}

export interface Payment {
  id: string;
  scoutId: string;
  title: string;
  description?: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  dueDate: Date;
  paidAt?: Date;
  paidBy?: string; // ID du parent qui a payé
  paymentMethod?: string;
  transactionId?: string;
  createdBy: string; // ID de l'animateur
  createdAt: Date;
  updatedAt: Date;
}
