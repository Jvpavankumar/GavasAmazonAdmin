import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Users, Tags, IndianRupee } from 'lucide-react';
import Loader from '../components/Loader';
import { fetchDashboard, type DashboardData } from '../api/admin';

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card">
        <Loader fullPage label="Loading dashboard..." />
      </div>
    );
  }

  if (!data) {
    return <div className="card p-8 text-center text-sm text-red-600">Failed to load dashboard. Is the API server running?</div>;
  }

  const stats = [
    { label: 'Products', value: data.stats.products, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: 'Units in stock', value: data.stats.totalUnits, icon: Package, color: 'text-teal-600 bg-teal-50' },
    { label: 'Orders', value: data.stats.orders, icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Users', value: data.stats.users, icon: Users, color: 'text-violet-600 bg-violet-50' },
    { label: 'Categories', value: data.stats.categories, icon: Tags, color: 'text-amber-600 bg-amber-50' },
    { label: 'Out of stock', value: data.stats.outOfStockProducts, icon: Tags, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your store</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-lavender-700" />
          <p className="text-sm text-gray-500">Total revenue</p>
        </div>
        <p className="mt-1 text-3xl font-bold text-gray-900">
          ₹{data.stats.revenue.toLocaleString('en-IN')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900">Orders by status</h2>
          <ul className="mt-4 space-y-2">
            {data.ordersByStatus.map(({ status, count }) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{status}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </li>
            ))}
            {data.ordersByStatus.length === 0 && (
              <li className="text-sm text-gray-400">No orders yet</li>
            )}
          </ul>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent orders</h2>
            <Link to="/orders" className="text-sm font-medium text-lavender-700 hover:underline">View all</Link>
          </div>
          <ul className="mt-4 divide-y divide-gray-100">
            {data.recentOrders.map((order) => (
              <li key={order.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{order.id}</p>
                  <p className="text-gray-500">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{order.total.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400">{order.status}</p>
                </div>
              </li>
            ))}
            {data.recentOrders.length === 0 && (
              <li className="py-4 text-sm text-gray-400">No recent orders</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
