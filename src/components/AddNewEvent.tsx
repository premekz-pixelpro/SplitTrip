import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserProfileStore } from '@/store/useUserProfileStore';

export const AddNewEvent = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Pobierz potrzebne funkcje ze store'ów
  const createEvent = useEventStore((state) => state.createEvent);
  const setCurrentEvent = useEventStore((state) => state.setCurrentEvent);
  const fetchEventsByIds = useEventStore((state) => state.fetchEventsByIds);

  const currentUser = useAuthStore((state) => state.user);
  const userProfile = useUserProfileStore((state) => state.userProfile);
  const fetchUserProfile = useUserProfileStore((state) => state.fetchUserProfile);

  const handleAddEvent = async () => {
    if (!title || !currentUser) return;

    setLoading(true);
    try {
      // Utwórz event i pobierz wynik (upewnij się, że createEvent zwraca utworzony event)
      const newEvent = await createEvent(title, description, {
        uid: currentUser.uid,
        displayName: currentUser.displayName ?? '',
      });
      await fetchUserProfile(currentUser.uid); //odswierz profil użytkownika z nową listą eventów

      // Reset formularza
      setTitle('');
      setDescription('');

      // Odśwież profil użytkownika, aby pobrać zaktualizowaną listę eventów
      if (currentUser.uid) {
        await fetchUserProfile(currentUser.uid);
      }

      // Jeśli mamy już zaktualizowany userProfile z nowym eventem
      if (userProfile?.events) {
        // Odśwież listę eventów
        await fetchUserProfile(currentUser.uid);
      }

      // Ustaw nowy event jako aktywny
      setCurrentEvent(newEvent);

      // Zapisz ID eventu w localStorage
      localStorage.setItem('lastEventId', newEvent.id);

      // Przekieruj do nowego eventu
      navigate({ to: `/${newEvent.id}/newBill` });
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-new-event">
      <h3>Dodaj nowy event</h3>
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nazwa eventu"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 border rounded"
        />
        <textarea
          placeholder="Opis eventu"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-2 border rounded"
        />
        <button
          onClick={handleAddEvent}
          disabled={loading || !title}
          className="p-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Dodawanie...' : 'Dodaj Event'}
        </button>
      </div>
    </div>
  );
};
