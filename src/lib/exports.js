import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '@/lib/utils';

export function exportLedgerCSV(entries, filename = 'ledger.csv') {
  const header = ['Type', 'Date', 'Time', 'Amount', 'Notes'];
  const rows = entries.map((e) => [e.type, formatDate(e.date), e.time, e.amount.toFixed(2), (e.notes ?? '').replace(/,/g, ';')]);
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function exportLedgerExcel(entries, filename = 'ledger.xlsx') {
  const data = entries.map((e) => ({
    Type: e.type,
    Date: formatDate(e.date),
    Time: e.time,
    Amount: e.amount,
    Details: e.meta,
    Notes: e.notes ?? ''
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ledger');
  XLSX.writeFile(wb, filename);
}

// jsPDF's built-in fonts (Helvetica/Times/Courier) only support the WinAnsi
// character set, which does NOT include the ₹ (Rupee) glyph — it silently
// drops or mangles it, which is why amounts looked unclear/missing in the
// downloaded PDF. For PDF output specifically we format with a plain-text
// "Rs." prefix instead of the ₹ symbol, so every amount renders reliably.
function formatAmountForPDF(amount, currency) {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const grouped = new Intl.NumberFormat(locale, {
    minimumFractionDigits: Math.abs(amount) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
  const prefix = currency === 'INR' ? 'Rs. ' : `${currency} `;
  return `${amount < 0 ? '-' : ''}${prefix}${grouped}`;
}

export function exportLedgerPDF(entries, title, currency, filename = 'ledger.pdf') {
  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 107, 92);
  doc.text('Salahudeen Family Support', 14, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(title, 14, 25);

  autoTable(doc, {
    startY: 31,
    head: [['Type', 'Date', 'Time', 'Details', 'Amount', 'Notes']],
    body: entries.map((e) => [e.type, formatDate(e.date), e.time, e.meta, formatAmountForPDF(e.amount, currency), e.notes ?? '']),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: 'middle',
      lineColor: [228, 225, 214],
      lineWidth: 0.2,
      textColor: [28, 37, 33]
    },
    headStyles: {
      fillColor: [15, 107, 92],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9.5
    },
    alternateRowStyles: { fillColor: [246, 248, 247] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: 15 },
      3: { cellWidth: 45 },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [15, 107, 92] },
      5: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14 }
  });

  const totalCollected = entries.filter((e) => e.type === 'Collection').reduce((s, e) => s + e.amount, 0);
  const totalTransferred = entries.filter((e) => e.type === 'Transfer').reduce((s, e) => s + e.amount, 0);
  const balance = totalCollected - totalTransferred;
  const finalY = doc.lastAutoTable.finalY || 30;

  doc.setDrawColor(228, 225, 214);
  doc.line(14, finalY + 6, doc.internal.pageSize.getWidth() - 14, finalY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(74, 87, 81);
  doc.text('Total Collected:', 14, finalY + 15);
  doc.text('Total Transferred:', 14, finalY + 22);
  doc.setFont('helvetica', 'bold');
  doc.text('Balance:', 14, finalY + 29);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 107, 92);
  doc.text(formatAmountForPDF(totalCollected, currency), 70, finalY + 15);
  doc.setTextColor(198, 138, 6);
  doc.text(formatAmountForPDF(totalTransferred, currency), 70, finalY + 22);
  doc.setTextColor(balance >= 0 ? 15 : 200, balance >= 0 ? 107 : 40, balance >= 0 ? 92 : 40);
  doc.text(formatAmountForPDF(balance, currency), 70, finalY + 29);

  doc.save(filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
