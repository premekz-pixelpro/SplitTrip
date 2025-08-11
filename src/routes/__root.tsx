import { App } from '@/App';
import { Footer } from '@/components/Footer';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: () => (
    <>
      <Footer />
      <Outlet />
      <TanStackRouterDevtools position="top-right" />
    </>
  ),
});
