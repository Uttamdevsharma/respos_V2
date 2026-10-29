import { Order, Settings } from '../types';

// ─── Label helpers ────────────────────────────────────────────────────────────
const METHOD_LABELS: Record<string, string> = {
  cash:   'Hand Cash',
  card:   'Card / POS',
  mobile: 'bKash / MFS',
};
const label = (m: string) => METHOD_LABELS[m] ?? m.toUpperCase();
const fmt = (n: number | undefined, cur: string) =>
  `${cur}${(n ?? 0).toFixed(2)}`;

// ─── Build payment breakdown rows (split > partials > single) ─────────────────
function buildPaymentRows(order: Order, currency: string): {
  rows: { method: string; amount: number; note?: string }[];
  returnAmount: number;
  totalCollected: number;
} {
  const splitPayments = order.splitPayments || [];
  const partialPayments = order.partialPayments || [];

  let rows: { method: string; amount: number; note?: string }[] = [];

  if (splitPayments.length > 0) {
    // Split payment (multiple methods in one transaction)
    rows = splitPayments.map((s) => ({ method: s.paymentMethod, amount: s.amount, note: s.note }));
  } else if (partialPayments.length > 0 || (order.amountPaid ?? 0) > 0) {
    // Partial payments collected over time, plus a potential final payment
    rows = partialPayments.map((p) => ({ method: p.paymentMethod, amount: p.amount, note: p.note }));
    // If there's a final settlement on top of partials
    const partialSum = partialPayments.reduce((s, p) => s + p.amount, 0);
    const finalAmt = (order.paidAmount ?? 0);
    if (finalAmt > 0 && Math.abs(finalAmt - partialSum) > 0.01) {
      rows.push({ method: order.paymentMethod ?? 'cash', amount: finalAmt });
    }
  } else if (order.paymentMethod) {
    // Normal single payment
    rows = [{ method: order.paymentMethod, amount: order.paidAmount ?? order.grandTotal }];
  }

  const totalCollected = rows.reduce((s, r) => s + r.amount, 0);
  return { rows, returnAmount: order.returnAmount ?? 0, totalCollected };
}

