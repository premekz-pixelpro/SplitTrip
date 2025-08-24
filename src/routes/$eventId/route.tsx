import { createFileRoute, Outlet, useNavigate, useParams } from '@tanstack/react-router';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import firebase from 'firebase/compat/app';

export const Route = createFileRoute('/$eventId')({
  component: EventLayout,
});

function EventLayout() {
  const { eventId } = useParams({ from: '/$eventId' });
  const navigate = useNavigate();
  const { setCurrentEvent } = useEventStore();
  const currentUser = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkEventAccess = async () => {
      console.log('currentUser:', currentUser);
      setLoading(true);
      setError(null);

      if (!currentUser) {
        console.log('No current user, redirecting to home');
        navigate({ to: '/' });
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

        const eventData = { id: eventSnap.id, ...eventSnap.data() };
        // console.log('EventData:', eventData);

        // Sprawdź czy użytkownik jest uczestnikiem
        const isParticipant = eventData.participants?.some(
          (p: firebase.firestore.DocumentData) => p.userId === currentUser.uid
        );

        if (!isParticipant) {
          console.log('Użytkownik nie jest uczestnikiem tego eventu');
          setError('Nie masz dostępu do tego eventu');
          navigate({ to: '/' });
          return;
        }

        // Jeśli wszystko OK, ustaw event i zapisz do localStorage
        setCurrentEvent(eventData);
        localStorage.setItem('lastEventId', eventData.id);
        setLoading(false);
      } catch (err) {
        console.error('Error checking event access:', err);
        setError('Błąd podczas sprawdzania dostępu');
        navigate({ to: '/' });
      }
    };

    checkEventAccess();
  }, [eventId, currentUser, navigate, setCurrentEvent]);

  if (loading) {
    return <div>Sprawdzanie dostępu do eventu...</div>;
  }

  if (error) {
    return <div>Błąd: {error}</div>;
  }

  return <Outlet />;
}
