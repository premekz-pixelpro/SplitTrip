import { LoginForm } from '@/components/LoginForm';
import { useAuthStore } from '@/store/useAuthStore';
import { useEventStore } from '@/store/useEventStore';
import { EventSelector } from '@/components/EventSelector';
import { FriendsList, NewBill, BillsList } from '@/components';

export const App = () => {
  const user = useAuthStore(state => state.user);
  const currentEvent = useEventStore(state => state.currentEvent);
  
  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="app">
      <EventSelector />
      {currentEvent ? (
        <>
        <FriendsList />       
        <NewBill />
        <BillsList />
        </>
        ) : (
        <>
        <p>Please select an event to continue</p>
        <div>Welcome, {user.email}!</div>
        </>
        )
      }
        <div className="footer">
          <p>Hello {user.displayName}</p>
        </div>
    </div>
  );
};

