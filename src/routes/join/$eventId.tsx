import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { arrayUnion, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import type { Event, EventParticipant } from '@/types/types';
import '@/styles/components/LoginForm.css';

export const Route = createFileRoute('/join/$eventId')({
  component: JoinEvent,
});

function JoinEvent() {
  const { eventId } = Route.useParams();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [eventTitle, setEventTitle] = useState<string>('');
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventExists, setEventExists] = useState<boolean | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      setLoadingEvent(true);
      setEventExists(null);
      setError(null);

      try {
        const eventRef = doc(db, 'events', eventId);
        const snap = await getDoc(eventRef);
        if (!snap.exists()) {
          setEventExists(false);
          return;
        }

        const event = snap.data() as Partial<Event>;
        setEventTitle(typeof event.title === 'string' ? event.title : '');
        setEventExists(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Błąd podczas pobierania eventu');
      } finally {
        setLoadingEvent(false);
      }
    };

    void loadEvent();
  }, [eventId]);

  useEffect(() => {
    const join = async () => {
      if (!user) return;
      if (eventExists !== true) return;

      setJoining(true);
      setError(null);

      try {
        const eventRef = doc(db, 'events', eventId);
        const snap = await getDoc(eventRef);

        if (!snap.exists()) {
          setEventExists(false);
          return;
        }

        const data = snap.data() as { participants?: EventParticipant[] };
        const participants = data.participants ?? [];
        const alreadyParticipant = participants.some((p) => p.userId === user.uid);
        console.log('user', alreadyParticipant);
        if (!alreadyParticipant) {
          const batch = writeBatch(db);

          const participant: EventParticipant = {
            userId: user.uid,
            displayName: user.displayName || user.email || 'Unknown',
            joinedAt: null,
            balance: 0,
          };

          batch.update(eventRef, {
            participants: arrayUnion(participant),
            [`participantJoinedAt.${user.uid}`]: serverTimestamp(),
            [`balances.${user.uid}`]: 0,
            updatedAt: serverTimestamp(),
          });

          const userRef = doc(db, 'users', user.uid);
          batch.set(userRef, { events: arrayUnion(eventId) }, { merge: true });

          await batch.commit();
        }

        localStorage.setItem('lastEventId', eventId);
        navigate({ to: `/${eventId}/newBill` });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Błąd podczas dołączania do eventu');
      } finally {
        setJoining(false);
      }
    };

    void join();
  }, [eventExists, eventId, navigate, user]);

  if (loadingEvent) {
    return <div className="loading">Ładowanie zaproszenia...</div>;
  }

  // Jeśli event z linku nie istnieje, przejdź do /login
  if (eventExists === false) {
    return <Navigate to="/login" />;
  }

  if (error) {
    return <div>Błąd: {error}</div>;
  }

  // Event istnieje i użytkownik nie jest zalogowany: pokaż ekran zaproszenia
  if (!user) {
    const redirect = `/join/${eventId}`;
    return (
      <div className="login-form">
        <h2>Zaproszenie do wydarzenia</h2>
        <p>
          Dołącz do wydarzenia: <strong>{eventTitle || 'Wydarzenie'}</strong>
        </p>
        <p>
          Jeśli masz już konto w SplitTrip, zaloguj się. Jeśli nie, załóż konto – po wszystkim
          wrócisz tutaj i dołączysz do wydarzenia.
        </p>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate({ to: '/login', search: { redirect } })}
            disabled={joining}
          >
            Zaloguj się
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/signup', search: { redirect } })}
            disabled={joining}
          >
            Załóż konto
          </button>
        </div>
      </div>
    );
  }

  // Użytkownik zalogowany: dołączanie i przekierowanie
  return <div>{joining ? 'Dołączanie do wydarzenia...' : 'Przekierowanie...'}</div>;
}
