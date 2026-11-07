import { useState } from 'react';
import { Shield, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STORE_URL = import.meta.env.VITE_STORE_URL ?? 'http://localhost:5173';

export default function AdminLogin() {
  const { signInWithAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithAdmin(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-card">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-lavender-100">
            <Shield className="h-6 w-6 text-lavender-700" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">GavasMart Admin</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in with your admin credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="text-xs font-medium text-gray-600">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pr-3 pl-10 text-sm outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100"
                placeholder="Admin email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="text-xs font-medium text-gray-600">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 py-2.5 pr-3 pl-10 text-sm outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <a href={STORE_URL} className="mt-4 block text-center text-sm text-lavender-700 hover:underline">
          ← Back to store
        </a>
      </div>
    </div>
  );
}
