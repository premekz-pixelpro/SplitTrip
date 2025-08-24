import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/$eventId/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Add new Bill</div>;
}
