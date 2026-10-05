type Cell = string | number | boolean | null | undefined;

// Excel formulasi sifatida ochilmasligi uchun (=, +, -, @ bilan boshlanuvchi matn)
function escape(v: Cell): string {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Cell[][]): string {
  return rows.map((r) => r.map(escape).join(',')).join('\r\n');
}

// UTF-8 BOM bilan: Excel o'zbekcha harflarni to'g'ri ochadi
export function downloadCsv(filename: string, rows: Cell[][]) {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const abs = (u?: string | null) => (u ? new URL(u, location.origin).href : '');
export { abs as absoluteUrl };
