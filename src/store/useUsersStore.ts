import { create } from 'zustand';
import { FirebaseUser } from '@/types/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface UsersStore {
  users: FirebaseUser[];
  loading: boolean;
  error: string | null;
  fetchUsers: (currentUserId: string) => Promise<void>;
}

export const useUsersStore = create<UsersStore>((set) => ({
  users: [],
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
  }
}));