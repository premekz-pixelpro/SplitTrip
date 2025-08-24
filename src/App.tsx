import { useEffect, useState } from 'react';
import { Event } from './types/types';
import { db } from '@/config/firebase';
import { Unsubscribe, doc, onSnapshot } from 'firebase/firestore';
import { LoginForm } from '@/components/LoginForm';
import { useAuthStore } from '@/store/useAuthStore';
import { useEventStore } from '@/store/useEventStore';
import { EventSelector } from '@/components';
import { SummaryCard, FriendsList, NewBill, BillsList, Modal, Button } from '@/components';
import '@/styles/App.css';

export const App = () => {
  const currentEventId = useEventStore((state) => state.currentEvent?.id);
  // Pobierz potrzebne akcje
  const handleSnapshotUpdate = useEventStore((state) => state.handleSnapshotUpdate);
  const handleSnapshotError = useEventStore((state) => state.handleSnapshotError);
  const handleSnapshotNotFound = useEventStore((state) => state.handleSnapshotNotFound);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // console.log(isModalOpen);
    let unsubscribe: Unsubscribe | null = null;

    if (currentEventId) {
      const eventRef = doc(db, 'events', currentEventId);
      unsubscribe = onSnapshot(
        eventRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const updatedEventData = { id: docSnap.id, ...docSnap.data() } as Event;
            handleSnapshotUpdate(updatedEventData);
          } else {
            handleSnapshotNotFound();
          }
        },
        (error) => {
          handleSnapshotError(error.message);
        }
      );
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentEventId, handleSnapshotUpdate, handleSnapshotError, handleSnapshotNotFound]);

  const user = useAuthStore((state) => state.user);
  const currentEvent = useEventStore((state) => state.currentEvent);

  if (!user) {
    return <LoginForm />;
  }
  // console.log("currentEventId", user);

  if (!currentEvent) {
    return (
      <>
        <EventSelector />
      </>
    );
  }

  return (
    <div className="app">
      <div className="content-area">
        {/* <SummaryCard /> */}
        <BillsList />
        <Button className="new-bill-button" onClick={() => setIsModalOpen(true)}>
          +
        </Button>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <NewBill />
        </Modal>
      </div>
    </div>
  );
};
