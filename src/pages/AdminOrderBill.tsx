import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { fetchAdminOrders, type AdminOrder } from '../api/admin';
import { downloadOrderBill } from '../utils/printOrderBill';
import OrderBill from '../components/OrderBill';
import Loader from '../components/Loader';

/** Full-page bill preview with print and PDF download (replaces the old popup). */
export default function AdminOrderBill() {
  const { id = '' } = useParams<{ id: string }>();
  const location = useLocation();
  // The orders list passes the order along; on a refresh or direct link we look it up by id.
  const passed = (location.state as { order?: AdminOrder } | null)?.order;
  const [order, setOrder] = useState<AdminOrder | null>(passed?.id === id ? passed : null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order) return;
    let cancelled = false;
    fetchAdminOrders({ q: id })
      .then((list) => {
        if (cancelled) return;
        const found = list.find((o) => o.id === id);
        if (found) setOrder(found);
        else setError('Order not found.');
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this order.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, order]);

  useEffect(() => {
    if (!order) return;
    const previous = document.title;
    // The page title becomes the default file name when saving as PDF from the print dialog.
    document.title = `GavasMart bill ${order.id}`;
    return () => {
      document.title = previous;
    };
  }, [order]);

  if (loading) return <Loader fullPage label="Loading bill..." />;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-lavender-700">
            <ArrowLeft className="h-4 w-4" /> Back to orders
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Bill preview</h1>
        </div>
        {order && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-lavender-700 px-4 py-2 text-sm font-medium text-white hover:bg-lavender-800"
            >
              <Printer className="h-4 w-4" /> Print bill
            </button>
            <button
              type="button"
              onClick={() => downloadOrderBill(order)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
        )}
      </div>

      {error || !order ? (
        <div className="card p-8 text-center text-sm text-gray-500">{error || 'Order not found.'}</div>
      ) : (
        <OrderBill order={order} />
      )}
    </div>
  );
}
