import { useState } from 'react';
import { useAuthStore } from '@/store/';
import toast, { Toaster } from 'react-hot-toast';
import '@/styles/components/LoginForm.css';

export const LoginForm = ({
  onShowSignUp,
  onSuccess,
}: {
  onShowSignUp: () => void;
  onSuccess?: () => void;
}) => {
  const { signIn, loadingAuth, authError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await signIn(email, password);
      if (user) {
        toast('Logged in successfully!');
        onSuccess?.();
      }
    } catch {
      toast('Login failed. Please try again.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>

        {authError && <div className="error-message">{authError}</div>}

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
            {loadingAuth ? 'Logging in...' : 'Log In'}
          </button>
          <button type="button" onClick={onShowSignUp}>
            Sign Up
          </button>
        </div>
      </form>
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ duration: 8000 }} />
    </>
  );
};
