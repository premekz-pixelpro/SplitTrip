import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEventStore } from '@/store/useEventStore';
import { EventSelector } from '@/components/EventSelector';
import { useEffect } from 'react';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { currentEvent, events, setCurrentEvent } = useEventStore();

  useEffect(() => {
    // Sprawdź localStorage przy starcie
    const lastEventId = localStorage.getItem('lastEventId');

    if (lastEventId && events.length > 0) {
      const savedEvent = events.find((e) => e.id === lastEventId);
      if (savedEvent) {
        setCurrentEvent(savedEvent);
        navigate({ to: `/${savedEvent.id}/newBill` });
        return;
      }
    }

    // Jeśli jest jakiś wybrany event, przekieruj
    if (currentEvent?.id) {
      navigate({ to: `/${currentEvent.id}/newBill` });
    }
  }, [currentEvent, events, navigate, setCurrentEvent]);

  // Pokaż selektor tylko jeśli nie ma wybranego eventu lub użytkownik wrócił na główną
  return (
    <div className="home-page">
      <h2>Wybierz event</h2>
      <EventSelector />
      {/* Opcjonalnie: lista ostatnich eventów */}
    </div>
  );
}
