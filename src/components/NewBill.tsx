import { FormEvent } from "react";
import { useNewBillStore, useEventStore } from "@/store";
import { useAuthStore } from '@/store/useAuthStore';
import { Button, AddParticipants } from "@/components";

export const NewBill = () => {
  const { user } = useAuthStore();
  const { updateTotalExpenses } = useEventStore();
  const currentEvent = useEventStore(state => state.currentEvent);
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
      await updateTotalExpenses(currentEvent.id, billValue);
      
      // Reset form
      setBillTitle('');
      setBillValue(0);
    } catch (error) {
      console.error('Failed to create bill:', error);
    }
  };

  if (!currentEvent) return null;

  return (
    <form className="form-split-bill" onSubmit={handleSubmit}>
      <h2>Add Bill</h2>
      <label>🧾 Bill title</label>
      <input 
        type="text"
        value={billTitle} 
        onChange={(e) => setBillTitle(e.target.value)}
        required
      />
      <label>💰 Bill value</label>
      <input
        type="string"
        value={billValue}
        onChange={(e) => setBillValue(Number(e.target.value) || 0)}
        min="0"
        step="0.01"
        required
      />
      <AddParticipants />
      <Button type="submit" className="button">Add Bill</Button>
    </form>
  );
};