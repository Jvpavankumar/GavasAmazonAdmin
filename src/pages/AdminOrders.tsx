import { useEffect, useState } from 'react';
import {
  CheckCircle,
  Download,
  FileText,
  Info,
  Mail,
  PackageCheck,
  Search,
} from 'lucide-react';
import { fetchAdminOrders, resendOrderOtp, updateOrderStatus, verifyOrderOtp, type AdminOrder } from '../api/admin';
import { ApiError } from '../api/client';
import Loader from '../components/Loader';
import OrderBill from '../components/OrderBill';
import { exportOrdersToExcel } from '../utils/exportOrdersExcel';

const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
const STATUS_OPTIONS = ['Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;

function statusBadgeClass(status: string, deliveryConfirmed: boolean) {
  if (status === 'Delivered' || deliveryConfirmed) {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (status === 'Cancelled') {
    return 'bg-red-100 text-red-800';
  }
  if (status === 'Shipped') {
    return 'bg-blue-100 text-blue-800';
  }
  return 'bg-amber-100 text-amber-800';
}

function OrderOtpVerify({
  order,
  active,
  onVerified,
}: {
  order: AdminOrder;
  active: boolean;
  onVerified: () => void;
}) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  if (order.deliveryConfirmed || order.status === 'Delivered') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
        <CheckCircle className="h-4 w-4 shrink-0" />
        Delivery confirmed — customer OTP verified
      </div>
    );
  }

  if (order.status === 'Cancelled') {
    return null;
  }

  if (!active) {
    return null;
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
        setResendMessage('Email could not be sent. Ask the customer to check their order confirmation or Your Orders page.');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend OTP email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-3">
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

function OrderDetailPanel({
  order,
  onVerified,
  onStatusChange,
}: {
  order: AdminOrder;
  onVerified: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [statusValue, setStatusValue] = useState(order.status);
  const [awaitingOtp, setAwaitingOtp] = useState(false);

  useEffect(() => {
    setStatusValue(order.status);
    setAwaitingOtp(false);
  }, [order.id, order.status, order.deliveryConfirmed]);

  const handleStatusSelect = (nextStatus: string) => {
    if (nextStatus === 'Delivered') {
      setStatusValue('Delivered');
      setAwaitingOtp(true);
      return;
    }

    setAwaitingOtp(false);
    setStatusValue(nextStatus);
    onStatusChange(order.id, nextStatus);
  };

  return (
    <div className="space-y-4 border-t border-gray-100 bg-gray-50/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 text-sm text-gray-600">
          <p><span className="font-medium text-gray-800">Date:</span> {new Date(order.date).toLocaleString()}</p>
          <p><span className="font-medium text-gray-800">Email:</span> {order.customer.email}</p>
          <p>
            <span className="font-medium text-gray-800">Address:</span>{' '}
            {[order.address.street, order.address.line, order.address.city, order.address.zip]
              .filter(Boolean)
              .join(', ')}
          </p>
          <p><span className="font-medium text-gray-800">Payment:</span> {order.paymentMethod}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {order.status === 'Delivered' || order.deliveryConfirmed ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              Delivered
            </span>
          ) : order.status === 'Cancelled' ? (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
              Cancelled
            </span>
          ) : (
            <select
              value={statusValue}
              onChange={(e) => handleStatusSelect(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
          <p className="text-xs text-gray-500">Subtotal</p>
          <p className="font-semibold text-gray-900">₹{order.subtotal.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
          <p className="text-xs text-gray-500">Delivery</p>
          <p className="font-semibold text-gray-900">₹{order.shipping.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
          <p className="text-xs text-gray-500">Total</p>
          <p className="font-semibold text-gray-900">₹{order.total.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between px-3 py-2.5 text-sm text-gray-600">
            <span>{item.name} × {item.quantity}</span>
            <span>₹{Math.round(item.price * item.quantity).toLocaleString('en-IN')}</span>
          </li>
        ))}
      </ul>

      <OrderOtpVerify
        order={order}
        active={awaitingOtp}
        onVerified={() => {
          setAwaitingOtp(false);
          onVerified();
        }}
      />
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
  const [billOrder, setBillOrder] = useState<AdminOrder | null>(null);
  const [exporting, setExporting] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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
    setExpandedOrderId(null);
    load({ status: '', q: '', dateFrom: '', dateTo: '' });
  };

  const hasFilters = Boolean(search || dateFrom || dateTo || statusFilter);

  const handleStatusChange = async (id: string, status: string) => {
    await updateOrderStatus(id, status);
    await load();
  };

  const handleExportExcel = () => {
    if (orders.length === 0) return;
    setExporting(true);
    try {
      exportOrdersToExcel(orders);
    } finally {
      setExporting(false);
    }
  };

  const toggleDetails = (orderId: string) => {
    setExpandedOrderId((current) => (current === orderId ? null : orderId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{orders.length} orders</p>
        </div>
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={loading || orders.length === 0 || exporting}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Download Excel'}
        </button>
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

      <div className="card overflow-hidden">
        {loading ? (
          <Loader fullPage label="Loading orders..." />
        ) : orders.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No orders found</div>
        ) : (
          <>
            <div className="hidden border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid md:grid-cols-[1.1fr_1.2fr_1fr_0.9fr_0.9fr_0.5fr_1fr] md:gap-3">
              <span>Order ID</span>
              <span>Name</span>
              <span>Mobile</span>
              <span>Amount</span>
              <span>Status</span>
              <span className="text-center">Bill</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const displayStatus = order.deliveryConfirmed ? 'Delivered' : order.status;

                return (
                  <div key={order.id}>
                    <div className="grid gap-3 px-4 py-4 md:grid-cols-[1.1fr_1.2fr_1fr_0.9fr_0.9fr_0.5fr_1fr] md:items-center md:gap-3">
                      <div>
                        <p className="text-xs text-gray-500 md:hidden">Order ID</p>
                        <p className="font-semibold text-gray-900">{order.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 md:hidden">Name</p>
                        <p className="text-sm text-gray-800">{order.customer.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 md:hidden">Mobile</p>
                        <p className="text-sm text-gray-700">
                          {order.address.phone ? `+91 ${order.address.phone}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 md:hidden">Amount</p>
                        <p className="font-semibold text-gray-900">
                          ₹{order.total.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 md:hidden">Status</p>
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(displayStatus, order.deliveryConfirmed)}`}
                        >
                          {displayStatus}
                        </span>
                      </div>
                      <div className="md:text-center">
                        <p className="text-xs text-gray-500 md:hidden">Bill</p>
                        <button
                          type="button"
                          onClick={() => setBillOrder(order)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-lavender-200 bg-lavender-50 text-lavender-800 transition hover:bg-lavender-100"
                          title="View bill"
                          aria-label="View bill"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="md:text-right">
                        <p className="text-xs text-gray-500 md:hidden">Action</p>
                        <button
                          type="button"
                          onClick={() => toggleDetails(order.id)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                            isExpanded
                              ? 'border-lavender-400 bg-lavender-100 text-lavender-900'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                          title={isExpanded ? 'Hide details' : 'View details'}
                          aria-label={isExpanded ? 'Hide details' : 'View details'}
                          aria-expanded={isExpanded}
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <OrderDetailPanel
                        order={order}
                        onVerified={load}
                        onStatusChange={handleStatusChange}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {billOrder && (
        <OrderBill order={billOrder} onClose={() => setBillOrder(null)} />
      )}
    </div>
  );
}