// ─── HTML/Print Invoice ────────────────────────────────────────────────────────
export const printInvoice = (order: Order, settings: Settings) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  const currency  = settings.currency || '৳';
  const taxRate   = settings.taxRate ?? 15;
  const serviceRate = settings.serviceChargeRate ?? 5;

  const { rows, returnAmount, totalCollected } = buildPaymentRows(order, currency);
  const hasSplit   = (order.splitPayments  || []).length > 0;
  const hasPartial = (order.partialPayments || []).length > 0;

  // ── Payment breakdown HTML block ──
  const paymentBreakdownHtml = rows.length > 0 ? `
    <div class="divider"></div>
    <div class="section-label">PAYMENT BREAKDOWN</div>
    <table class="totals-table" style="margin-top:4px;">
      ${rows.map((r, i) => `
        <tr>
          <td style="padding-left:4px;">
            ${hasSplit || hasPartial ? `<span style="font-size:10px;color:#555;">#${i + 1}</span> ` : ''}
            ${label(r.method)}${r.note ? ` <span style="font-size:9px;color:#666;font-style:italic;">(${r.note})</span>` : ''}
          </td>
          <td class="text-right bold">${fmt(r.amount, currency)}</td>
        </tr>
      `).join('')}
      ${rows.length > 1 ? `
        <tr style="border-top:1px dashed #000;margin-top:4px;">
          <td class="bold" style="padding-top:4px;">Total Collected</td>
          <td class="text-right bold" style="padding-top:4px;">${fmt(totalCollected, currency)}</td>
        </tr>
      ` : ''}
      ${returnAmount > 0 ? `
        <tr>
          <td>Return / Change</td>
          <td class="text-right bold" style="color:#555;">${fmt(returnAmount, currency)}</td>
        </tr>
      ` : ''}
    </table>
  ` : '';

  const html = `
    <html>
      <head>
        <title>Invoice - ${order.token}</title>
        <style>
          @page { margin: 0; size: auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            padding: 10px;
            margin: 0;
            font-size: 12px;
            color: #000;
            background-color: #fff;
          }
          .text-center  { text-align: center; }
          .text-right   { text-align: right; }
          .bold         { font-weight: bold; }
          .divider      { border-top: 1px dashed #000; margin: 8px 0; }
          .section-label {
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 1px;
            color: #333;
            margin-bottom: 2px;
          }
          .header { margin-bottom: 12px; }
          .header h1 { font-size: 16px; margin: 0 0 4px 0; font-family: sans-serif; font-weight: 800; }
          .header p  { margin: 2px 0; font-size: 11px; }
          .meta-table   { width: 100%; margin-bottom: 8px; font-size: 11px; }
          .meta-table td { padding: 2px 0; }
          .items-table  { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .items-table th { border-bottom: 1px dashed #000; text-align: left; padding: 4px 0; font-size: 11px; }
          .items-table td { padding: 4px 0; vertical-align: top; }
          .totals-table { width: 100%; margin-top: 8px; }
          .totals-table td { padding: 2px 0; }
          .footer { margin-top: 20px; font-size: 11px; }
          .grand-row td { font-size: 13px; font-weight: bold; border-top: 1px dashed #000; padding-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <h1>${settings.restaurantName}</h1>
          <p>${settings.address}</p>
          <p>Phone: ${settings.phone}</p>
          <p class="bold" style="margin-top:6px;font-size:12px;">SALES RECEIPT</p>
        </div>

        <div class="divider"></div>

        <table class="meta-table">
          <tr>
            <td><strong>Token #:</strong> ${order.token}</td>
            <td class="text-right"><strong>Table:</strong> T-${((order.table as any)?.number || 0).toString().padStart(2, '0')}</td>
          </tr>
          <tr>
            <td><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</td>
            <td class="text-right"><strong>Time:</strong> ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
          <tr>
            <td><strong>Cashier:</strong> ${(order.waiter as any)?.name || 'System'}</td>
            <td class="text-right"><strong>Status:</strong> ${order.status.toUpperCase()}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width:50%;">Item</th>
              <th class="text-center" style="width:12%;">Qty</th>
              <th class="text-right"  style="width:18%;">Price</th>
              <th class="text-right"  style="width:20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>
                  ${item.name}
                  ${item.notes ? `<br/><span style="font-size:9px;font-style:italic;padding-left:5px;color:#444;">* ${item.notes}</span>` : ''}
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${item.price}</td>
                <td class="text-right">${item.price * item.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="section-label">BILL SUMMARY</div>
        <table class="totals-table" style="margin-top:4px;">
          <tr>
            <td>Subtotal</td>
            <td class="text-right">${fmt(order.subtotal, currency)}</td>
          </tr>
          ${order.discount > 0 ? `
            <tr>
              <td>Discount</td>
              <td class="text-right">-${fmt(order.discount, currency)}</td>
            </tr>
          ` : ''}
          <tr>
            <td>VAT (${taxRate}%)</td>
            <td class="text-right">${fmt(order.tax, currency)}</td>
          </tr>
          <tr>
            <td>Service Charge (${serviceRate}%)</td>
            <td class="text-right">${fmt(order.serviceCharge, currency)}</td>
          </tr>
          <tr class="grand-row">
            <td>Grand Total</td>
            <td class="text-right">${fmt(order.grandTotal, currency)}</td>
          </tr>
        </table>

        ${paymentBreakdownHtml}

        <div class="divider"></div>

        <div class="footer text-center">
          <p class="bold">Thank you for dining with us!</p>
          <p>Software Powered by GastroFlow POS</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.frameElement.remove(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();
};

// ─── TXT Download Invoice ─────────────────────────────────────────────────────
export const downloadTxtInvoice = (order: Order, settings: Settings) => {
  const line      = '========================================\n';
  const dashed    = '----------------------------------------\n';
  const currency  = settings.currency || '৳';
  const taxRate   = settings.taxRate ?? 15;
  const serviceRate = settings.serviceChargeRate ?? 5;

  const r = (n: number | undefined) => (n ?? 0).toFixed(2);

  let txt = '';
  txt += '        ' + settings.restaurantName.toUpperCase() + '\n';
  txt += '   ' + settings.address + '\n';
  txt += '        Phone: ' + settings.phone + '\n';
  txt += '             SALES RECEIPT\n';
  txt += line;
  txt += `Token #: ${order.token.padEnd(15)} Table: T-${((order.table as any)?.number || 0).toString().padStart(2, '0')}\n`;
  txt += `Date: ${new Date(order.createdAt).toLocaleDateString().padEnd(18)} Time: ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
  txt += `Cashier: ${((order.waiter as any)?.name || 'System').padEnd(16)} Status: ${order.status.toUpperCase()}\n`;
  txt += line;

  // Items
  txt += 'Item Name'.padEnd(20) + 'Qty'.padStart(4) + 'Price'.padStart(8) + 'Total'.padStart(8) + '\n';
  txt += dashed;
  order.items.forEach(item => {
    const name = item.name.length > 19 ? item.name.substring(0, 16) + '...' : item.name;
    txt += name.padEnd(20) +
      item.quantity.toString().padStart(4) +
      item.price.toString().padStart(8) +
      (item.price * item.quantity).toString().padStart(8) + '\n';
    if (item.notes) txt += `  * ${item.notes}\n`;
  });

  // Bill Summary
  txt += line;
  txt += '--- BILL SUMMARY ---\n';
  txt += 'Subtotal:'.padEnd(32)                           + `${currency}${r(order.subtotal)}`.padStart(8) + '\n';
  if (order.discount > 0) {
    txt += 'Discount:'.padEnd(32)                         + `-${currency}${r(order.discount)}`.padStart(8) + '\n';
  }
  txt += `VAT (${taxRate}%):`.padEnd(32)                  + `${currency}${r(order.tax)}`.padStart(8) + '\n';
  txt += `Service Charge (${serviceRate}%):`.padEnd(32)   + `${currency}${r(order.serviceCharge)}`.padStart(8) + '\n';
  txt += dashed;
  txt += 'Grand Total:'.padEnd(32)                        + `${currency}${r(order.grandTotal)}`.padStart(8) + '\n';

  // Payment Breakdown
  const { rows, returnAmount, totalCollected } = buildPaymentRows(order, currency);
  if (rows.length > 0) {
    txt += line;
    txt += '--- PAYMENT BREAKDOWN ---\n';
    rows.forEach((row, i) => {
      const rowLabel = rows.length > 1 ? `#${i + 1} ${label(row.method)}` : label(row.method);
      const notePart = row.note ? ` (${row.note})` : '';
      txt += (rowLabel + notePart + ':').padEnd(32) + `${currency}${r(row.amount)}`.padStart(8) + '\n';
    });
    if (rows.length > 1) {
      txt += dashed;
      txt += 'Total Collected:'.padEnd(32) + `${currency}${r(totalCollected)}`.padStart(8) + '\n';
    }
    if (returnAmount > 0) {
      txt += 'Return / Change:'.padEnd(32) + `${currency}${r(returnAmount)}`.padStart(8) + '\n';
    }
  }

  txt += line;
  txt += '        Thank you for dining with us!\n';
  txt += '        Powered by GastroFlow POS\n';

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `Invoice-${order.token}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─── Pay-First dual slip print ────────────────────────────────────────────────
// Prints TWO slips in ONE print job:
//   Slip 1 (top)    → Token Slip  — customer submits to counter
//   Slip 2 (bottom) → Pay Slip   — full itemised bill, customer keeps
export const printPayFirstSlips = (
  order: {
    token: string;
    table?: any;
    waiter?: any;
    createdAt?: string;
    items: Array<{ name: string; price: number; quantity: number; notes?: string }>;
    subtotal: number;
    tax: number;
    serviceCharge: number;
    grandTotal: number;
    paymentMode?: string;
    status?: string;
  },
  settings: Settings
) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  const cur = settings.currency || '৳';
  const f   = (n: number) => `${cur}${n.toFixed(2)}`;
  const now = order.createdAt ? new Date(order.createdAt) : new Date();
  const dateStr = now.toLocaleDateString('en-GB');
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const tableNo = ((order.table as any)?.number || 0).toString().padStart(2, '0');
  const waiterName = (order.waiter as any)?.name || 'Staff';

  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:3px 0;">
        ${item.name}
        ${item.notes ? `<br/><span style="font-size:9px;font-style:italic;color:#555;">* ${item.notes}</span>` : ''}
      </td>
      <td style="text-align:center;padding:3px 0;">${item.quantity}</td>
      <td style="text-align:right;padding:3px 0;">${f(item.price)}</td>
      <td style="text-align:right;padding:3px 0;font-weight:bold;">${f(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const html = `
