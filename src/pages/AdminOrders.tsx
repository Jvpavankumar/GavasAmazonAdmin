import { useEffect, useState } from 'react';
import { CheckCircle, Mail, PackageCheck, Search, XCircle } from 'lucide-react';
import { fetchAdminOrders, resendOrderOtp, updateOrderStatus, verifyOrderOtp, type AdminOrder } from '../api/admin';
import { ApiError } from '../api/client';
import Loader from '../components/Loader';

const STATUSES = ['Processing', 'Delivered', 'Cancelled'] as const;
const STATUS_OPTIONS = ['Processing', 'Delivered', 'Cancelled'] as const;

function OrderOtpVerify({
  order,
  onVerified,
}: {
  order: AdminOrder;
  onVerified: () => void;
}) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  if (order.deliveryConfirmed || order.status === 'Delivered') {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
        <CheckCircle className="h-4 w-4 shrink-0" />
        Delivery confirmed — customer OTP verified
      </div>
    );
  }

  if (order.status === 'Cancelled') {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
        <XCircle className="h-4 w-4 shrink-0" />
        Order cancelled
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otp.replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      setError('Enter the 6-digit OTP from the customer email.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyOrderOtp(order.id, code);
      setOtp('');
      onVerified();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setResendMessage(null);
    setError(null);
    try {
      const result = await resendOrderOtp(order.id);
      onVerified();
      if (result.emailSent) {
        setResendMessage(`OTP email sent to ${result.recipientEmail}`);
      } else {
        setResendMessage(`Email could not be sent. OTP is ${result.otp} — share it with the customer manually.`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend OTP email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {order.orderOtp && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current order OTP</p>
          <p className="mt-1 font-mono text-xl font-bold tracking-[0.3em] text-gray-900">{order.orderOtp}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-lavender-200 bg-white px-3 py-2 text-sm font-medium text-lavender-800 transition hover:bg-lavender-50 disabled:opacity-60"
        >
          <Mail className="h-4 w-4" />
          {resending ? 'Sending...' : 'Resend OTP email'}
        </button>
        <span className="text-xs text-gray-500">→ {order.customer.email}</span>
      </div>

      {resendMessage && (
        <p className="text-xs font-medium text-emerald-700">{resendMessage}</p>
      )}

    <form onSubmit={handleVerify} className="rounded-lg border border-lavender-100 bg-lavender-50/40 p-3 sm:p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <PackageCheck className="h-4 w-4 text-lavender-700" />
        Confirm delivery with customer OTP
      </div>
      <p className="mt-1 text-xs text-gray-500">
        After delivery, ask the customer for the 6-digit OTP from their order confirmation email.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
            setError(null);
          }}
          className="w-full max-w-[200px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm tracking-widest outline-none focus:border-lavender-500 focus:ring-2 focus:ring-lavender-100"
        />
        <button
          type="submit"
          disabled={submitting || otp.length !== 6}
          className="btn-lavender shrink-0 px-4 py-2 text-sm disabled:opacity-60"
        >
          {submitting ? 'Verifying...' : 'Confirm received'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </form>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (overrides?: {
    status?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    setLoading(true);
    try {
      setOrders(await fetchAdminOrders({
        status: (overrides?.status ?? statusFilter) || undefined,
        q: (overrides?.q ?? search) || undefined,
        dateFrom: (overrides?.dateFrom ?? dateFrom) || undefined,
        dateTo: (overrides?.dateTo ?? dateTo) || undefined,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, dateFrom, dateTo]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    load({ status: '', q: '', dateFrom: '', dateTo: '' });
  };

  const hasFilters = Boolean(search || dateFrom || dateTo || statusFilter);

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
      </div>

      <form onSubmit={handleSearch} className="card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="search"
            placeholder="Search by customer name, email, mobile, or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-gray-500">
            From date
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-500"
            />
          </label>
          <label className="text-xs text-gray-500">
            To date
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-500"
            />
          </label>
          <label className="text-xs text-gray-500">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-500"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <button type="submit" className="btn-lavender px-4 py-2 text-sm">
            Search
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </form>

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
                  <p className="text-sm text-gray-500">
                    {order.address.phone && <span className="block">+91 {order.address.phone}</span>}
                    {order.address.street}, {order.address.line}, {order.address.city} {order.address.zip}
                  </p>
                </div>
                <div className="text-right">
                  <div className="space-y-0.5 text-sm text-gray-600">
                    <p>Subtotal: ₹{order.subtotal.toLocaleString('en-IN')}</p>
                    <p>Delivery: ₹{order.shipping.toLocaleString('en-IN')}</p>
                    <p className="text-lg font-bold text-gray-900">Total: ₹{order.total.toLocaleString('en-IN')}</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{order.paymentMethod}</p>
                  {order.status === 'Delivered' || order.deliveryConfirmed ? (
                    <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      Delivered
                    </span>
                  ) : order.status === 'Cancelled' ? (
                    <span className="mt-2 inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                      Cancelled
                    </span>
                  ) : (
                    <select
                      value={order.status === 'Shipped' ? 'Processing' : order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="mt-2 rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <OrderOtpVerify order={order} onVerified={load} />

              <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100 pt-3">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between py-2 text-sm text-gray-600">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{Math.round(item.price * item.quantity).toLocaleString('en-IN')}</span>
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
