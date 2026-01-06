import { useState } from 'react';
import {
  Header,
  Footer,
  LoginForm,
  SignUpForm,
  EventSelector,
  AddNewEvent,
  Modal,
  AddNewParticipants,
} from '@/components/';
import { useAuthStore } from '@/store';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Toaster } from 'react-hot-toast';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { user, loadingAuth } = useAuthStore();
  // const [authInitialized, setAuthInitialized] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

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

  // Jeśli użytkownik nie jest zalogowany, pokaż tylko LoginForm
  if (!user) {
    return showSignUp ? (
      <SignUpForm onShowLogin={() => setShowSignUp(false)} />
    ) : (
      <LoginForm onShowSignUp={() => setShowSignUp(true)} />
    );
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
