import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useEventStore } from '@/store';

export const EventSelector = () => {
  const { events, currentEvent, loading, error, fetchEvents, setCurrentEvent, calculateBalances } =
    useEventStore();
  // const currentUser = useAuthStore((state) => state.user);
  // const currentUserId = currentUser ? currentUser.uid : '';
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!events.length) return <div>No events found</div>;

  // const userEvents = events.filter((event) => event.participants.includes(currentUserId));
  // console.log('events', currentEvent?.participants);

  return (
    <div className="event-selector">
      <select
        value={currentEvent?.id || ''}
        onChange={(e) => {
          const selected = events.find((event) => event.id === e.target.value);
          setCurrentEvent(selected || null);
          // console.log('Selected event:', selected?.id);
          calculateBalances(selected?.id || '');
          if (selected?.id) {
            localStorage.setItem('lastEventId', selected.id);
            navigate({ to: `/${selected.id}/newBill` });
          } else {
            localStorage.removeItem('lastEventId');
          }
        }}
      >
        <option value="">Choose an event</option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>
    </div>
  );
};
