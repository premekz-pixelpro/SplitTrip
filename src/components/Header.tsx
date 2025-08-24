import { useEventStore } from '@/store';
import { EventSelector } from '@/components';

export const Header = () => {
  const currentEvent = useEventStore((state) => state.currentEvent);

  return (
    <header className="app-header">
      <div className="flex justify-between items-center">
        {currentEvent ? (
          <div className="current-event-info">
            <span className="event-name">{currentEvent.title}</span>
          </div>
        ) : (
          <EventSelector />
        )}
      </div>
    </header>
  );
};
