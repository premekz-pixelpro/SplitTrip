import { useState } from 'react';
import {
  Header,
  Footer,
  EventSelector,
  AddNewEvent,
  Modal,
  AddNewParticipants,
} from '@/components/';
import { useAuthStore } from '@/store';
import { Navigate, Outlet, createRootRoute, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Toaster } from 'react-hot-toast';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { user, loadingAuth } = useAuthStore();
  // const [authInitialized, setAuthInitialized] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // useEffect(() => {
  //   const initAuth = async () => {
  //     try {
  //       await checkAuthState(); // Firebase sprawdzi czy jest aktywna sesja
  //     } catch (error) {
  //       console.error('Auth initialization error:', error);
  //     } finally {
  //       setAuthInitialized(true);
  //     }
  //   };
  //   initAuth();
  // }, [checkAuthState]);

  // Pokaż loader podczas inicjalizacji Firebase Auth
  if (loadingAuth) {
    return <div className="loading">Inicjalizacja aplikacji...</div>;
  }

  // Guard: jeśli użytkownik nie jest zalogowany, trzymaj go na /login lub /signup
  if (!user) {
    // Publiczny wyjątek: tylko prawdziwe invite linki w formacie /join/<eventId>
    if (pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/join/')) {
      return <Navigate to="/login" />;
    }
    return <Outlet />;
  }

  // Guard: jeśli użytkownik jest zalogowany, nie pokazuj stron logowania
  if (pathname === '/login' || pathname === '/signup') {
    return <Navigate to="/" />;
  }

  // Jeśli użytkownik jest zalogowany, pokaż pełną aplikację
  return (
    <>
      <Header onAddEvent={() => setShowAddEvent(true)} />
      {showAddEvent && (
        <Modal isOpen={showAddEvent} onClose={() => setShowAddEvent(false)}>
          <EventSelector />
          <AddNewEvent />
          <AddNewParticipants />
        </Modal>
      )}
      <Outlet />
      <Footer />
      <TanStackRouterDevtools position="top-right" />
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: 5000 }} />
    </>
  );
}
