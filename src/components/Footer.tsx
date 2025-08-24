import { Link } from '@tanstack/react-router';
import { useEventStore } from '@/store';

export const Footer = () => {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const eventId = currentEvent?.id;

  return (
    <div className="bottom-nav-bar">
      <div className="p-2 flex gap-2">
        {eventId ? (
          <>
            <Link to={`/${eventId}/newBill`} className="[&.active]:font-bold">
              NewBill
            </Link>
            <Link to={`/${eventId}/billhistory`} className="[&.active]:font-bold">
              BillHistory
            </Link>
          </>
        ) : (
          <span className="text-gray-400">Wybierz event aby zobaczyć opcje</span>
        )}
        <Link to="/user" className="[&.active]:font-bold">
          User
        </Link>
      </div>
    </div>
  );
};
