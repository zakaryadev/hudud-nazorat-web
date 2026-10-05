export function ymd(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const daysAgo = (n: number) => ymd(new Date(Date.now() - n * 86400000));
