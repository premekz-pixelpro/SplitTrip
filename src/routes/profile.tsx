import { EventSelector, SummaryCard } from '@/components';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/profile')({
  component: Profile,
});

function Profile() {
  return (
    <>
      {/* <SummaryCard /> */}
      <EventSelector />
    </>
  );
}
