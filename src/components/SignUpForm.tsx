import { useState } from 'react';
import { useAuthStore } from '@/store/';
import toast, { Toaster } from 'react-hot-toast';

export const SignUpForm = ({
  onShowLogin,
  onSuccess,
}: {
  onShowLogin: () => void;
  onSuccess?: () => void;
}) => {
  const { signUp, authError, loadingAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Dodac jak jestem na /join/eventId to przy rejestracji dodac usera do eventu automatycznie

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password, displayName);
      // console.log('User signed up:', displayName);
      toast(`Witamy w aplikacji ${displayName}! Konto zostało utworzone.`);
      onSuccess?.();
    } catch {
      toast('Rejestracja nie powiodła się. Spróbuj ponownie.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Sign Up</h2>

        {authError && <div className="error-message">{authError}</div>}

        <div className="form-group">
          <label htmlFor="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={loadingAuth}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loadingAuth}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loadingAuth}
          />
        </div>
        <div className="flex justify-between">
          <button type="submit" disabled={loadingAuth}>
            {loadingAuth ? 'Signing up...' : 'Sign Up'}
          </button>
          <button type="button" onClick={onShowLogin}>
            Log In
          </button>
        </div>
      </form>
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: 8000 }} />
    </>
  );
};
