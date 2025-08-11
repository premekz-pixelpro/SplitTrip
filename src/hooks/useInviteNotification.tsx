// hooks/useInviteNotification.js
import { useEventStore } from '@/store/';

export const useInviteNotification = () => {
  const event = useEventStore((state) => state.currentEvent);

  const sendWhatsAppInvite = (participant) => {
    const eventLink = `${window.location.origin}/join/${event?.id}`;
    const message = `🎒 Cześć ${participant.displayName}!

Zostałeś/aś dodany/a do wydarzenia "${event?.name}" w SplitTrip!

📱 Dołącz tutaj: ${eventLink}

Będziemy tam dzielić koszty wspólnych wydatków. ✈️`;

    const cleanPhone = participant.phone?.replace(/\D/g, '');
    if (!cleanPhone) {
      throw new Error('Brak numeru telefonu');
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    return whatsappUrl;
  };

  const sendBulkInvites = (participants) => {
    const participantsWithPhone = participants.filter((p) => p.phone?.trim());

    if (participantsWithPhone.length === 0) {
      alert('Brak uczestników z numerami telefonu do powiadomienia');
      return;
    }

    if (confirm(`Wysłać zaproszenia WhatsApp do ${participantsWithPhone.length} osób?`)) {
      participantsWithPhone.forEach((participant, index) => {
        setTimeout(() => {
          try {
            sendWhatsAppInvite(participant);
          } catch (error) {
            console.error(`Błąd wysyłania do ${participant.displayName}:`, error);
          }
        }, index * 1000); // 1s opóźnienie między każdą
      });

      alert(`Otwarto ${participantsWithPhone.length} zaproszeń WhatsApp`);
    }
  };

  return { sendWhatsAppInvite, sendBulkInvites };
};
