import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AdminOrder } from '../api/admin';

function formatInr(amount: number) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

function formatInrPdf(amount: number) {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function buildBillHtml(order: AdminOrder) {
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td>
            <div class="product-name">${escapeHtml(item.name)}</div>
            ${
              item.brand || item.category
                ? `<div class="product-meta">${escapeHtml([item.brand, item.category].filter(Boolean).join(' · '))}</div>`
                : ''
            }
          </td>
          <td class="center">${item.quantity}</td>
          <td class="right">${escapeHtml(formatInr(item.price))}</td>
          <td class="right strong">${escapeHtml(formatInr(item.price * item.quantity))}</td>
        </tr>`,
    )
    .join('');

  const shipTo = [
    order.address.street,
    order.address.line,
    `${order.address.city}${order.address.zip ? `, ${order.address.zip}` : ''}`,
  ]
    .filter(Boolean)
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>GavasMart Bill ${escapeHtml(order.id)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        font-family: Arial, Helvetica, sans-serif;
        color: #111827;
        background: #fff;
      }
      .bill { max-width: 760px; margin: 0 auto; }
      .header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 20px;
      }
      .brand { font-size: 28px; font-weight: 700; color: #553a7d; margin: 0; }
      .subtitle { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
      .meta { text-align: right; font-size: 14px; color: #4b5563; }
      .meta strong { color: #111827; }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-top: 24px;
      }
      .label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6b7280;
        margin: 0 0 8px;
      }
      .name { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
      .text { font-size: 14px; color: #4b5563; margin: 0; line-height: 1.5; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 28px;
        font-size: 14px;
      }
      th, td {
        padding: 10px 8px;
        border-bottom: 1px solid #f3f4f6;
        vertical-align: top;
      }
      th {
        text-align: left;
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #6b7280;
        background: #f9fafb;
      }
      .center { text-align: center; }
      .right { text-align: right; }
      .strong { font-weight: 700; color: #111827; }
      .product-name { font-weight: 600; }
      .product-meta { font-size: 12px; color: #6b7280; margin-top: 2px; }
      .totals {
        margin-top: 24px;
        margin-left: auto;
        width: 280px;
        font-size: 14px;
      }
      .totals-row {
        display: flex;
        justify-content: space-between;
        margin: 6px 0;
        color: #4b5563;
      }
      .grand-total {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e5e7eb;
        font-size: 18px;
        font-weight: 700;
        color: #111827;
      }
      .footer {
        margin-top: 28px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
        font-size: 14px;
        color: #4b5563;
      }
      .note { margin-top: 16px; font-size: 12px; color: #9ca3af; }
      @media print {
        body { padding: 0; }
        .bill { max-width: none; }
      }
    </style>
  </head>
  <body>
    <div class="bill">
      <div class="header">
        <div>
          <h1 class="brand">GavasMart</h1>
          <p class="subtitle">Tax Invoice / Bill</p>
        </div>
        <div class="meta">
          <div><strong>Bill No:</strong> ${escapeHtml(order.id)}</div>
          <div><strong>Date:</strong> ${escapeHtml(formatBillDate(order.date))}</div>
          <div><strong>Status:</strong> ${escapeHtml(order.status)}</div>
        </div>
      </div>
      <div class="grid">
        <div>
          <p class="label">Bill to</p>
          <p class="name">${escapeHtml(order.customer.name)}</p>
          <p class="text">${escapeHtml(order.customer.email)}</p>
          ${order.address.phone ? `<p class="text">+91 ${escapeHtml(order.address.phone)}</p>` : ''}
        </div>
        <div>
          <p class="label">Ship to</p>
          <div class="text">${shipTo}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th class="center">Qty</th>
            <th class="right">Rate</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>${escapeHtml(formatInr(order.subtotal))}</span></div>
        <div class="totals-row"><span>Shipping</span><span>${order.shipping === 0 ? 'FREE' : escapeHtml(formatInr(order.shipping))}</span></div>
        <div class="grand-total"><span>Grand Total</span><span>${escapeHtml(formatInr(order.total))}</span></div>
      </div>
      <div class="footer">
        <div><strong>Payment:</strong> ${escapeHtml(order.paymentMethod)}</div>
        <div class="note">This is a computer-generated bill from GavasMart Admin.</div>
      </div>
    </div>
  </body>
</html>`;
}

function openBillPreview(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const previewWindow = window.open(url, '_blank');

  if (!previewWindow) {
    URL.revokeObjectURL(url);
    window.alert('Please allow pop-ups to open the bill.');
    return null;
  }

  previewWindow.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
  return previewWindow;
}

export function printOrderBill(order: AdminOrder) {
  const html = buildBillHtml(order);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Print bill');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = frameWindow?.document;

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  if (!frameWindow || !frameDoc) {
    cleanup();
    const preview = openBillPreview(html);
    preview?.addEventListener('load', () => window.setTimeout(() => preview.print(), 400), { once: true });
    return;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  window.setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
    frameWindow.onafterprint = cleanup;
    window.setTimeout(cleanup, 3000);
  }, 400);
}

