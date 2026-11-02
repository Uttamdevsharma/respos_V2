import { QuotationColumn, SoftwareRow, HardwareRow } from '../types';

export const DEFAULT_SOFTWARE_COLUMNS: QuotationColumn[] = [
  { key: 'sl', label: 'SL', width: '8%' },
  { key: 'scope', label: 'SCOPE OF WORK / MODULE', width: '32%' },
  { key: 'particulars', label: 'TECHNICAL PARTICULARS & RESTAURANT FEATURES', width: '60%' },
];

export const DEFAULT_HARDWARE_COLUMNS: QuotationColumn[] = [
  { key: 'sl', label: 'SL', width: '8%' },
  { key: 'product', label: 'RESTAURANT HARDWARE ITEM', width: '32%' },
  { key: 'specifications', label: 'TECHNICAL SPECIFICATIONS', width: '45%' },
  { key: 'amount', label: 'AMOUNT (BDT)', width: '15%' },
];

// Restaurant software modules scope
export const DEFAULT_SOFTWARE_ROWS: SoftwareRow[] = [
  {
    sl: 1,
    scope: 'Restaurant POS & Dine-in Billing',
    particulars:
      'Interactive Table Layout management, split-billing, instant Kitchen Order Ticket (KOT) generation, takeaway and delivery billing with parcel charges',
  },
  {
    sl: 2,
    scope: 'Kitchen Display System (KDS)',
    particulars:
      'Real-time kitchen order screen, prep timer, bump bar support, item preparation status alert, and food station routing (Grill, Drinks, Bakery)',
  },
  {
    sl: 3,
    scope: 'Recipe Management & Raw Ingredient Inventory',
    particulars:
      'BOM (Bill of Materials) recipe auto-deduction on food sales, real-time raw stock alerts (meat, spices, dairy), wastage tracking and supplier purchase order',
  },
  {
    sl: 4,
    scope: 'QR Code Contactless Menu & Ordering',
    particulars:
      'Self-ordering QR menu on dining tables, live customer ordering sync to POS, digital photo menu with chef special recommendations',
  },
  {
    sl: 5,
    scope: 'Captain & Waiter Mobile Ordering App',
    particulars:
      'Waiters take orders directly on Android/iOS phones at tables, instant digital KOT push to kitchen and cashier without physical movement',
  },
  {
    sl: 6,
    scope: 'Multi-Outlet & Central Commissary Control',
    particulars:
      'Central Super Admin control, inter-branch raw material transfer, central recipe sync, and consolidated financial sales reports',
  },
  {
    sl: 7,
    scope: 'Accounts, VAT/SD & Daily Shift Reconciliation',
    particulars:
      'Bangladesh NBR compliant VAT & Supplementary Duty (SD), cash register closing report, expense vouchers, and daily P&L analytics',
  },
];

// Restaurant POS Hardware
export const DEFAULT_HARDWARE_ROWS: HardwareRow[] = [
  {
    sl: 1,
    product: 'POS Thermal Bill Printer (80mm Auto-Cutter)',
    specifications: 'High-speed 250mm/s thermal printer with USB + LAN interface for cash counter',
    amount: 7500,
  },
  {
    sl: 2,
    product: 'Kitchen KOT Impact/Thermal Printer (Buzzer Alert)',
    specifications: 'Splash-proof oil-resistant thermal printer with high-decibel audible buzzer for kitchen orders',
    amount: 8500,
  },
  {
    sl: 3,
    product: 'Heavy-Duty Cash Drawer (Steel Construction)',
    specifications: '5 bill / 8 coin slots with RJ11 auto kick-out interface paired with billing printer',
    amount: 4800,
  },
  {
    sl: 4,
    product: '10.1" Android KDS Touch Terminal / Kitchen Tablet',
    specifications: 'High-durability IPS display with wall-mount bracket for Chef station order management',
    amount: 14500,
  },
];

export const DEFAULT_RESTAURANT_TERMS_AND_CONDITIONS = `
<h3>Implementation & Restaurant Go-Live Stages</h3>
<p><strong>Stage 1: Menu Indexing & Kitchen Station Setup</strong><br/>Digital menu import, item modifiers/add-ons configuration, recipe ingredient linking and table layout design.</p>
<p><strong>Stage 2: Hardware Pairing & KDS Network Setup</strong><br/>KOT printer IP setup, cash drawer calibration, waiter handheld device sync and local offline-failover setup.</p>
<p><strong>Stage 3: Staff Training & Dry-Run Launch</strong><br/>Hands-on training for Cashiers, Waiters, Captains and Kitchen Chefs followed by official restaurant go-live.</p>
<h3>Terms & Conditions:</h3>
<ol>
  <li>This official quotation is valid for 15 days from date of issuance.</li>
  <li>To commence onboarding, a 50% advance payment is required, remaining 50% upon successful live billing handover.</li>
  <li>Monthly SaaS subscription starts from the date of go-live and includes 24/7 server uptime, automated cloud backup & hotline support.</li>
  <li>Hardware components carry a 1-year standard replacement warranty.</li>
</ol>
`.trim();

// Convert number to Bangladeshi Taka words
export function convertNumberToWords(amount: number): string {
  if (!amount || amount === 0) return 'Zero';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(num: number): string {
    let result = '';
    if (num >= 100) {
      result += singleDigits[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 10 && num <= 19) {
      result += teens[num - 10] + ' ';
    } else if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      if (num % 10 > 0) {
        result += singleDigits[num % 10] + ' ';
      }
    } else if (num > 0) {
      result += singleDigits[num] + ' ';
    }
    return result.trim();
  }

  let crore = Math.floor(amount / 10000000);
  amount %= 10000000;
  let lakh = Math.floor(amount / 100000);
  amount %= 100000;
  let thousand = Math.floor(amount / 1000);
  amount %= 1000;
  let hundred = Math.floor(amount / 100);
  let rem = amount % 100;

  let words = '';
  if (crore > 0) words += convertGroup(crore) + ' Crore ';
  if (lakh > 0) words += convertGroup(lakh) + ' Lakh ';
  if (thousand > 0) words += convertGroup(thousand) + ' Thousand ';
  if (hundred > 0) words += singleDigits[hundred] + ' Hundred ';
  if (rem > 0) {
    if (words !== '') words += 'and ';
    words += convertGroup(rem);
  }

  return words.trim();
}

