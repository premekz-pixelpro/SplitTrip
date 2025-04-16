import { create } from 'zustand';
import { Bill, Event, FirebaseUser } from '@/types/types';
import { collection, getDocs, updateDoc, doc, serverTimestamp, Timestamp, query, where } from 'firebase/firestore';
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
  updateTotalExpenses: (eventId: string, billAmount: number) => Promise<void>;
  setParticipants: (users: FirebaseUser[]) => void;
  fetchParticipants: () => Promise<void>;
  calculateBalances: (eventId: string) => Promise<Record<string, number>>; // Added calculateBalances action

  // Users actions
  fetchAvailableUsers: (currentUserId: string) => Promise<void>;
}

export const useEventStore = create<EventStore>((set, get) => ({
  // Initialize state
  eventBills: [],
  events: [],
  currentEvent: null,
  eventParticipants: [],
  participants: [],
  availableUsers: [],
  loading: false,
  error: null,
  balances: {}, // Initialize balances

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const querySnapshot = await getDocs(collection(db, 'events'));
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      set({ events: eventsData, loading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Error fetching events', 
        loading: false 
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
      };
      // Add logic to save the event to Firestore
      set(state => ({ events: [...state.events, newEvent], loading: false }));
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Error creating event', 
        loading: false 
      });
    }
  },

  fetchBills: async (eventId: string) => {
    set({ loading: true, error: null });
    try {
      const billsRef = collection(db, 'bills');
      const q = query(billsRef, where('eventId', '==', eventId));
      const querySnapshot = await getDocs(q);
      const billsData = querySnapshot.docs.map(doc => {
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
        loading: false 
      });
    }
  },

  updateTotalExpenses: async (eventId: string, billAmount: number) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const currentEvent = get().currentEvent;
      if (!currentEvent) throw new Error('No current event selected');
      const updatedEvent = {
        ...currentEvent,
        totalExpenses: (currentEvent.totalExpenses || 0) + billAmount
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
      const usersData = querySnapshot.docs
        .map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as FirebaseUser[];
      
      // Filter out current user and existing participants
      const currentEvent = get().currentEvent;
      const filteredUsers = usersData.filter(user => 
        user.uid !== currentUserId && 
        !currentEvent?.participants.some(p => p.userId === user.uid)
      );

      set({ availableUsers: filteredUsers, loading: false });
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Error fetching users', 
        loading: false 
      });
    }
  },

  addParticipant: async (eventId: string, user: FirebaseUser) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const newParticipant = {
        userId: user.uid,
        displayName: user.displayName,
        joinedAt: serverTimestamp() as unknown as Timestamp,
        balance: 0
      };

      await updateDoc(eventRef, {
        participants: [
          ...get().currentEvent?.participants || [],
          newParticipant
        ]
      });

      // Update local state
      set(state => ({
        currentEvent: state.currentEvent ? {
          ...state.currentEvent,
          participants: [...state.currentEvent.participants, newParticipant]
        } : null,
        // Remove added user from available users
        availableUsers: state.availableUsers.filter(u => u.uid !== user.uid)
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
      const participantIds = currentEvent.participants.map(p => p.userId);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', 'in', participantIds));
      const querySnapshot = await getDocs(q);
      
      const usersData = querySnapshot.docs.map(doc => {
        const userData = doc.data();
        const participantData = currentEvent.participants.find(
          p => p.userId === doc.id
        );
        
        return {
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          image: userData.image,
          balance: participantData?.balance || 0
        };
      });

      set({ participants: usersData, loading: false });
    } catch {
      set({ error: 'Error fetching participants', loading: false });
    }
  },

  calculateBalances: async (eventId: string) => {
    try {
      // 1. Pobierz wszystkie rachunki dla eventu
      const billsQuery = query(
        collection(db, "bills"),
        where("eventId", "==", eventId),
      );
      const billsSnapshot = await getDocs(billsQuery);
      const bills = billsSnapshot.docs.map(doc => doc.data() as { participants: { userId: string; share: number }[] });
      console.log("BillsQuery", bills)
      
      // 2. Inicjalizuj mapę balance dla wszystkich uczestników
      const balances: Record<string, number> = {};
      
      // 3. Dla każdego rachunku, dodaj share do odpowiedniego uczestnika
      bills.forEach(bill => {
        bill.participants.forEach((participant: { userId: string; share: number }) => {
          const userId = participant.userId;
          if (!balances[userId]) {
            balances[userId] = 0;
          }
          balances[userId] += participant.share;
        });
      });
      
      // 4. Zapisz obliczone balance w stanie
      set({ balances });
      
      return balances;
    } catch (error) {
      console.error("Error calculating balances:", error);
      return {};
    }
  }
}));