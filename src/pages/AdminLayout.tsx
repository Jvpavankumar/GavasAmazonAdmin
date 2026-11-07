import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X, Store, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminLogin from './AdminLogin';
import Loader from '../components/Loader';
import AdminNav from '../components/AdminNav';

const STORE_URL = import.meta.env.VITE_STORE_URL ?? 'http://localhost:5173';

export default function AdminLayout() {
  const { user, isAuthenticated, authLoading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader label="Checking session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-card sm:p-8">
          <h1 className="text-xl font-bold text-gray-900">Access denied</h1>
          <p className="mt-2 text-sm text-gray-500">
            Signed in as <strong>{user?.email}</strong> — this account is not an admin.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Ask the store owner to add your email to ADMIN_EMAILS in server/.env
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button type="button" onClick={signOut} className="btn-secondary py-2.5 text-sm">
              Sign out & try another account
            </button>
            <a href={STORE_URL} className="text-sm text-lavender-700 hover:underline">Back to store</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="page-container flex h-14 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate text-sm font-semibold text-lavender-800 sm:text-base">
              GavasMart Admin
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <a
              href={STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-lavender-700 sm:px-0 sm:hover:bg-transparent"
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Store</span>
            </a>
            <span className="hidden max-w-[120px] truncate text-sm text-gray-500 md:inline lg:max-w-[180px]">
              {user.email}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100%,280px)] flex-col bg-white shadow-elevated">
            <div className="flex h-14 items-center justify-between border-b border-gray-100 px-4">
              <span className="text-sm font-semibold text-gray-900">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <AdminNav onNavigate={() => setMenuOpen(false)} />
            </div>
            <div className="border-t border-gray-100 p-4">
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </aside>
        </div>
      )}

      <div className="page-container flex gap-4 py-4 sm:gap-6 sm:py-6 lg:gap-6">
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="card sticky top-[4.5rem] p-2">
            <AdminNav />
          </nav>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
