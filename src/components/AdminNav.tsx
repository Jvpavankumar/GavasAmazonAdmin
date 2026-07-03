import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tags,
} from 'lucide-react';

export const ADMIN_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/categories', label: 'Categories', icon: Tags },
] as const;

interface AdminNavProps {
  onNavigate?: () => void;
  className?: string;
}

export default function AdminNav({ onNavigate, className = '' }: AdminNavProps) {
  return (
    <nav className={`space-y-0.5 ${className}`}>
      {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-lavender-700 text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
