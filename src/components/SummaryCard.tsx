import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserProfileStore } from '@/store';
import classNames from 'classnames';
import { useEffect } from 'react';

export const SummaryCard = () => {
  const { currentEvent } = useEventStore();
  const { user } = useAuthStore();
  const { userProfile, fetchUserProfile } = useUserProfileStore();

  useEffect(() => {
    if (user?.uid) {
      fetchUserProfile(user.uid);
    }
  }, [user, fetchUserProfile]);

  const currentUserId = userProfile?.uid;
  const participants = currentEvent?.participants || [];
  const balances = currentEvent?.balances || {};

  return (
    <div className={classNames('summary-card flex justify-between')}>
      <div className="">
        <h2 className="pb-4 text-red-300">Podsumowanie</h2>
        <h3 className="text-2xl font-bold">{userProfile?.displayName}</h3>
        <p className="">Łączna kwota: {currentEvent?.totalExpenses} zł</p>
        <p>Uczestnicy: {participants.length}</p>
        {userProfile?.uid && (
          <p className="balance-info">
            {`Twoje saldo: `}
            <span
              className={
                currentUserId && Math.round(balances[currentUserId] * 10) / 10 > 0
                  ? 'positive'
                  : 'negative'
              }
            >
              {currentUserId && Math.round(balances[currentUserId] * 10) / 10
                ? Math.round(balances[currentUserId] * 10) / 10 + ' zł'
                : 'Wybierz Event'}{' '}
            </span>
          </p>
        )}
      </div>
      <img
        src={userProfile?.image || 'https://i.pravatar.cc/300'}
        alt="user avatar"
        className="user-avatar"
      />
    </div>
  );
};
