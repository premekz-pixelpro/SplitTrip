import { useEventStore } from '@/store/useEventStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserProfileStore } from '@/store';
import classNames from 'classnames';
import { useEffect, useMemo } from 'react';

export const SummaryCard = () => {
  const { currentEvent, eventBills, fetchBills, loading } = useEventStore();
  const { user } = useAuthStore();
  const { userProfile, fetchUserProfile } = useUserProfileStore();

  useEffect(() => {
    if (user?.uid) {
      fetchUserProfile(user.uid);
    }
    if (currentEvent) fetchBills(currentEvent.id);
    // dodac do fetchBills calculateBalances ??
  }, [user, fetchUserProfile, currentEvent, fetchBills]);

  const currentUserId = userProfile?.uid;

  const userTotalPaid = useMemo(() => {
    if (!currentUserId) return 0;
    return eventBills.reduce((sum, bill) => {
      const billValue = bill.value || 0;
      const paidByOthers =
        bill.participants?.reduce((s, p) => s + (p.hasPaid && !p.creator ? p.share || 0 : 0), 0) ||
        0;
      const p = bill.participants?.find((x) => x.userId === currentUserId);
      if (!p) return sum;

      if (p.creator) {
        // faktycznie zapłacone przez płacącego
        return sum + Math.max(0, billValue - paidByOthers);
      } else if (p.hasPaid) {
        // uczestnik płaci swój udział, jeśli hasPaid
        return sum + (p.share || 0);
      }
      return sum;
    }, 0);
  }, [eventBills, currentUserId]);

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
          <>
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
            <p className="total-user-pay">
              {'Wydałeś: '}
              <span>
                {currentUserId && currentEvent
                  ? Math.round(userTotalPaid * 100) / 100 + ' zł'
                  : 'Wybierz Event'}
              </span>
            </p>
          </>
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
