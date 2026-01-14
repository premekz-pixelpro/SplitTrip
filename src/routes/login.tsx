import { LoginForm } from '@/components';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const safeRedirect =
    typeof redirect === 'string' && /^\/join\/[A-Za-z0-9_-]+$/.test(redirect) ? redirect : '/';
  return (
    <>
      <LoginForm
        onShowSignUp={() => navigate({ to: '/signup', search: { redirect: safeRedirect } })}
        onSuccess={() => navigate({ to: safeRedirect })}
      />
    </>
  );
}
