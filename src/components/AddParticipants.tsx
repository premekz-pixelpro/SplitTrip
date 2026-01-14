import { useNewBillStore, useEventStore } from '@/store/';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, Modal } from '@/components/';
import { useEffect, useState } from 'react';

export const AddParticipants = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { participants, fetchParticipants } = useEventStore();
  const currentUser = useAuthStore((state) => state.user);
  const billValue = useNewBillStore((state) => state.value);
  // const { availableUsers, fetchAvailableUsers } = useEventStore();

  // NewBillStore selections
  const selectedParticipants = useNewBillStore((state) => state.participants);
  const addParticipant = useNewBillStore((state) => state.addParticipant);
  const removeParticipant = useNewBillStore((state) => state.removeParticipant);
  const markAsPaid = useNewBillStore((state) => state.markAsPaid);
  const setShare = useNewBillStore((state) => state.setShare);
  const otherParticipants = participants.filter((user) => user.uid !== currentUser?.uid);
  const participantsToAdd = otherParticipants.filter(
    (user) => !selectedParticipants.some((p) => p.userId === user.uid)
  );

  useEffect(() => {
    fetchParticipants();
    setShare(billValue);
  }, [billValue, selectedParticipants.length, fetchParticipants, setShare]); // Recalculate share when value or participants change

  // console.log('participants', selectedParticipants);
  const getShareColor = (share: number) => {
    if (share > 0) return 'green';
    if (share < 0) return 'red';
    return 'black';
  };

  if (otherParticipants.length === 0) return <div>No other participants in this event</div>;

  return (
    <div className="participants-section">
      <Button className={''} onClick={() => setIsModalOpen(true)}>
        Add Participants
      </Button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>Select Participants</h3>
        {/* List of available users */}
        <div className="available-friends">
          {participantsToAdd.length > 0 ? (
            participantsToAdd.map((user) => (
              <div key={user.uid} className="friend-item">
                <img src={user.image || '/default-profile.png'} alt={user.displayName} />
                <span>{user.displayName}</span>
                <Button onClick={() => addParticipant(user)} className="add-button">
                  Add to Bill
                </Button>
              </div>
            ))
          ) : (
            <p>No more participants to add</p>
          )}
        </div>
      </Modal>

      {/* List of selected participants */}
      <div className="selected-participants">
        <h4>Participants</h4>
        {selectedParticipants.map((participant) => (
          <div key={participant.userId} className="participant-item">
            <img
              style={{ width: '40px', height: '40px', borderRadius: '50%' }}
              src={participant.image || '/default-profile.png'}
              alt={participant.displayName}
            />
            <span>{participant.displayName}</span>
            <span style={{ color: getShareColor(participant.share) }}>
              Share: {participant.share || 0}
            </span>
            <label className="paying-label">
              <input
                type="checkbox"
                checked={participant.hasPaid}
                onChange={() => markAsPaid(participant.userId)}
              />
              Paid
            </label>
            <Button onClick={() => removeParticipant(participant.userId)} className="remove-button">
              X
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
