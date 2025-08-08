import { create } from 'zustand';
import { FirebaseUser } from '@/types/types';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface UsersStore {
  users: FirebaseUser[];
  loading: boolean;
  error: string | null;
  currentUserDetails: FirebaseUser | null;
  fetchUsers: (currentUserId: string) => Promise<void>;
  fetchCurrentUser: (userId: string) => Promise<void>;
}

export const useUsersStore = create<UsersStore>((set) => ({
  users: [],
  currentUserDetails: null,
  loading: false,
  error: null,
  fetchUsers: async (currentUserId: string) => {
    set({ loading: true, error: null });
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs
        .map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as FirebaseUser[];
      
      // Filter out the current user
      const filteredUsers = usersData.filter(user => user.uid !== currentUserId);
      set({ users: filteredUsers, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error fetching users', loading: false });
    }
  },

  fetchCurrentUser: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = {
          uid: userDoc.id,
          ...userDoc.data()
        } as FirebaseUser;
        
        set({ currentUserDetails: userData, loading: false });
      } else {
        throw new Error('User not found');
      }
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Error fetching current user', 
        loading: false,
        currentUserDetails: null
      });
    }
  }
}));