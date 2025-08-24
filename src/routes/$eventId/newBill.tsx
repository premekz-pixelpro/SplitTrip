import { NewBill } from '@/components';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/$eventId/newBill')({
  component: RouteComponent,
});

function RouteComponent() {
  return <NewBill />;
}
