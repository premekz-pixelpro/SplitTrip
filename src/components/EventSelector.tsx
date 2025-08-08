import { useEffect } from "react";
import { useEventStore } from '@/store';

export const EventSelector = () => {
  const { events, currentEvent, loading, error, fetchEvents, setCurrentEvent, calculateBalances } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, []);
  
  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!events.length) return <div>No events found</div>;

  return (
    <div className="event-selector">
      <h3>Select Event</h3>
      <select 
        value={currentEvent?.id || ''} 
        onChange={(e) => {
          const selected = events.find(event => event.id === e.target.value);
          setCurrentEvent(selected || null);
          // console.log('Selected event:', selected?.id);
          calculateBalances(selected?.id || ''); 

        }}
      >
        <option value="">Choose an event</option>
        {events.map(event => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>
    </div>
  );
};