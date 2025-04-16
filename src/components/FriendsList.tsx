import { useState, useEffect } from 'react';
import { FriendItem } from '@/components/FriendItem';
import { useAuthStore } from '@/store/useAuthStore';
import { useEventStore } from '@/store/useEventStore';
import { FirebaseUser } from '@/types/types';

export const FriendsList = () => {
  const currentUser = useAuthStore(state => state.user);
  const currentEvent = useEventStore(state => state.currentEvent);
  const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null);
  const { participants, loading, balances, calculateBalances, fetchParticipants } = useEventStore();

  useEffect(() => {
    if (currentEvent) {
      fetchParticipants();
      calculateBalances(currentEvent.id).then(balances => {
        console.log('Balances:', balances);
      });
    }
  }, [currentEvent]);

  if (loading) return <div>Loading participants...</div>;
  if (!currentUser) return <div>Please log in to see participants</div>;
  if (!currentEvent) return <div>No event selected</div>;
  if (participants.length === 0) return <div>No participants in this event</div>;

  const otherParticipants = participants.filter(user => user.uid !== currentUser.uid);
  
  if (otherParticipants.length === 0) return <div>No other participants in this event</div>;

  return (
    <ul className="friends-list">
      {otherParticipants.map(user => (
        <FriendItem
          key={user.uid}
          balance={parseFloat(Number(balances[user.uid]).toFixed(2)) ?? 0}
          user={user}
          isSelected={selectedUser?.uid === user.uid}
          onSelect={setSelectedUser}
        />
      ))}
    </ul>
  );
};