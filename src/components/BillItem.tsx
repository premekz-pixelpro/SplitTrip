import { Bill } from '@/types/types';

interface BillItemProps {
    bill: Bill; 
}
export const BillItem: React.FC<BillItemProps> = ({ bill
}) => {
    const participants = bill.participants
    const getShareColor = (share: number) => {
        if (share > 0) return 'green';
        if (share < 0) return 'red';
        return 'black';
      };

    return (
        <div className="bill-item">
            <h3>{bill.title}</h3>
            <p>Value: {bill.value}</p>
            {/* <p>Created At: {createdAt.toDate().toLocaleString()}</p> */}
            <div className="participants">
                {participants.map(participant => (
                    <div key={participant.userId} className="participant">
                        <img src={participant.image || `https://ui-avatars.com/api/?name=${participant.displayName}`} alt={participant.displayName} />
                        <h4>{participant.displayName}</h4>
                        <p>{participant.creator ? 'Yes' : 'No'}</p>
                        <p style={{color: getShareColor(participant.share)}}>Share: {participant.share}</p>
                        <p>Has Paid: {participant.hasPaid ? 'Yes' : 'No'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}