import { create } from 'zustand';
import { Bill, Event, EventParticipant, FirebaseUser } from '@/types/types';
import {
  collection,
  documentId,
  getDocs,
  updateDoc,
  addDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDoc,
  writeBatch,
  arrayUnion,
  DocumentData,
  QuerySnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { snapshot } from 'node:test';
import { join } from 'path';
import { time } from 'console';

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
  lastBalanceCalculation: Record<string, number>; // Dodaj cache timestamp

  // Event actions

  fetchEvents: () => Promise<void>;
  fetchEventsByIds: (eventIds: string[]) => Promise<Event[]>;
  fetchBills: (eventId: string) => Promise<void>;
  setCurrentEvent: (event: Event | null) => void;
  createEvent: (
    title: string,
    description: string,
    currentUser: { uid: string; displayName: string }
  ) => Promise<Event>;
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
  addParticipantToEvent: (newParticipant: FirebaseUser) => Promise<FirebaseUser>;
  addBill: (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>; // Dodano typ dla billData
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
  lastBalanceCalculation: {},

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

  fetchEventsByIds: async (userEventIds: string[]) => {
    if (!userEventIds.length) {
      set({ events: [], loading: false, error: null }); // Zresetuj stan dla pustej tablicy
      return [];
    }

    set({ loading: true, error: null });

    const CHUNK_SIZE = 10; // Maksymalna liczba elementów dla zapytania 'in' w Firestore
    const eventsRef = collection(db, 'events');
    const allEventsData: Event[] = [];
    const queryPromises: Promise<QuerySnapshot<DocumentData>>[] = []; // Tablica na wszystkie Promise'y z zapytań

    // Dziel tablicę userEventIds na chunki po 10
    for (let i = 0; i < userEventIds.length; i += CHUNK_SIZE) {
      const chunk = userEventIds.slice(i, i + CHUNK_SIZE);
      // Stwórz zapytanie dla każdego chunka
      const q = query(eventsRef, where(documentId(), 'in', chunk));
      // Dodaj Promise z wykonaniem zapytania do tablicy
      queryPromises.push(getDocs(q));
    }
    //Przechodzi petla do q zapisuje obiekt zapytania a queryPromises.push wpycha obiekt powstaly z getDocs(q) ktory jest Promisem bo getDocs zwraca Promise do tablicy, przy nastepnej iteracji tworzy nowy obiekt i wpycha do tablicy jako kolejny i tak do spelnienia warunku for

    // query tworze obiekt zapytania na referencji eventsRef czyli kolekcji 'events' filtruje przy pomocy where podajac za pomoca funkcji documentId() tylko id i przy pomocy operatora in zawierajace id z userEventIds, tworze zmienna querySnapShot do ktorej pobieram dokument q, w zmiennej eventsData z querySnapshot tworzy tablice i mapujac po niej sprawdza jesli dokument nie istnieje to daje null jesli tak tworzy obiekt z id i danymi na koncu filtruje wyrzucajac nulle i rzutuje na Event[]

    try {
      const querySnapshots = await Promise.all(queryPromises);
      querySnapshots.forEach((snapshot: QuerySnapshot<DocumentData>) => {
        snapshot.docs.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
          if (docSnap.exists()) {
            allEventsData.push({ id: docSnap.id, ...docSnap.data() } as Event);
          }
        });
      });

      set({ events: allEventsData, loading: false });
      return allEventsData;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error fetching events',
        loading: false,
      });
      return [];
    }
  },

  setCurrentEvent: (event: Event | null) => {
    set({ currentEvent: event });
  },

  createEvent: async (title, description, currentUser) => {
    set({ loading: true, error: null });

    try {
      const participant: EventParticipant = {
        userId: currentUser.uid,
        displayName: currentUser.displayName || 'Unknown',
        joinedAt: null,
        balance: 0,
      };
      const eventData = {
        title,
        description,
        creatorId: currentUser.uid,
        participants: [participant],
        participantJoinedAt: { [currentUser.uid]: serverTimestamp() },
        balances: { [currentUser.uid]: 0 },
        totalExpenses: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      //  - zapisz do Firestore
      const batch = writeBatch(db); // atomowy zapis prostszy od transaction

      const eventRef = doc(collection(db, 'events'));
      batch.set(eventRef, eventData);

      const userRef = doc(db, 'users', currentUser.uid);
      batch.update(userRef, { events: arrayUnion(eventRef.id) });

      await batch.commit(); // odśwież listę eventów w stanie

      // console.log('Event created with ID:', eventRef.id);
      // console.log('currentUser:', currentUser);

      // Utwórz pełny obiekt eventu z ID
      const newEvent: Event = {
        id: eventRef.id,
        ...eventData,
        createdAt: eventData.createdAt as Event['createdAt'],
        updatedAt: eventData.updatedAt as Event['updatedAt'],
        participantJoinedAt: { [currentUser.uid]: Timestamp.now() },
        eventBills: [],
      };

      // // Dodaj do lokalnego stanu
      set((state) => ({
        events: [...state.events, newEvent],
        loading: false,
      }));

      return newEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      set({
        error: err instanceof Error ? err.message : 'Error creating event',
        loading: false,
      });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  fetchBills: async (eventId: string) => {
    set({ loading: true, error: null });
    try {
      const billsRef = collection(db, 'bills');
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
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          participants: Array.isArray(data.participants) ? data.participants : [],
        };
      });

      const totalSum =
        Math.round(billsData.reduce((sum, bill) => sum + (bill.value || 0), 0) * 100) / 100;

      set((state) => ({
        eventBills: billsData,
        currentEvent: state.currentEvent
          ? { ...state.currentEvent, totalExpenses: totalSum }
          : state.currentEvent,
        loading: false,
      }));
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
        joinedAt: null, // do skasowania jak sprawdze czy bledow nie sieje
        balance: 0,
      };

      await updateDoc(eventRef, {
        participants: [...(get().currentEvent?.participants || []), newParticipant],
        [`participantJoinedAt.${user.uid}`]: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
    if (currentEvent.participants.length === 0) return;

    set({ loading: true });
    try {
      const participantIds = currentEvent.participants?.map((p) => p.userId);
      console.log('Participant IDs:', participantIds);

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', 'in', participantIds));
      const querySnapshot = await getDocs(q);

      const usersData = querySnapshot.docs.map((doc) => {
        const userData = doc.data();
        const participantData = currentEvent.participants?.find((p) => p.userId === doc.id);

        return {
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          image: userData.image,
          balance: participantData?.balance || 0,
          events: userData.events || [],
          currency: userData.currency || 'PLN',
          language: userData.language || 'pl',
        };
      });

      set({ participants: usersData, loading: false });
    } catch {
      set({ error: 'Error fetching participants', loading: false });
    }
  },

  calculateBalances: async (eventId: string) => {
    console.log('🔵 START calculateBalances for event:', eventId);

    if (!eventId) {
      console.error('❌ Cannot calculate balances without eventId');
      return {};
    }

    const now = Date.now();
    const lastCalc = get().lastBalanceCalculation[eventId] || 0;
    if (now - lastCalc < 5000) {
      console.log('⏭️ Skipping balance calculation - too soon');
      return get().balances;
    }

    let calculatedBalances: Record<string, number> = {};

    try {
      // 1. Pobierz rachunki
      const billsQuery = query(collection(db, 'bills'), where('eventId', '==', eventId));
      const billsSnapshot = await getDocs(billsQuery);
      const bills = billsSnapshot.docs.map((doc) => doc.data() as Bill);
      console.log('📋 Fetched bills:', bills.length);
      console.table(
        bills.map((b) => ({
          title: b.title,
          value: b.value,
          participants: b.participants?.length,
        }))
      );

      // 2. Pobierz uczestników
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) {
        throw new Error('Event document not found');
      }
      const eventData = eventSnap.data() as Event;
      const participantIds = (eventData.participants || []).map((p) => p.userId);
      console.log('👥 Participants:', participantIds);

      // 3. Inicjalizuj balanse
      calculatedBalances = participantIds.reduce((acc, userId) => {
        acc[userId] = 0;
        return acc;
      }, {});
      console.log('💰 Initial balances:', calculatedBalances);

      // 4. Przelicz dla każdego rachunku
      bills.forEach((bill, index) => {
        console.log(`\n📝 Processing bill ${index + 1}: "${bill.title}" (${bill.value})`);

        if (bill.participants && Array.isArray(bill.participants)) {
          const paidAmount = bill.participants.reduce((sum, p) => {
            return sum + (p.hasPaid && !p.creator ? p.share || 0 : 0);
          }, 0);
          console.log('  💵 Total paid by others:', paidAmount);

          bill.participants.forEach((participant) => {
            const userId = participant.userId;
            const before = calculatedBalances[userId];

            if (Object.prototype.hasOwnProperty.call(calculatedBalances, userId)) {
              if (participant.creator) {
                const change = Number((bill.value - participant.share - paidAmount).toFixed(1));
                calculatedBalances[userId] += change;
                console.log(
                  `  👤 ${userId} (creator): ${before} → ${calculatedBalances[userId]} (${change > 0 ? '+' : ''}${change})`
                );
              } else {
                if (!participant.hasPaid) {
                  const change = Number(participant.share.toFixed(1));
                  calculatedBalances[userId] += change;
                  console.log(
                    `  👤 ${userId} (owes): ${before} → ${calculatedBalances[userId]} (+${change})`
                  );
                } else {
                  console.log(`  👤 ${userId} (paid): no change`);
                }
              }
            }
          });
        }
      });

      console.log('\n✅ FINAL BALANCES:', calculatedBalances);

      // Zaokrąglij końcowe wartości do 2 miejsc po przecinku
      Object.keys(calculatedBalances).forEach((key) => {
        calculatedBalances[key] = Math.round(calculatedBalances[key] * 100) / 100;
      });

      console.log('✅ ROUNDED BALANCES:', calculatedBalances);

      // 5. Sprawdź czy się zmieniły
      const currentBalances = eventData.balances || {};
      const hasChanged = Object.keys(calculatedBalances).some(
        (key) => calculatedBalances[key] !== currentBalances[key]
      );

      console.log('🔄 Has changed:', hasChanged);
      console.log('   Old:', currentBalances);
      console.log('   New:', calculatedBalances);

      if (hasChanged) {
        await updateDoc(eventRef, {
          balances: calculatedBalances,
          updatedAt: serverTimestamp(),
        });
        console.log('💾 Saved to Firestore');
      }

      set({
        balances: calculatedBalances,
        lastBalanceCalculation: {
          ...get().lastBalanceCalculation,
          [eventId]: now,
        },
      });

      return calculatedBalances;
    } catch (error) {
      console.error('❌ Error calculating balances:', error);
      set({ error: error instanceof Error ? error.message : 'Error calculating balances' });
      return calculatedBalances;
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
  addParticipantToEvent: async (newParticipant) => {
    try {
      const eventId = get().currentEvent?.id;
      if (!eventId) throw new Error('Brak aktywnego wydarzenia');

      // Dodaj do Firebase
      const participantRef = doc(db, 'events', eventId, 'participants', newParticipant.uid);
      await doc(participantRef, {
        ...newParticipant,
        joinedAt: new Date(),
        status: 'active',
        inviteStatus: newParticipant.phone ? 'invited' : 'added_manually',
      });

      // Dodaj do lokalnego state
      set((state) => ({
        participants: [...state.participants, newParticipant],
      }));

      return newParticipant;
    } catch (error) {
      console.error('Error adding participant to event:', error);
      throw error;
    }
  },
  addBill: async (billData) => {
    try {
      // 1. Dodaj rachunek
      await addDoc(collection(db, 'bills'), {
        ...billData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Pobierz wszystkie rachunki
      await get().fetchBills(billData.eventId);

      // 3. Oblicz i zaokrąglij totalExpenses
      const totalSum =
        Math.round(get().eventBills.reduce((sum, bill) => sum + (bill.value || 0), 0) * 100) / 100;

      // 4. Zapisz do Firestore
      const eventRef = doc(db, 'events', billData.eventId);
      await updateDoc(eventRef, {
        totalExpenses: totalSum,
        updatedAt: serverTimestamp(),
      });

      // 5. Przelicz balances
      await get().calculateBalances(billData.eventId);
    } catch (err) {
      console.error('Error adding bill:', err);
      throw err;
    }
  },
}));
