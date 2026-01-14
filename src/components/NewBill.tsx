import { FormEvent, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNewBillStore, useEventStore } from '@/store';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, AddParticipants } from '@/components';

export const NewBill = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitCountRef = useRef(0);
  const { user } = useAuthStore();
  const currentEvent = useEventStore((state) => state.currentEvent);
  const billTitle = useNewBillStore((state) => state.title);
  const billValue = useNewBillStore((state) => state.value);
  const setBillTitle = useNewBillStore((state) => state.setTitle);
  const setBillValue = useNewBillStore((state) => state.setValue);
  const handleNewBill = useNewBillStore((state) => state.createBill);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Zabezpieczenie przed wielokrotnym kliknięciem
    if (!user?.uid || !currentEvent || isSubmitting) {
      console.log('Submit zablokowany - isSubmitting:', isSubmitting);
      return;
    }

    submitCountRef.current += 1;
    console.log('Submit #', submitCountRef.current, '- rozpoczynam...');
    setIsSubmitting(true);

    try {
      // Pass eventId to createBill
      await handleNewBill(user.uid, currentEvent.id);
      // await updateTotalExpenses(currentEvent.id, billValue);

      // Reset form
      setBillTitle('');
      setBillValue(0);
      console.log('Submit zakończony pomyślnie');
      toast.success('Rachunek został dodany!');
    } catch (error) {
      console.error('Failed to create bill:', error);
      toast.error('Nie udało się dodać rachunku');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentEvent) return null;

  return (
    <form className=" flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col">
        <label className="mb-2">🧾 Bill title</label>
        <input
          className=""
          type="text"
          value={billTitle}
          onChange={(e) => setBillTitle(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="flex flex-col ">
        <label className="mb-2 ">💰 Bill value</label>
        <input
          className="w-full"
          type="text"
          value={billValue}
          onChange={(e) => setBillValue(Number(e.target.value) || 0)}
          min="0"
          step="0.01"
          disabled={isSubmitting}
          required
        />
      </div>
      <AddParticipants />
      <Button type="submit" className="button" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Bill'}
      </Button>
    </form>
  );
};
