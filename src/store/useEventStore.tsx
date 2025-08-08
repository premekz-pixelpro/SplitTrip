import { create } from 'zustand';
import { Bill, Event, FirebaseUser } from '@/types/types';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

interface EventStore {
  // Event-related state
  events: Event[];
  eventBills: Bill[];
  currentEvent: Event | null;
  eventParticipants: FirebaseUser[];
  participants: FirebaseUser[];

  // Users-related state
  availableUsers: FirebaseUser[];

  // Shared state
  loading: boolean;
  error: string | null;
  balances: Record<string, number>; // Added balances state

  // Event actions

  fetchEvents: () => Promise<void>;
  fetchBills: (eventId: string) => Promise<void>;
  setCurrentEvent: (event: Event | null) => void;
  createEvent: (title: string, description: string, creatorId: string) => Promise<void>;
  addParticipant: (eventId: string, user: FirebaseUser) => Promise<void>;
  getCurrentUserDetails: (userId: string) => FirebaseUser | null;
  updateTotalExpenses: (eventId: string, billAmount: number) => Promise<void>;
  setParticipants: (users: FirebaseUser[]) => void;
  fetchParticipants: () => Promise<void>;
  calculateBalances: (eventId: string) => Promise<Record<string, number>>;
  fetchAvailableUsers: (currentUserId: string) => Promise<void>;
  handleSnapshotUpdate: (updatedEventData: Event) => void;
  handleSnapshotError: (errorMessage: string) => void;
  handleSnapshotNotFound: () => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  eventBills: [],
  events: [],
  currentEvent: null,
  eventParticipants: [],
  participants: [],
  availableUsers: [],
  loading: false,
  error: null,
  balances: {},
  billsData: [],

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      set({ events: eventsData, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error fetching events',
        loading: false,
      });
    }
  },

  setCurrentEvent: (event: Event | null) => {
    set({ currentEvent: event });
  },

  createEvent: async (title: string, description: string, creatorId: string) => {
    set({ loading: true, error: null });
    try {
      const newEvent: Event = {
        id: '',
        title,
        eventBills: [],
        totalExpenses: 0,
        updatedAt: serverTimestamp() as Event['updatedAt'],
        description,
        creatorId,
        participants: [],
        createdAt: serverTimestamp() as Event['createdAt'],
        balances: {},
      };
      // Add logic to save the event to Firestore
      set((state) => ({ events: [...state.events, newEvent], loading: false }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error creating event',
        loading: false,
      });
    }
  },

  fetchBills: async (eventId: string) => {
    set({ loading: true, error: null });
    try {
      const billsRef = collection(db, 'bills');
      // console.log("BillsRef", billsRef)
      const q = query(billsRef, where('eventId', '==', eventId));
      const querySnapshot = await getDocs(q);
      const billsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          value: data.value || 0,
          creatorId: data.creatorId || '',
          eventId: data.eventId || '',
          createdAt: data.createdAt, // Timestamp
          updatedAt: data.updatedAt, // Timestamp
          participants: Array.isArray(data.participants) ? data.participants : [],
          // Dodaj inne wymagane pola
        };
      });

      set({ eventBills: billsData, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error fetching bills',
        loading: false,
      });
    }
  },

  // DO sprawadzenia czy przelicza odpowiednio
  updateTotalExpenses: async (eventId: string, billAmount: number) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const currentEvent = get().currentEvent;
      if (!currentEvent) throw new Error('No current event selected');
      const updatedEvent = {
        ...currentEvent,
        totalExpenses: (currentEvent.totalExpenses || 0) + billAmount,
      };
      await updateDoc(eventRef, { totalExpenses: updatedEvent.totalExpenses });
      set({ currentEvent: updatedEvent });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error updating expenses' });
    }
  },

  fetchAvailableUsers: async (currentUserId: string) => {
    set({ loading: true, error: null });
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as FirebaseUser[];

      // Filter out current user and existing participants
      const currentEvent = get().currentEvent;
      const filteredUsers = usersData.filter(
        (user) =>
          user.uid !== currentUserId &&
          !currentEvent?.participants.some((p) => p.userId === user.uid)
      );

      set({ availableUsers: filteredUsers, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error fetching users',
        loading: false,
      });
    }
  },

  getCurrentUserDetails: (userId: string) => {
    const { participants } = get();
    return participants.find((user) => user.uid === userId) || null;
  },

  addParticipant: async (eventId: string, user: FirebaseUser) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const newParticipant = {
        userId: user.uid,
        displayName: user.displayName,
        joinedAt: serverTimestamp() as unknown as Timestamp,
        balance: 0,
      };

      await updateDoc(eventRef, {
        participants: [...(get().currentEvent?.participants || []), newParticipant],
      });

      // Update local state
      set((state) => ({
        currentEvent: state.currentEvent
          ? {
              ...state.currentEvent,
              participants: [...state.currentEvent.participants, newParticipant],
            }
          : null,
        // Remove added user from available users
        availableUsers: state.availableUsers.filter((u) => u.uid !== user.uid),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error adding participant' });
    }
  },

  setParticipants: (users) => set({ participants: users }),

  fetchParticipants: async () => {
    const { currentEvent } = get();
    if (!currentEvent) return;

    set({ loading: true });
    try {
      const participantIds = currentEvent.participants.map((p) => p.userId);

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', 'in', participantIds));
      const querySnapshot = await getDocs(q);

      const usersData = querySnapshot.docs.map((doc) => {
        const userData = doc.data();
        const participantData = currentEvent.participants.find((p) => p.userId === doc.id);

        return {
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          image: userData.image,
          balance: participantData?.balance || 0,
        };
      });

      set({ participants: usersData, loading: false });
    } catch {
      set({ error: 'Error fetching participants', loading: false });
    }
  },

  calculateBalances: async (eventId: string) => {
    if (!eventId) {
      console.error('Cannot calculate balances without eventId');
      return {};
    }

    let calculatedBalances: Record<string, number> = {};

    try {
      // 1. Pobierz wszystkie rachunki dla eventu
      const billsQuery = query(collection(db, 'bills'), where('eventId', '==', eventId));
      // console.log("BillsQuery", billsQuery)
      const billsSnapshot = await getDocs(billsQuery);
      const bills = billsSnapshot.docs.map((doc) => doc.data() as Bill);
      // console.log("BillsSnapshot", billsSnapshot)
      // console.log("Bills", bills)

      // 2. Pobierz aktualną listę ID uczestników z dokumentu wydarzenia (źródło prawdy o uczestnikach)
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) {
        throw new Error('Event document not found for balance calculation.');
      }
      const eventData = eventSnap.data() as Event;
      // Użyj nowszej struktury participants, jeśli taka jest
      //Co jesli participant zostanie usunięty lub dodany?
      const participantIds = (eventData.participants || []).map(
        (p: { userId: string }) => p.userId
      );
      //  console.log("ParticipantIds", participantIds)

      calculatedBalances = participantIds.reduce((acc: Record<string, number>, userId) => {
        acc[userId] = 0; // Initialize balance for each user
        return acc;
      }, {});

      // 4. Dla każdego rachunku, dodaj/odejmij share od odpowiedniego uczestnika
      bills.forEach((bill) => {
        if (bill.participants && Array.isArray(bill.participants)) {
          // suma zapłaconych udziałów
          const paidAmount = bill.participants.reduce((sum, p) => {
            return sum + (p.hasPaid && !p.creator ? p.share || 0 : 0);
          }, 0);

          bill.participants.forEach((participant) => {
            const userId = participant.userId;

            if (Object.prototype.hasOwnProperty.call(calculatedBalances, userId)) {
              if (participant.creator) {
                // Dla creatora: wartość rachunku minus jego udział minus suma zapłaconych udziałów
                calculatedBalances[userId] +=
                  Number((bill.value - participant.share - paidAmount).toFixed(1)) || 0;
                // console.log("Creator balance update:", {
                //   userId,
                //   billValue: bill.value,
                //   creatorShare: participant.share,
                //   paidByOthers: paidAmount,
                //   finalDelta: bill.value - participant.share - paidAmount
                // });
              } else {
                // Dla pozostałych uczestników
                if (participant.hasPaid) {
                  // Jeśli już zapłacił, nie dodawaj do jego salda
                  calculatedBalances[userId] += 0;
                } else {
                  // Jeśli nie zapłacił, dodaj jego udział jako dług
                  calculatedBalances[userId] += Number(participant.share.toFixed(1)) || 0;
                }
                // console.log("Participant balance update:", {
                //   userId,
                //   hasPaid: participant.hasPaid,
                //   share: participant.share
                // });
              }
            }
          });
        }
      });

      // 5. Zapisz obliczone salda z powrotem do dokumentu wydarzenia w Firestore
      await updateDoc(eventRef, {
        balances: calculatedBalances, // Zapisz całą mapę sald
        updatedAt: serverTimestamp(), // Zaktualizuj czas modyfikacji
      });
      // 6. Zaktualizuj lokalny stan Zustand (opcjonalne, jeśli używasz listenerów Firestore)
      set({ balances: calculatedBalances });

      // console.log("Balances calculated and updated in Firestore:", calculatedBalances);
      return calculatedBalances; // Zwróć obliczone salda
    } catch (error) {
      console.error('Error calculating and updating balances:', error);
      // Rozważ ustawienie stanu błędu w Zustand
      set({ error: error instanceof Error ? error.message : 'Error calculating balances' });
      return calculatedBalances; // Zwróć ostatni znany stan sald (może być pusty)
    }
  },
  handleSnapshotUpdate: (updatedEventData) => {
    set({
      currentEvent: updatedEventData,
      balances: updatedEventData.balances || {},
      // participants: updatedEventData.participants || get().participants, // Aktualizuj lub zostaw stare
      error: null,
    });
  },
  handleSnapshotError: (errorMessage) => {
    set({ error: errorMessage });
  },
  handleSnapshotNotFound: () => {
    set({
      currentEvent: null,
      balances: {},
      participants: [],
      error: 'Event not found or deleted.',
    });
  },
}));
