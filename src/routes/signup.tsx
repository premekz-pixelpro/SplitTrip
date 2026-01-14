import { SignUpForm } from '@/components';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/signup')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const safeRedirect =
    typeof redirect === 'string' && /^\/join\/[A-Za-z0-9_-]+$/.test(redirect) ? redirect : '/';
  return (
    <>
      <SignUpForm
        onShowLogin={() => navigate({ to: '/login', search: { redirect: safeRedirect } })}
        onSuccess={() => navigate({ to: safeRedirect })}
      />
    </>
  );
}
