import { createPortal } from 'react-dom';
import { Download, Printer, X } from 'lucide-react';
import type { AdminOrder } from '../api/admin';
import { downloadOrderBill, printOrderBill } from '../utils/printOrderBill';

function formatInr(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function formatBillDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderBill({
  order,
  onClose,
}: {
  order: AdminOrder;
  onClose: () => void;
}) {
  const handlePrint = () => {
    printOrderBill(order);
  };

  const handleDownload = () => {
    downloadOrderBill(order);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-6">
      <button
        type="button"
        className="fixed inset-0 cursor-default"
        aria-label="Close bill"
        onClick={onClose}
      />

      <div className="relative z-[201] my-4 w-full max-w-2xl">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-lavender-700 px-4 py-2 text-sm font-medium text-white hover:bg-lavender-800"
          >
            <Printer className="h-4 w-4" />
            Print bill
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-elevated sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-6">
            <div>
              <p className="text-2xl font-bold text-lavender-800">GavasMart</p>
              <p className="mt-1 text-sm text-gray-500">Tax Invoice / Bill</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Bill No: {order.id}</p>
              <p>Date: {formatBillDate(order.date)}</p>
              <p>Status: {order.status}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bill to</p>
              <p className="mt-2 font-semibold text-gray-900">{order.customer.name}</p>
              <p className="text-sm text-gray-600">{order.customer.email}</p>
              {order.address.phone && (
                <p className="text-sm text-gray-600">+91 {order.address.phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ship to</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {order.address.street && <span className="block">{order.address.street}</span>}
                {order.address.line && <span className="block">{order.address.line}</span>}
                <span className="block">
                  {order.address.city}{order.address.zip ? `, ${order.address.zip}` : ''}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                      No items in this order
                    </td>
                  </tr>
                ) : (
                  order.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="px-3 py-3 text-gray-900">
                        <p className="font-medium">{item.name}</p>
                        {(item.brand || item.category) && (
                          <p className="text-xs text-gray-500">
                            {[item.brand, item.category].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-3 text-right text-gray-700">{formatInr(item.price)}</td>
                      <td className="px-3 py-3 text-right font-medium text-gray-900">
                        {formatInr(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatInr(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? 'FREE' : formatInr(order.shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                <span>Grand Total</span>
                <span>{formatInr(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-4 text-sm text-gray-600">
            <p><span className="font-medium text-gray-800">Payment:</span> {order.paymentMethod}</p>
            <p className="mt-4 text-xs text-gray-400">
              This is a computer-generated bill from GavasMart Admin.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