export function billPdfFilename(orderId: string) {
  return `GA-${orderId}.pdf`;
}

function buildOrderBillPdf(order: AdminOrder) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(85, 58, 125);
  doc.text('GavasMart', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Tax Invoice / Bill', margin, y + 18);

  const rightX = pageWidth - margin;
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.text(`Bill No: ${order.id}`, rightX, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${formatBillDate(order.date)}`, rightX, y + 14, { align: 'right' });
  doc.text(`Status: ${order.status}`, rightX, y + 28, { align: 'right' });

  y += 58;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('BILL TO', margin, y);
  doc.text('SHIP TO', margin + 250, y);
  y += 14;

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.text(order.customer.name, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customer.email, margin, y + 14);
  if (order.address.phone) {
    doc.text(`+91 ${order.address.phone}`, margin, y + 28);
  }

  const shipTo = [
    order.address.street,
    order.address.line,
    `${order.address.city}${order.address.zip ? `, ${order.address.zip}` : ''}`,
  ].filter(Boolean);

  shipTo.forEach((line, index) => {
    doc.text(line, margin + 250, y + index * 14);
  });

  const tableStartY = y + Math.max(42, shipTo.length * 14 + 10);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Product', 'Qty', 'Rate', 'Amount']],
    body: order.items.length
      ? order.items.map((item) => [
          item.brand || item.category
            ? `${item.name}\n${[item.brand, item.category].filter(Boolean).join(' · ')}`
            : item.name,
          String(item.quantity),
          formatInrPdf(item.price),
          formatInrPdf(item.price * item.quantity),
        ])
      : [['No items', '-', '-', '-']],
    styles: { fontSize: 9, cellPadding: 6, textColor: [17, 24, 39] },
    headStyles: {
      fillColor: [249, 250, 251],
      textColor: [107, 114, 128],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 240 },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'right', cellWidth: 80 },
      3: { halign: 'right', cellWidth: 90 },
    },
    theme: 'grid',
    margin: { left: margin, right: margin },
  });

  const tableEndY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  const totalsX = pageWidth - margin - 180;

  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text('Subtotal', totalsX, tableEndY);
  doc.text(formatInrPdf(order.subtotal), rightX, tableEndY, { align: 'right' });
  doc.text('Shipping', totalsX, tableEndY + 16);
  doc.text(
    order.shipping === 0 ? 'FREE' : formatInrPdf(order.shipping),
    rightX,
    tableEndY + 16,
    { align: 'right' },
  );

  doc.setDrawColor(229, 231, 235);
  doc.line(totalsX, tableEndY + 24, rightX, tableEndY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text('Grand Total', totalsX, tableEndY + 42);
  doc.text(formatInrPdf(order.total), rightX, tableEndY + 42, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Payment: ${order.paymentMethod}`, margin, tableEndY + 70);

  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('This is a computer-generated bill from GavasMart Admin.', margin, tableEndY + 88);

  return doc;
}

export function downloadOrderBill(order: AdminOrder) {
  buildOrderBillPdf(order).save(billPdfFilename(order.id));
}
