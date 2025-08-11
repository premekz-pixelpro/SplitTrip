import { createFileRoute } from '@tanstack/react-router';
import { App } from '@/App';
import { Header } from '@/components/Header';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <>
      <Header />,{/* <App /> */}
    </>
  );
}
