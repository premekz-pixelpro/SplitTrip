import { FormEvent } from 'react';
import { useNewBillStore, useEventStore } from '@/store';
import { useAuthStore } from '@/store/useAuthStore';
import { Button, AddParticipants } from '@/components';

export const NewBill = () => {
  const { user } = useAuthStore();
  const currentEvent = useEventStore((state) => state.currentEvent);
  const billTitle = useNewBillStore((state) => state.title);
  const billValue = useNewBillStore((state) => state.value);
  const setBillTitle = useNewBillStore((state) => state.setTitle);
  const setBillValue = useNewBillStore((state) => state.setValue);
  const handleNewBill = useNewBillStore((state) => state.createBill);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid || !currentEvent) return;

    try {
      // Pass eventId to createBill
      await handleNewBill(user.uid, currentEvent.id);
      // await updateTotalExpenses(currentEvent.id, billValue);

      // Reset form
      setBillTitle('');
      setBillValue(0);
    } catch (error) {
      console.error('Failed to create bill:', error);
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
          required
        />
      </div>
      <AddParticipants />
      <Button type="submit" className="button">
        Add Bill
      </Button>
    </form>
  );
};
