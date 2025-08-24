import { useEffect, useState } from 'react';
import { Header, Footer, LoginForm } from '@/components/';
import { useAuthStore } from '@/store';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { user, loading, checkAuthState } = useAuthStore();
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuthState(); // Firebase sprawdzi czy jest aktywna sesja
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setAuthInitialized(true);
      }
    };
    initAuth();
  }, [checkAuthState]);

  // Pokaż loader podczas inicjalizacji Firebase Auth
  if (!authInitialized || loading) {
    return <div className="loading">Inicjalizacja aplikacji...</div>;
  }

  // Jeśli użytkownik nie jest zalogowany, pokaż tylko LoginForm
  if (!user) {
    return <LoginForm />;
  }

  // Jeśli użytkownik jest zalogowany, pokaż pełną aplikację
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
      <TanStackRouterDevtools position="top-right" />
    </>
  );
}
