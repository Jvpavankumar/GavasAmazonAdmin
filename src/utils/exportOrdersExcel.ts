import * as XLSX from 'xlsx';
import type { AdminOrder } from '../api/admin';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN');
}

function formatAddress(order: AdminOrder) {
  const parts = [
    order.address.street,
    order.address.line,
    order.address.city,
    order.address.zip,
  ].filter(Boolean);
  return parts.join(', ');
}

export function exportOrdersToExcel(orders: AdminOrder[], filename?: string) {
  const orderRows = orders.map((order) => ({
    'Order ID': order.id,
    'Order Date': formatDate(order.date),
    Status: order.status,
    'Delivery Confirmed': order.deliveryConfirmed ? 'Yes' : 'No',
    'Customer Name': order.customer.name,
    Email: order.customer.email,
    Phone: order.address.phone ? `+91 ${order.address.phone}` : '',
    Street: order.address.street,
    'Address Line': order.address.line,
    City: order.address.city,
    'ZIP Code': order.address.zip,
    'Full Address': formatAddress(order),
    'Payment Method': order.paymentMethod,
    Subtotal: order.subtotal,
    Shipping: order.shipping,
    Total: order.total,
    'Items Count': order.items.length,
    'Items Summary': order.items.map((item) => `${item.name} x${item.quantity}`).join('; '),
  }));

  const itemRows = orders.flatMap((order) =>
    order.items.map((item) => ({
      'Order ID': order.id,
      'Order Date': formatDate(order.date),
      Status: order.status,
      'Customer Name': order.customer.name,
      Email: order.customer.email,
      Phone: order.address.phone ? `+91 ${order.address.phone}` : '',
      'Product Name': item.name,
      Brand: item.brand ?? '',
      Category: item.category ?? '',
      Quantity: item.quantity,
      'Unit Price': item.price,
      'Line Total': Math.round(item.price * item.quantity),
      'Order Subtotal': order.subtotal,
      Shipping: order.shipping,
      'Order Total': order.total,
      'Payment Method': order.paymentMethod,
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(orderRows), 'Orders');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(itemRows), 'Order Items');

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, filename ?? `gavasmart-orders-${stamp}.xlsx`);
}
