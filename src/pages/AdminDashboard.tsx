import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Users, Tags, IndianRupee, Clock, CheckCircle, XCircle } from 'lucide-react';
import Loader from '../components/Loader';
import { fetchDashboard, fetchAdminOrders, type DashboardData } from '../api/admin';

function formatInr(value: number | undefined) {
  return (value ?? 0).toLocaleString('en-IN');
}

function normalizeOrderStatus(status: string) {
  return status === 'Shipped' ? 'Processing' : status;
}

function sumOrderTotals(orders: { status: string; total: number }[], status: string) {
  return orders
    .filter((o) => normalizeOrderStatus(o.status) === status)
    .reduce((sum, o) => sum + o.total, 0);
}

function countOrdersByStatus(orders: { status: string }[], status: string) {
  return orders.filter((o) => normalizeOrderStatus(o.status) === status).length;
}

async function loadDashboardData(): Promise<DashboardData> {
  const dashboard = await fetchDashboard();

  if (typeof dashboard.stats.deliveredOrders === 'number') {
    return dashboard;
  }

  const orders = await fetchAdminOrders();
  const deliveredTotal = sumOrderTotals(orders, 'Delivered');
  const pendingTotal = sumOrderTotals(orders, 'Processing');
  const cancelledTotal = sumOrderTotals(orders, 'Cancelled');

  return {
    ...dashboard,
    stats: {
      ...dashboard.stats,
      revenue: deliveredTotal,
      pendingRevenue: pendingTotal,
      deliveredOrders: countOrdersByStatus(orders, 'Delivered'),
      pendingOrders: countOrdersByStatus(orders, 'Processing'),
      cancelledOrders: countOrdersByStatus(orders, 'Cancelled'),
    },
    ordersByStatus: [
      { status: 'Processing', count: countOrdersByStatus(orders, 'Processing'), amount: pendingTotal },
      { status: 'Delivered', count: countOrdersByStatus(orders, 'Delivered'), amount: deliveredTotal },
      { status: 'Cancelled', count: countOrdersByStatus(orders, 'Cancelled'), amount: cancelledTotal },
    ],
  };
}

function statusAmount(
  ordersByStatus: DashboardData['ordersByStatus'],
  status: string,
) {
  return ordersByStatus.find((s) => s.status === status)?.amount ?? 0;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData()
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-emerald-600" />
            <p className="text-sm text-gray-500">Total revenue (Delivered)</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            ₹{formatInr(data.stats.revenue)}
          </p>
          <p className="mt-1 text-xs text-gray-400">{data.stats.deliveredOrders ?? 0} delivered orders</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-gray-500">Pending amount (To deliver)</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            ₹{formatInr(data.stats.pendingRevenue)}
          </p>
          <p className="mt-1 text-xs text-gray-400">{data.stats.pendingOrders ?? 0} orders awaiting delivery</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-gray-500">Cancelled orders</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{data.stats.cancelledOrders ?? 0}</p>
          <p className="mt-1 text-xs text-gray-400">
            ₹{formatInr(statusAmount(data.ordersByStatus, 'Cancelled'))} order value
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900">Orders by status</h2>
          <ul className="mt-4 space-y-3">
            {data.ordersByStatus.map(({ status, count, amount }) => {
              const resolvedAmount = amount ?? 0;
              const styles =
                status === 'Delivered'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                  : status === 'Cancelled'
                    ? 'bg-red-50 text-red-800 border-red-100'
                    : 'bg-amber-50 text-amber-800 border-amber-100';
              const Icon = status === 'Delivered' ? CheckCircle : status === 'Cancelled' ? XCircle : Clock;
              const label = status === 'Processing' ? 'To deliver' : status;

              return (
                <li
                  key={status}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${styles}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{count} orders</p>
                    <p className="text-xs opacity-80">₹{formatInr(resolvedAmount)}</p>
                  </div>
                </li>
              );
            })}
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
