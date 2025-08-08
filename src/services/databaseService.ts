import { db } from '@/config/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import type { User , Bill } from '@/types/types';

export const collections = {
  users: collection(db, 'users'),
  bills: collection(db, 'bills'),
  events: collection(db, 'events'),
  friendships: collection(db, 'friendships')
};

export const userService = {
  createUser: async (userData: Omit<User, 'id' | 'createdAt'>) => {
    return await addDoc(collections.users, {
      ...userData,
      createdAt: serverTimestamp()
    });
  },

  getUserFriends: async (userId: string) => {
    const q = query(
      collections.friendships,
      where('status', '==', 'accepted'),
      where('users.requesterId', '==', userId)
    );
    return await getDocs(q);
  }
};

export const billService = {
  createBill: async (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await addDoc(collections.bills, {
      ...billData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  getUserBills: async (userId: string) => {
    const q = query(
      collections.bills,
      where('creatorId', '==', userId)
    );
    return await getDocs(q);
  }
};