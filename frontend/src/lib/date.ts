export function ymd(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const daysAgo = (n: number) => ymd(new Date(Date.now() - n * 86400000));

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
export const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

/** "5-oktabr" */
export const uzDate = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d.length === 10 ? `${d}T00:00:00` : d) : d;
  return `${x.getDate()}-${MONTHS[x.getMonth()]}`;
};
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });

/** "Bugun", "Kecha" yoki "3-oktabr" */
export function dayLabel(iso: string): string {
  const key = ymd(new Date(iso));
  if (key === ymd()) return 'Bugun';
  if (key === daysAgo(1)) return 'Kecha';
  return uzDate(new Date(iso));
}

/** Ro'yxatni kun bo'yicha guruhlaydi (tartib saqlanadi) */
export function groupByDay<T>(items: T[], pick: (t: T) => string): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const it of items) {
    const label = dayLabel(pick(it));
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(it);
    else groups.push({ label, items: [it] });
  }
  return groups;
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
