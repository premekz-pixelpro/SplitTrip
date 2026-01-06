import { useEventStore, useAuthStore } from '@/store';

export const Header = ({ onAddEvent }: { onAddEvent: () => void }) => {
  const currentEvent = useEventStore((state) => state.currentEvent);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="app-header">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="event-name">{currentEvent?.title}</span>

          <button onClick={onAddEvent} className="px-3 py-1 bg-blue-500 text-white rounded">
            +
          </button>
          <button onClick={() => logout()} className="px-3 py-1 bg-red-500 text-white rounded">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
