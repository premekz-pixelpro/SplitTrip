import { EventSelector } from '@/components/EventSelector';
import { AddNewEvent } from './AddNewEvent';

export const Header = () => {
  return (
    <header className="app-header">
      {/* <EventSelector /> */}
      <AddNewEvent />
    </header>
  );
};
