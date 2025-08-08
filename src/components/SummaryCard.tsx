import { useEffect } from 'react';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import classNames from 'classnames';

export const SummaryCard = () => {
  const { currentEvent, participants, fetchParticipants, getCurrentUserDetails } = useEventStore();
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (currentEvent) {
      fetchParticipants();
    }
  }, [currentEvent]);

  const currentUserDetails = currentUser ? getCurrentUserDetails(currentUser.uid) : null;
  const currentUserId = currentUser ? currentUser.uid : '';
  // console.log("currentUserDetails", currentEvent?.balances[currentUserId]);

  if (!currentEvent) return null;

  return (
    <div className={classNames('summary-card flex justify-between')}>
      <div className="">
        <h2 className="pb-4 text-red-300">Podsumowanie</h2>
        <h3 className="text-2xl font-bold">{currentUserDetails?.displayName}</h3>
        <p className="">Łączna kwota: {currentEvent.totalExpenses} zł</p>
        <p>Uczestnicy: {participants.length}</p>
        {currentUserDetails && (
          <p className="balance-info">
            {`Twoje saldo: `}
            <span
              className={
                Math.round(currentEvent?.balances[currentUserId] * 10) / 10 > 0
                  ? 'positive'
                  : 'negative'
              }
            >
              {Math.round(currentEvent?.balances[currentUserId] * 10) / 10} zł
            </span>
          </p>
        )}
      </div>
      <img src={currentUserDetails?.image} alt="user avatar" className="user-avatar" />
    </div>
  );
};
