import { useState } from 'react';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';

export const AddNewEvent = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Pobierz funkcję createEvent ze store'a
  const createEvent = useEventStore((state) => state.createEvent);

  // Pobierz aktualnego użytkownika
  const currentUser = useAuthStore((state) => state.user);

  const handleAddEvent = async () => {
    if (!title || !currentUser) return;

    setLoading(true);
    try {
      await createEvent(title, description, currentUser.uid);
      // Reset formularza po dodaniu
      setTitle('');
      setDescription('');
      // Opcjonalnie: zamknij modal lub przekieruj
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
