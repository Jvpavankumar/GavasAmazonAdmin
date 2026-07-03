import { useEffect, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus, type AdminOrder } from '../api/admin';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;

import Loader from '../components/Loader';

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setOrders(await fetchAdminOrders(filter || undefined));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleStatusChange = async (id: string, status: string) => {
    await updateOrderStatus(id, status);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{orders.length} orders</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="card">
            <Loader fullPage label="Loading orders..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-6 text-sm text-gray-500">No orders found</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-500">{new Date(order.date).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-gray-600">{order.customer.name} · {order.customer.email}</p>
                  <p className="text-sm text-gray-500">{order.address.line}, {order.address.city} {order.address.zip}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">₹{order.total.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400">{order.paymentMethod}</p>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="mt-2 rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100 pt-3">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between py-2 text-sm text-gray-600">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{Math.round(item.price * item.quantity * 83).toLocaleString('en-IN')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
