import { useEffect } from 'react';
import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import classNames from 'classnames';

export const SummaryCard = () => {
  const { currentEvent } = useEventStore();
  const currentUser = useAuthStore((state) => state.userData);

  // useEffect(() => {
  //   if (currentEvent) {
  //     fetchParticipants();
  //   }
  // }, [currentEvent]);

  //getCurrentUserDetails niepotrzebne do przebudowy i wywalenia
  // console.log('currentEvent', currentEvent?.participants);

  const currentUserId = currentUser ? currentUser.uid : '';
  const participants = currentEvent?.participants || [];

  // const currentUserDetails = currentUser ? getCurrentUserDetails(currentUser.uid) : null;
  // console.log('currentUserDetails', currentUser);
  // console.log('getCurrent', currentUserDetails);

  // if (!currentEvent) return null;

  return (
    <div className={classNames('summary-card flex justify-between')}>
      <div className="">
        <h2 className="pb-4 text-red-300">Podsumowanie</h2>
        <h3 className="text-2xl font-bold">{currentUser?.displayName}</h3>
        <p className="">Łączna kwota: {currentEvent?.totalExpenses} zł</p>
        <p>Uczestnicy: {participants.length}</p>
        {currentUser && (
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
      <img src={currentUser?.image} alt="user avatar" className="user-avatar" />
    </div>
  );
};
