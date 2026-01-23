import { useEventStore, useAuthStore } from '@/store/';
import { BillItem } from '@/components/BillItem';
import { useEffect, useState } from 'react';
import { billService } from '@/services/databaseService';

export const BillsList = () => {
  const [sortBy, setSortBy] = useState<string>('dateNewest');
  const { eventBills, fetchBills, loading } = useEventStore();
  const currentEvent = useEventStore((state) => state.currentEvent);
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser ? currentUser.uid : '';

  console.log('BillsList - loading:', loading);
  console.log('BillsList - eventBills:', eventBills);
  console.log('BillsList - currentEvent:', currentEvent);

  // console.log('curentUserId', currentUserId);

  const sortedBills = [...eventBills].sort((a, b) => {
    switch (sortBy) {
      case 'dateNewest':
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      case 'dateOldest':
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.seconds - b.createdAt.seconds;
      case 'value':
        return b.value - a.value;
      // case 'creator':
      //   return [...eventBills].filter((bill) => bill.creatorId === currentUserId).length - 0;
      default:
        return 0;
    }
  });

  useEffect(() => {
    if (currentEvent) fetchBills(currentEvent.id);
    console.log('Fetching bills for event:', currentEvent?.id);
  }, [currentEvent?.id, fetchBills]);

  return (
    <div className="expenses-list">
      {loading ? (
        <div>Loading bills...</div>
      ) : eventBills.length === 0 ? (
        <div>No bills available</div>
      ) : (
        <>
          <h2 className="pb-4 text-red-300">Lista rachunków</h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as string)}
            className="p-2 rounded border"
          >
            <option value="dateNewest">Najnowsze</option>
            <option value="dateOldest">Najstarsze</option>
            <option value="value">Wartość</option>
          </select>
          <ul className="bills-list">
            {sortedBills.map((bill) => (
              <BillItem key={bill.id} bill={bill} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
