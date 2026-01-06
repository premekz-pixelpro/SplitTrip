import { Timestamp } from 'firebase/firestore';

export interface Event {
  id: string;
  title: string;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  creatorId: string;
  participants: EventParticipant[];
  totalExpenses: number;
  eventBills: Bill[];
  balances: Record<string, number>; // Klucz to userId, wartość to saldo
}

export interface EventParticipant {
  userId: string;
  displayName: string;
  joinedAt: Timestamp | null; // jak dodaje do tablicy to null
  balance: number;
  image?: string;
}

export interface Bill {
  id: string;
  title: string;
  value: number;
  creatorId: string;
  eventId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  participants: {
    userId: string;
    displayName: string;
    image?: string;
    hasPaid: boolean;
    share: number;
    shareType: 'equal' | 'fixed';
    creator: boolean;
  }[];
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  image?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  balance: number;
  friends: User[];
}

export interface BillParticipant {
  userId: string;
  displayName: string;
  creator: boolean;
  hasPaid: boolean;
  share: number;
  shareType: 'equal' | 'fixed';
  fixedAmount?: number;
}

export interface FirebaseUser {
  uid: string;
  displayName: string;
  email: string;
  image?: string;
  events: string[]; // Lista ID wydarzeńences: {
  currency: string;
  language: string;
}
