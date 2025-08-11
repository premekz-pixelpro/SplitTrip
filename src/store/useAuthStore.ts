import { create } from 'zustand';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { FirebaseUser } from '@/types/types';
import { doc, getDoc } from 'firebase/firestore';

// Zmienić relacje w bazie danych, user w Eventach ma byc tylko referencja do usera w users

// Sprawdzic Hello user.displayName z czego ciagnie cos nie tak

interface AuthStore {
  user: User | null;
  userData: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  fetchUserData: (userId: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  userData: null,
  loading: false,
  error: null,

  fetchUserData: async (userId: string) => {
    try {
      set({ loading: true });
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const userData = {
          uid: userId,
          displayName: userSnapshot.data().displayName || 'Unknown User',
          email: userSnapshot.data().email || '',
          image: userSnapshot.data().image || '',
          balance: userSnapshot.data().balance || 0,
        };
        set({ userData });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      set({ user: userCredential.user });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      set({ user: userCredential.user });
      await useAuthStore.getState().fetchUserData(loggedInUser.uid);

      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Użytkownik jest zalogowany
    useAuthStore.setState({ user });
    // Pobierz dane użytkownika z Firestore
    await useAuthStore.getState().fetchUserData(user.uid);
  } else {
    // Użytkownik jest wylogowany
    useAuthStore.setState({ user: null, userData: null });
  }
});
