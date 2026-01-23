import { BillsTable } from '@/components/BillsTable';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/$eventId/billsTable')({
  component: RouteComponent,
});

function RouteComponent() {
  return <BillsTable />;
}
