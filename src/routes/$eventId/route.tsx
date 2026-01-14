import { useEffect, useState } from 'react';
import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useAuthStore, useEventStore } from '@/store/';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Event, EventParticipant } from '@/types/types';
// import firebase from 'firebase/compat/app';

export const Route = createFileRoute('/$eventId')({
  component: EventLayout,
});

function EventLayout() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const { setCurrentEvent } = useEventStore();
  const currentUser = useAuthStore((state) => state.user);
  const [, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkEventAccess = async () => {
      // console.log('currentUser:', currentUser);
      setLoading(true);
      setError(null);

      if (!currentUser) {
        console.log('No current user, waiting for auth guard redirect');
        setLoading(false);
        return;
      }

      try {
        // Sprawdź bezpośrednio w Firestore czy event o tym ID istnieje
        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (!eventSnap.exists()) {
          console.log('Event nie istnieje');
          setError('Event nie istnieje');
          // navigate({ to: '/dupa' });
          return;
        }

        const eventData = {
          id: eventSnap.id,
          ...(eventSnap.data() as { participants?: EventParticipant[] }),
        };
        // console.log('EventData:', eventData);

        // Sprawdź czy użytkownik jest uczestnikiem
        const isParticipant = eventData.participants?.some(
          (p) => p.userId === (currentUser.uid as EventParticipant['userId'])
        );

        if (!isParticipant) {
          console.log('Użytkownik nie jest uczestnikiem tego eventu');
          setError('Nie masz dostępu do tego eventu');
          // navigate({ to: '/' });
          return;
        }

        // Jeśli wszystko OK, ustaw event i zapisz do localStorage
        setCurrentEvent(eventData as Event);
        localStorage.setItem('lastEventId', eventData.id);
        setLoading(false);
      } catch (err) {
        console.error('Error checking event access:', err);
        setError('Błąd podczas sprawdzania dostępu');
        // navigate({ to: '/' });
      }
    };

    checkEventAccess();
  }, [eventId, currentUser, navigate, setCurrentEvent]);

  // if (loading) {
  //   return <div>Sprawdzanie dostępu do eventu...</div>;
  // }

  if (error) {
    return <div>Błąd: {error}</div>;
  }

  return <Outlet />;
}
