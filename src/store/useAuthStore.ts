import { create } from 'zustand';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loadingAuth: boolean;
  authError: string | null;
  checkAuthState: () => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User | undefined>;
  signUp: (email: string, password: string, displayName: string) => Promise<User | undefined>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Inicjalizacja stanu
  set({
    user: null,
    isAuthenticated: false,
    loadingAuth: true, // Zaczynamy jako true, bo czekamy na pierwszy stan auth
    authError: null,
  });

  // Nasłuchiwanie zmian stanu uwierzytelniania, odpala sie odrazu po zainicjalizowaniu, wazne bo jakos ciezko bylo mi to zrozumiec, js tak dziala-  odpala kod dochodzi do zmiennej unsubscribe, patrzy co tam jest i widzi wywolanie funkcji wiec ja odpala nie musi byc unsubscribe gdziekolwiek uzyte, jest to w tym przypadku troche mylaca nazwa jesli nie uzywam bo tak naprwde z tego lisynera czerpie sie usera i ustawia stan w zustand
  // To jest asynchroniczne, wiec na poczatku loadingAuth jest true, a potem jak przyjdzie odpowiedz to sie ustawi na false
  // To jest wazne bo dzieki temu wiem czy sprawdzanie auth sie skonczylo czy nie

  let resolveAuthReady: ((user: User | null) => void) | null = null;
  const authReady = new Promise<User | null>((resolve) => {
    resolveAuthReady = resolve;
  });

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    set({
      user: user,
      isAuthenticated: !!user,
      loadingAuth: false,
      authError: null,
    });

    if (resolveAuthReady) {
      resolveAuthReady(user);
      resolveAuthReady = null;
    }
  });

  return {
    // Początkowe wartości (nadpisane przez listener)
    user: null,
    isAuthenticated: false,
    loadingAuth: true,
    authError: null,

    checkAuthState: async () => {
      // Wait until Firebase reports the first auth state.
      // The listener above also updates zustand state, so this is mostly for callers
      // that want to await initialization.
      return authReady;
    },

    signIn: async (email, password) => {
      set({ loadingAuth: true, authError: null });
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return auth.currentUser!; // Non-null assertion, czyli do typescripta wiem ze ta wartosc napewno nie jest null lub undefined //
        // Stan user zostanie zaktualizowany przez onAuthStateChanged
      } catch (error) {
        set({ authError: (error as Error).message });
        throw error;
      } finally {
        set({ loadingAuth: false });
      }
    },

    //to nie jest rozwiazanie idealne bo jak sie wysypie zapis do firestore to uzytkownik bedzie w auth ale nie w firestore
    //lepiej zrobic to jako cloud function ale to platne wiec lepiej samemu dlubac backend
    signUp: async (email, password, displayName) => {
      set({ loadingAuth: true, authError: null });
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // dodac info ze sie udalo

        const user = userCredential.user;
        // console.log('userCredential.user', user);
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName,
          image: user.photoURL || '', //do zmiany image na photoURL wszedzie ??
          createdAt: new Date(),
          events: [],
          preferences: {
            currency: 'PLN',
            language: 'pl',
          },
        });

        set({ user });
        return user;
      } catch (error) {
        set({ authError: (error as Error).message });
        throw error;
      } finally {
        set({ loadingAuth: false });
      }
    },

    logout: async () => {
      set({ loadingAuth: true, authError: null });
      try {
        await signOut(auth);
        // Stan user zostanie zaktualizowany przez onAuthStateChanged na null
      } catch (error) {
        set({ authError: (error as Error).message });
      } finally {
        set({ loadingAuth: false });
      }
    },
  };
});
