import { Timestamp } from 'firebase/firestore';

export interface Event {
  id: string;
  title: string;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  creatorId: string;
  participants:  EventParticipant[];
  totalExpenses: number;
  eventBills: Bill[];
}

export interface EventParticipant {
  userId: string;
  displayName: string;
  joinedAt: Timestamp;
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
  balance: number;
}