<html>
<head>
  <title>Pay-First Slips — ${order.token}</title>
  <style>
    @page { margin: 4mm 2mm; size: 80mm auto; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 76mm;
      margin: 0;
      padding: 0;
      font-size: 11px;
      color: #000;
      background: #fff;
    }

    /* ── shared ── */
    .slip       { width: 100%; padding: 8px 6px; }
    .center     { text-align: center; }
    .right      { text-align: right; }
    .bold       { font-weight: bold; }
    .dash       { border-top: 1px dashed #000; margin: 6px 0; }
    .cut        { border-top: 2px dashed #555; margin: 6px 0; text-align:center; font-size:9px; color:#555; letter-spacing:1px; padding-top:3px; }
    .lbl        { font-size: 9px; font-weight: bold; letter-spacing: 1px; color: #444; }
    table       { width: 100%; border-collapse: collapse; }
    td          { vertical-align: top; }

    /* ── TOKEN SLIP (slip 1) ── */
    .token-slip .restaurant { font-size: 15px; font-weight: 900; font-family: sans-serif; margin: 0 0 2px 0; }
    .token-box {
      border: 3px solid #000;
      border-radius: 6px;
      padding: 8px 4px;
      margin: 8px 0;
      text-align: center;
    }
    .token-box .token-label { font-size: 10px; font-weight: bold; letter-spacing: 2px; color: #444; }
    .token-box .token-value { font-size: 36px; font-weight: 900; font-family: sans-serif; line-height: 1.1; }
    .token-box .table-label { font-size: 13px; font-weight: bold; margin-top: 4px; }
    .submit-note { font-size: 10px; font-style: italic; color: #555; margin: 4px 0 0 0; }

    /* ── PAY SLIP (slip 2) ── */
    .pay-slip .restaurant { font-size: 14px; font-weight: 900; font-family: sans-serif; margin: 0 0 2px 0; }
    .items-table th { border-bottom: 1px dashed #000; padding: 3px 0; font-size: 10px; font-weight: bold; }
    .totals td      { padding: 2px 0; }
    .grand td       { font-size: 13px; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; }
    .amount-box {
      border: 2px dashed #000;
      border-radius: 4px;
      padding: 6px 8px;
      margin: 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- ══════════════════════════════════════════════════
       SLIP 1: TOKEN SLIP  (customer submits to counter)
  ══════════════════════════════════════════════════════ -->
  <div class="slip token-slip">
    <div class="center">
      <p class="restaurant">${settings.restaurantName}</p>
      <p style="margin:0;font-size:10px;">${settings.address}</p>
    </div>

    <div class="dash"></div>

    <div class="center lbl" style="margin-bottom:2px;">TOKEN SLIP — SUBMIT TO COUNTER</div>

    <div class="token-box">
      <div class="token-label">ORDER TOKEN</div>
      <div class="token-value">${order.token}</div>
      <div class="table-label">Table T-${tableNo}</div>
    </div>

    <table style="font-size:10px;margin-bottom:4px;">
      <tr>
        <td><span class="bold">Date:</span> ${dateStr}</td>
        <td class="right"><span class="bold">Time:</span> ${timeStr}</td>
      </tr>
      <tr>
        <td><span class="bold">Staff:</span> ${waiterName}</td>
        <td class="right"><span class="bold">Items:</span> ${order.items.reduce((s, i) => s + i.quantity, 0)}</td>
      </tr>
    </table>

    <div class="amount-box">
      <span class="bold" style="font-size:11px;">AMOUNT PAID:</span>
      <span class="bold" style="font-size:16px;">${f(order.grandTotal)}</span>
    </div>

    <p class="submit-note center">★ Paid at Counter & Order Confirmed ★</p>
    <p class="submit-note center">Payment Mode: PAY FIRST</p>
  </div>

  <!-- CUT LINE -->
  <div class="cut">✂ ─────── CUT HERE — KEEP BELOW ─────── ✂</div>

  <!-- ══════════════════════════════════════════════════
       SLIP 2: PAY SLIP  (customer keeps this)
  ══════════════════════════════════════════════════════ -->
  <div class="slip pay-slip">
    <div class="center">
      <p class="restaurant">${settings.restaurantName}</p>
      <p style="margin:2px 0;font-size:10px;">${settings.address}</p>
      <p style="margin:2px 0;font-size:10px;">Ph: ${settings.phone}</p>
      <p style="margin:6px 0 2px 0;font-size:11px;font-weight:bold;">PAY SLIP</p>
    </div>

    <div class="dash"></div>

    <table style="font-size:10px;">
      <tr>
        <td><span class="bold">Token:</span> ${order.token}</td>
        <td class="right"><span class="bold">Table:</span> T-${tableNo}</td>
      </tr>
      <tr>
        <td><span class="bold">Date:</span> ${dateStr}</td>
        <td class="right"><span class="bold">Time:</span> ${timeStr}</td>
      </tr>
      <tr>
        <td colspan="2"><span class="bold">Staff:</span> ${waiterName}</td>
      </tr>
    </table>

    <div class="dash"></div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width:46%;">Item</th>
          <th style="text-align:center;width:12%;">Qty</th>
          <th style="text-align:right;width:20%;">Rate</th>
          <th style="text-align:right;width:22%;">Amt</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="dash"></div>

    <table class="totals" style="font-size:11px;">
      <tr><td>Subtotal</td><td class="right">${f(order.subtotal)}</td></tr>
      <tr><td>VAT (${settings.taxRate ?? 15}%)</td><td class="right">${f(order.tax)}</td></tr>
      <tr><td>Service (${settings.serviceChargeRate ?? 5}%)</td><td class="right">${f(order.serviceCharge)}</td></tr>
    </table>
    <table class="grand" style="margin-top:2px;">
      <tr><td>GRAND TOTAL</td><td class="right">${f(order.grandTotal)}</td></tr>
    </table>

    <div style="border: 2px dashed #000;border-radius:4px;padding:5px 8px;margin:8px 0;font-size:10px;">
      <span class="bold">Payment Mode:</span> PAY FIRST &nbsp;|&nbsp;
      <span class="bold">Status:</span> PAID (${(order as any).paymentMethod ? (order as any).paymentMethod.toUpperCase() : 'CONFIRMED'})
    </div>

    <div class="dash"></div>
    <p class="center" style="font-size:10px;font-weight:bold;">Thank you for dining with us!</p>
    <p class="center" style="font-size:9px;color:#666;">Powered by GastroFlow POS</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { if(window.frameElement) window.frameElement.remove(); }, 800);
    };
  </script>
</body>
</html>
  `;

  doc.open();
  doc.write(html);
  doc.close();
};
