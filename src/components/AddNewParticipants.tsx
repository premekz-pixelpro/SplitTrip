// Enhanced AddParticipants component
import { useNewBillStore, useEventStore } from '@/store/';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, Modal } from '@/components/';
import { useEffect, useState } from 'react';
import { useContactPicker } from '@/hooks/useContactPicker';
import { useInviteNotification } from '@/hooks/useInviteNotification';

export const AddNewParticipants = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactSelectionMode, setContactSelectionMode] = useState(false);
  const [selectedFromContacts, setSelectedFromContacts] = useState([]);
  const [sendInvites, setSendInvites] = useState(true);

  const { currentEvent, participants, fetchParticipants, addParticipantToEvent } = useEventStore();
  const currentUser = useAuthStore((state) => state.user);
  const billValue = useNewBillStore((state) => state.value);

  // NewBillStore selections
  const selectedParticipants = useNewBillStore((state) => state.participants);
  const addParticipant = useNewBillStore((state) => state.addParticipant);
  const removeParticipant = useNewBillStore((state) => state.removeParticipant);
  const markAsPaid = useNewBillStore((state) => state.markAsPaid);
  const setShare = useNewBillStore((state) => state.setShare);

  const { isSupported, pickContacts } = useContactPicker();
  const { sendBulkInvites } = useInviteNotification();

  const otherParticipants = participants.filter((user) => user.uid !== currentUser?.uid);

  useEffect(() => {
    fetchParticipants();
    setShare(billValue);
  }, [billValue, selectedParticipants.length]);

  const handleContactSelection = async () => {
    try {
      const contacts = await pickContacts();
      setSelectedFromContacts(
        contacts.map((c) => ({
          ...c,
          canInvite: !!c.phone?.trim(),
        }))
      );
      setContactSelectionMode(true);
    } catch (error) {
      alert('Błąd przy wybieraniu kontaktów: ' + error.message);
    }
  };

  const handleConfirmContactAddition = async () => {
    try {
      // 1. Dodaj nowych uczestników do eventu (Firebase)
      for (const contact of selectedFromContacts) {
        await addParticipantToEvent(contact);
      }

      // 2. Dodaj do bill store
      selectedFromContacts.forEach((contact) => {
        addParticipant(contact);
      });

      // 3. Wyślij zaproszenia WhatsApp
      if (sendInvites) {
        const contactsToInvite = selectedFromContacts.filter((c) => c.canInvite);
        if (contactsToInvite.length > 0) {
          sendBulkInvites(contactsToInvite);
        }
      }

      // 4. Cleanup
      setSelectedFromContacts([]);
      setContactSelectionMode(false);
      setIsModalOpen(false);

      alert(`Dodano ${selectedFromContacts.length} nowych uczestników!`);

      // Odśwież listę uczestników
      fetchParticipants();
    } catch (error) {
      alert('Błąd przy dodawaniu uczestników: ' + error.message);
    }
  };

  const getShareColor = (share) => {
    if (share > 0) return 'green';
    if (share < 0) return 'red';
    return 'black';
  };

  // if (otherParticipants.length !== 0) return <div>No other participants in this event</div>;

  return (
    <div className="participants-section">
      <Button className={''} onClick={() => setIsModalOpen(true)}>
        Add Participants
      </Button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>Select Participants</h3>

        {!contactSelectionMode ? (
          <>
            {/* Existing participants from event */}
            <div className="available-friends">
              <h4>Z wydarzenia:</h4>
              {otherParticipants
                .filter((user) => !selectedParticipants.some((p) => p.userId === user.uid))
                .map((user) => (
                  <div key={user.uid} className="friend-item">
                    <img src={user.image} alt={user.displayName} />
                    <span>{user.displayName}</span>
                    <Button onClick={() => addParticipant(user)} className="add-button">
                      Add to Bill
                    </Button>
                  </div>
                ))}
            </div>

            {/* Add from contacts */}
            <div
              className="contact-options"
              style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}
            >
              <h4>Dodaj nowych:</h4>

              {isSupported && (
                <Button
                  onClick={handleContactSelection}
                  className="contact-picker-button"
                  style={{
                    width: '100%',
                    marginBottom: '10px',
                    backgroundColor: '#25D366',
                    color: 'white',
                  }}
                >
                  📱 Wybierz z kontaktów telefonu
                </Button>
              )}

              <Button
                onClick={() => {
                  const tripLink = `${window.location.origin}/join/${currentEvent?.id}`;
                  const message = `🎒 Dołącz do naszego wydarzenia "${currentEvent?.title}" w SplitTrip: ${tripLink}`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#25D366',
                  color: 'white',
                }}
              >
                💬 Udostępnij przez WhatsApp
              </Button>
            </div>
          </>
        ) : (
          // Contact selection confirmation
          <div className="contact-confirmation">
            <h4>Wybrani z kontaktów ({selectedFromContacts.length}):</h4>

            <div
              className="selected-contacts"
              style={{ maxHeight: '200px', overflowY: 'auto', margin: '15px 0' }}
            >
              {selectedFromContacts.map((contact) => (
                <div
                  key={contact.uid}
                  className="contact-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    marginBottom: '5px',
                    borderRadius: '5px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{contact.displayName}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {contact.phone || contact.email || 'Brak kontaktu'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {contact.canInvite && (
                      <span style={{ color: '#25D366', fontSize: '12px' }}>📱 WhatsApp</span>
                    )}
                    <Button
                      onClick={() =>
                        setSelectedFromContacts((prev) => prev.filter((c) => c.uid !== contact.uid))
                      }
                      style={{ padding: '2px 6px', fontSize: '12px' }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Send invites option */}
            {selectedFromContacts.some((c) => c.canInvite) && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  backgroundColor: '#e8f5e8',
                  borderRadius: '5px',
                  marginBottom: '15px',
                }}
              >
                <input
                  type="checkbox"
                  checked={sendInvites}
                  onChange={(e) => setSendInvites(e.target.checked)}
                />
                <div>
                  <strong>Wyślij zaproszenia WhatsApp</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {selectedFromContacts.filter((c) => c.canInvite).length} osób otrzyma link do
                    dołączenia
                  </div>
                </div>
              </label>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                onClick={() => {
                  setContactSelectionMode(false);
                  setSelectedFromContacts([]);
                }}
                style={{ flex: 1, backgroundColor: '#ccc' }}
              >
                Wstecz
              </Button>
              <Button
                onClick={handleConfirmContactAddition}
                style={{ flex: 1, backgroundColor: '#007bff' }}
              >
                Dodaj {sendInvites ? 'i zaproś' : ''}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* List of selected participants (unchanged) */}
      <div className="selected-participants">
        <h4>Participants</h4>
        {selectedParticipants.map((participant) => (
          <div key={participant.userId} className="participant-item">
            <img src={participant.image} alt={participant.displayName} />
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
