import { BillsList } from '@/components';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/$eventId/billhistory')({
  component: BillHistory,
});

function BillHistory() {
  return <BillsList />;
}
