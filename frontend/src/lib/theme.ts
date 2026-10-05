// Och/qorong'i rejim: tanlov bo'lmasa tizim sozlamasiga ergashadi
export type ThemeChoice = 'light' | 'dark' | null;
const KEY = 'hudud_theme';

export function getTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

export function applyTheme(t: ThemeChoice) {
  const r = document.documentElement;
  if (t) r.setAttribute('data-theme', t);
  else r.removeAttribute('data-theme');
  try {
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  } catch {
    /* maxfiy rejim: saqlanmaydi */
  }
  const dark = isDark();
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', dark ? 'dark' : 'light');
}

export function isDark(): boolean {
  const t = document.documentElement.getAttribute('data-theme');
  return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
}
