import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { FirebaseUser } from '@/types/types';

interface useUserProfileStore {
  userProfile: FirebaseUser | null;
  loadingProfile: boolean;
  profileError: string | null;
  fetchUserProfile: (uid: string) => Promise<void>;
  // updateUserProfile: (uid: string, data: Partial<FirebaseUser>) => Promise<void>;
}

export const useUserProfileStore = create<useUserProfileStore>((set) => ({
  userProfile: null,
  loadingProfile: false,
  profileError: null,

  fetchUserProfile: async (uid) => {
    set({ loadingProfile: true, profileError: null });
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const userProfile: FirebaseUser = {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          events: userData.events || [],
          currency: userData.preferences?.currency || 'PLN',
          language: userData.preferences?.language || 'pl',
        };
        set({ userProfile, loadingProfile: false });
      } else {
        set({ profileError: 'User not found', loadingProfile: false });
      }
    } catch (error) {
      set({ profileError: (error as Error).message, loadingProfile: false });
    } finally {
      set({ loadingProfile: false });
    }
  },
}));
