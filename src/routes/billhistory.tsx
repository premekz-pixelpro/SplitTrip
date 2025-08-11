import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/billhistory')({
  component: BillHistory,
});

function BillHistory() {
  return <div className="p-2">Hello from Billhistory!</div>;
}
