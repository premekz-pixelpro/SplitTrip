import { Bill } from '@/types/types';
import { useAuthStore } from '@/store/useAuthStore';

interface BillItemProps {
  bill: Bill;
}
export const BillItem: React.FC<BillItemProps> = ({ bill }) => {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser ? currentUser.uid : '';
  const participants = bill.participants;
  const paidAmount = bill.participants.reduce((sum, p) => {
    return sum + (p.hasPaid && !p.creator ? p.share || 0 : 0);
  }, 0);
  // console.log("paidAmount", bill.value - paidAmount);
  const creatoridToDisplayName = (creatorId: string) => {
    const participant = participants.find((participant) => participant.userId === creatorId);
    return participant ? participant.displayName : creatorId;
  };

  // const getShareColor = (share: number) => {
  //     if (share > 0) return 'green';
  //     if (share < 0) return 'red';
  //     return 'black';
  //   };

  const yourShare =
    participants.find((participant) => participant.userId === currentUserId)?.share || 0;

  return (
    <div className="expense-card mb-2">
      <h3 className="pb-2 font-medium">
        {bill.title} {bill.value} zł
      </h3>
      <p>
        {bill.creatorId === currentUserId
          ? `Zapłaciłeś`
          : `${creatoridToDisplayName(bill.creatorId)} zapłacił`}{' '}
        {bill.value - paidAmount} zł
      </p>
      <p className={yourShare > 0 ? 'positive' : 'negative'}>
        {yourShare ? 'Twój udział ' + yourShare + ' zł' : 'Brak udziału'}
      </p>
    </div>
  );
};
