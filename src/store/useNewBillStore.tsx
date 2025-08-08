import { create } from 'zustand';
import { db } from '@/config/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { useEventStore } from '@/store/useEventStore';
import { FirebaseUser } from '@/types/types';

interface NewBillStore {
  title: string;
  value: number;
  participants: {
    userId: string;
    displayName: string;
    image?: string;
    hasPaid: boolean;
    share: number;
    shareType: 'equal' | 'fixed';
    fixedAmount?: number;
  }[];
  loading: boolean;
  error: string | null;
  setTitle: (title: string) => void;
  setValue: (value: number) => void;
  setShare: (value: number) => void;
  addParticipant: (user: FirebaseUser) => void;
  removeParticipant: (userId: string) => void;
  markAsPaid: (userId: string) => void;
  createBill: (currentUser: string, eventId: string) => Promise<void>;
  reset: () => void;
}

export const useNewBillStore = create<NewBillStore>((set, get) => {
  // Helper function to calculate share
  const calculateSharePerParticipant = (totalValue: number, numberOfParticipants: number) => {
    return numberOfParticipants > 0 ? totalValue / numberOfParticipants : 0;
  };

  // Helper function to format share based on hasPaid status
  const formatShare = (shareValue: number, hasPaid: boolean) => {
    const formattedShare = parseFloat(Math.abs(shareValue).toFixed(1));
    return hasPaid ? formattedShare : -formattedShare;
  };

  return {
    title: '',
    value: 0,
    participants: [],
    loading: false,
    error: null,

    setTitle: (title) => set({ title }),
    setValue: (value) => set({ value }),

    setShare: () =>
      set((state) => {
        const numberOfParticipants = state.participants.length + 1; // +1 for the creator
        const sharePerParticipant = calculateSharePerParticipant(state.value, numberOfParticipants);

        return {
          participants: state.participants.map((p) => ({
            ...p,
            share: formatShare(sharePerParticipant, p.hasPaid),
          })),
        };
      }),

    markAsPaid: (userId) =>
      set((state) => ({
        participants: state.participants.map((p) =>
          p.userId === userId
            ? {
                ...p,
                hasPaid: !p.hasPaid,
                share: formatShare(Math.abs(p.share), !p.hasPaid),
              }
            : p
        ),
      })),

    addParticipant: (user) =>
      set((state) => ({
        participants: [
          ...state.participants,
          {
            userId: user.uid,
            creator: false,
            displayName: user.displayName,
            image: user.image,
            hasPaid: false,
            share: 0,
            shareType: 'equal',
          },
        ],
      })),

    removeParticipant: (userId) =>
      set((state) => ({
        participants: state.participants.filter((p) => p.userId !== userId),
      })),

    createBill: async (currentUser: string, eventId: string) => {
      const state = get();
      set({ loading: true, error: null });

      try {
        // Pobierz eventParticipants z useEventStore za pomocą getState()
        const eventState = useEventStore.getState();
        const eventParticipants = eventState.participants;

        // Oblicz share dla wszystkich uczestników
        const numberOfParticipants = state.participants.length + 1; // +1 dla creatora
        const sharePerParticipant = calculateSharePerParticipant(state.value, numberOfParticipants);

        // Creator jest zawsze oznaczony jako zapłacony
        const creatorShare = formatShare(sharePerParticipant, true);

        // Znajdź dane zalogowanego użytkownika w eventParticipants
        const currentUserFromEvent = eventParticipants.find(
          (participant) => participant.uid === currentUser
        );
        const allParticipants = [
          ...state.participants,
          ...(!state.participants.some((p) => p.userId === currentUser)
            ? [
                {
                  userId: currentUserFromEvent?.uid,
                  displayName: currentUserFromEvent?.displayName,
                  creator: true,
                  image: currentUserFromEvent?.image,
                  hasPaid: true,
                  share: creatorShare,
                  shareType: 'equal',
                },
              ]
            : []),
        ];

        // console.log("CurenUser", eventParticipants);
        // Krok 1: Utwórz nowy dokument w kolekcji "bills"
        const billRef = await addDoc(collection(db, 'bills'), {
          title: state.title,
          value: state.value,
          creatorId: currentUser,
          participants: allParticipants,
          eventId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Krok 2: Zaktualizuj dokument wydarzenia
        const eventDocRef = doc(db, 'events', eventId);
        await updateDoc(eventDocRef, {
          bills: arrayUnion(billRef.id), // Dodaj tylko ID rachunku do tablicy
          updatedAt: serverTimestamp(),
        });

        // Krok 3: Zaktualizuj totalExpenses w dokumencie wydarzenia
        await eventState.updateTotalExpenses(eventId, state.value);

        // Krok 4: Zaktualizuj salda wszystkich uczestników (NEW!)
        // Pobierz bieżące salda lub oblicz je na nowo
        const currentBalances = await eventState.calculateBalances(eventId);

        // Aktualizuj salda uczestników w dokumencie wydarzenia
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
          balances: currentBalances,
          updatedAt: serverTimestamp(),
        });

        set({ loading: false, error: null }); // Clear loading state on success
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Error creating bill: ', error);
          set({ loading: false, error: error.message }); // Set error state
        } else {
          console.error('Unexpected error: ', error);
          set({ loading: false, error: 'An unexpected error occurred.' });
        }
      }
    },

    reset: () =>
      set({
        title: '',
        value: 0,
        participants: [],
        error: null,
      }),
  };
});
