// hooks/useContactIntegration.js
import { useState } from 'react';
import { useEventStore } from '@/store/';

export const useContactIntegration = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { addParticipantToEvent, currentEvent } = useEventStore();
  
  // Contact Picker API
  const pickContacts = async () => {
    if (!('contacts' in navigator)) {
      throw new Error('Contact Picker API nie jest obsługiwane w tej przeglądarce');
    }
    
    try {
      const contacts = await navigator.contacts.select([
        'name', 
        'tel', 
        'email'
      ], { 
        multiple: true 
      });
      
      return contacts.map(contact => ({
        uid: crypto.randomUUID(),
        displayName: contact.name?.[0] || 'Nieznana osoba',
        phone: contact.tel?.[0] || '',
        email: contact.email?.[0] || '',
        image: '/default-avatar.png',
        source: 'contacts',
        addedAt: Date.now(),
        isNewToEvent: true
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        return [];
      }
      throw error;
    }
  };
  
  // vCard file import
  const importFromVCard = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const vCardData = e.target.result;
          const contacts = parseVCard(vCardData);
          resolve(contacts);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };
  
  // Basic vCard parser
  const parseVCard = (vCardText) => {
    const contacts = [];
    const vCards = vCardText.split('BEGIN:VCARD');
    
    vCards.forEach(vCard => {
      if (!vCard.trim()) return;
      
      const lines = vCard.split('\n');
      const contact = { 
        uid: crypto.randomUUID(),
        image: '/default-avatar.png',
        source: 'vcard',
        addedAt: Date.now(),
        isNewToEvent: true
      };
      
      lines.forEach(line => {
        if (line.startsWith('FN:')) {
          contact.displayName = line.substring(3).trim();
        } else if (line.startsWith('EMAIL:')) {
          contact.email = line.substring(6).trim();
        } else if (line.startsWith('TEL:')) {
          contact.phone = line.substring(4).trim();
        }
      });
      
      if (contact.displayName) {
        contacts.push(contact);
      }
    });
    
    return contacts;
  };
  
  // WhatsApp invite sender
  const sendWhatsAppInvite = (participant) => {
    const eventLink = `${window.location.origin}/join/${currentEvent?.id}`;
    const message = `🎒 Cześć ${participant.displayName}!

Zostałeś/aś dodany/a do wydarzenia "${currentEvent?.name}" w SplitTrip!

📱 Dołącz tutaj: ${eventLink}

Będziemy tam dzielić koszty wspólnych wydatków. ✈️`;

    const cleanPhone = participant.phone?.replace(/\D/g, '');
    if (!cleanPhone) {
      throw new Error(`Brak numeru telefonu dla ${participant.displayName}`);
    }
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    return whatsappUrl;
  };
  
  // Bulk invite sender
  const sendBulkInvites = async (participants) => {
    const participantsWithPhone = participants.filter(p => p.phone?.trim());
    
    if (participantsWithPhone.length === 0) {
      alert('Brak uczestników z numerami telefonu do powiadomienia');
      return;
    }
    
    const shouldSend = confirm(
      `Wysłać zaproszenia WhatsApp do ${participantsWithPhone.length} osób?\n\n` +
      participantsWithPhone.map(p => `• ${p.displayName}`).join('\n')
    );
    
    if (shouldSend) {
      setIsProcessing(true);
      
      for (let i = 0; i < participantsWithPhone.length; i++) {
        const participant = participantsWithPhone[i];
        try {
          sendWhatsAppInvite(participant);
          
          // Delay between messages
          if (i < participantsWithPhone.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        } catch (error) {
          console.error(`Błąd wysyłania do ${participant.displayName}:`, error);
        }
      }
      
      setIsProcessing(false);
      alert(`Otwarto ${participantsWithPhone.length} zaproszeń WhatsApp`);
    }
  };
  
  // Add contacts to event and optionally send invites
  const addContactsToEvent = async (contacts, shouldSendInvites = true) => {
    setIsProcessing(true);
    
    try {
      // Add to Firebase event
      for (const contact of contacts) {
        await addParticipantToEvent(contact);
      }
      
      // Send invites if requested
      if (shouldSendInvites) {
        await sendBulkInvites(contacts);
      }
      
      return contacts.length;
    } catch (error) {
      console.error('Error adding contacts to event:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    isProcessing,
    pickContacts,
    importFromVCard,
    sendWhatsAppInvite,
    sendBulkInvites,
    addContactsToEvent
  };
};

// Enhanced Modal Content Component
export const ContactSelectionModal = ({ 
  isOpen, 
  onClose, 
  selectedContacts, 
  setSelectedContacts,
  onConfirm 
}) => {
  const [sendInvites, setSendInvites] = useState(true);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ minWidth: '400px' }}>
        <h3>Potwierdź dodanie uczestników</h3>
        
        <div style={{ margin: '15px 0' }}>
          <strong>Wybrani z kontaktów ({selectedContacts.length}):</strong>
        </div>
        
        <div style={{ 
          maxHeight: '250px', 
          overflowY: 'auto', 
          border: '1px solid #ddd',
          borderRadius: '5px',
          padding: '10px',
          marginBottom: '15px'
        }}>
          {selectedContacts.map(contact => (
            <div key={contact.uid} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '8px',
              backgroundColor: '#f9f9f9',
              marginBottom: '5px',
              borderRadius: '3px'
            }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{contact.displayName}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {contact.phone || contact.email || 'Brak kontaktu'}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {contact.canInvite && (
                  <span style={{ color: '#25D366', fontSize: '12px' }}>📱</span>
                )}
                <Button
                  onClick={() => setSelectedContacts(prev => 
                    prev.filter(c => c.uid !== contact.uid)
                  )}
                  style={{ padding: '2px 6px', fontSize: '12px' }}
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Send invites option */}
        {selectedContacts.some(c => c.canInvite) && (
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            padding: '10px',
            backgroundColor: '#e8f5e8',
            borderRadius: '5px',
            marginBottom: '15px'
          }}>
            <input
              type="checkbox"
              checked={sendInvites}
              onChange={(e) => setSendInvites(e.target.checked)}
            />
            <div>
              <strong>Wyślij zaproszenia WhatsApp</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {selectedContacts.filter(c => c.canInvite).length} osób otrzyma link do dołączenia
              </div>
            </div>
          </label>
        )}
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            onClick={() => {
              setSelectedContacts([]);
              onClose();
            }}
            style={{ flex: 1, backgroundColor: '#ccc' }}
          >
            Anuluj
          </Button>
          <Button
            onClick={() => onConfirm(sendInvites)}
            style={{ flex: 1, backgroundColor: '#007bff' }}
          >
            Dodaj do wydarzenia {sendInvites ? 'i zaproś' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
};