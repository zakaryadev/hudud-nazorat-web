// Kun chegaralari server vaqt zonasida (TZ env, standart Asia/Tashkent) hisoblanadi
export function today(): string {
  return ymd(new Date());
}

export function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 'YYYY-MM-DD' kunining [boshi, ertasi boshi) oralig'i
export function dayRange(date: string): { start: Date; end: Date } {
  const [y, m, d] = date.split('-').map(Number);
  return { start: new Date(y, m - 1, d), end: new Date(y, m - 1, d + 1) };
}

export type DayStatus = 'INSIDE' | 'OUTSIDE_ONLY' | 'NONE';

// Kunlik holat: kamida bitta withinZone=true bo'lsa INSIDE (TZ 5-bo'lim)
export function dayStatus(rows: { withinZone: boolean }[]): DayStatus {
  if (!rows.length) return 'NONE';
  return rows.some((r) => r.withinZone) ? 'INSIDE' : 'OUTSIDE_ONLY';
}
