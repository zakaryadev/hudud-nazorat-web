import { ReactNode, useEffect, useId, useMemo, useState } from 'react';
import Icon, { IconName } from './Icon';
import { Avatar, EmptyState } from './ui';
import { LoadError } from './Parts';
import { User } from '../lib/api';

/* ---------- Qobiq: yon menyu + yuqori satr ---------- */
export interface AdminNavItem { key: string; icon: IconName; label: string }

export function AdminShell({ nav, active, onSelect, user, onProfile, onLogout, children }: {
  nav: AdminNavItem[]; active: string; onSelect: (k: string) => void; user: User; onProfile: () => void; onLogout: () => void; children: ReactNode;
}) {
  const wide = () => window.matchMedia('(min-width: 900px)').matches;
  const [open, setOpen] = useState(wide);
  const [menu, setMenu] = useState(false);
  const pick = (k: string) => { onSelect(k); if (!wide()) setOpen(false); };

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menu]);

  return (
    <div className={`adm ${open ? 'side-open' : ''}`}>
      <aside className="adm-side" aria-label="Asosiy menyu">
        <div className="adm-brand">
          <div className="adm-logo"><Icon name="pin" /></div>
          <strong>HUDUD NAZORAT</strong>
          <span>Administrator kabineti</span>
        </div>
        <nav>
          {nav.map((n) => (
            <button key={n.key} className={`sl ${active === n.key ? 'on' : ''}`} onClick={() => pick(n.key)} aria-current={active === n.key ? 'page' : undefined}>
              <Icon name={n.icon} />{n.label}
            </button>
          ))}
        </nav>
      </aside>
      {open && <div className="adm-scrim" onClick={() => setOpen(false)} />}
      <div className="adm-body">
        <header className="adm-head">
          <button className="ib sl" onClick={() => setOpen((o) => !o)} aria-label="Menyuni ochish/yopish"><Icon name="menu" /></button>
          <div className="adm-user" onClick={(e) => e.stopPropagation()}>
            <button className="sl" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
              <Avatar text={user.fullName} size={28} />
              <span>{user.fullName}</span>
              <Icon name="expand" />
            </button>
            {menu && (
              <div className="adm-pop" role="menu">
                <button className="sl" role="menuitem" onClick={() => { setMenu(false); onProfile(); }}><Icon name="user" />Profil</button>
                <button className="sl" role="menuitem" onClick={onLogout}><Icon name="logout" />Chiqish</button>
              </div>
            )}
          </div>
        </header>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}

/* ---------- Sahifa sarlavhasi ---------- */
export const PageHead = ({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) => (
  <div className="adm-title">
    <div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>
    {actions && <div className="adm-actions">{actions}</div>}
  </div>
);

export const PrimaryButton = ({ icon, children, onClick }: { icon?: IconName; children: ReactNode; onClick: () => void }) => (
  <button className="btn fill sl" onClick={onClick}>{icon && <Icon name={icon} />}{children}</button>
);

/* ---------- Qidiruv satri + filtrlar paneli ---------- */
export function SearchBar({ value, onSubmit, placeholder, filters, activeFilters = 0 }: {
  value: string; onSubmit: (v: string) => void; placeholder: string; filters?: ReactNode; activeFilters?: number;
}) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(activeFilters > 0);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className="adm-search">
      <form className="adm-sbar" role="search" onSubmit={(e) => { e.preventDefault(); onSubmit(draft.trim()); }}>
        <label className="adm-sinput">
          <Icon name="search" />
          <input value={draft} onChange={(e) => { setDraft(e.target.value); if (!e.target.value) onSubmit(''); }} placeholder={placeholder} aria-label={placeholder} />
        </label>
        <button type="submit" className="btn fill sl"><Icon name="search" />Qidirish</button>
        {filters && (
          <button type="button" className="btn outline sl" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name="filter" />Filtrlar{activeFilters > 0 && <span className="adm-count">{activeFilters}</span>}
            <Icon name="expand" className={open ? 'flip' : ''} />
          </button>
        )}
      </form>
      {filters && open && <div className="adm-filters">{filters}</div>}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <div className="adm-f">
      <label htmlFor={id}>{label}</label>
      <div className="ctl">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="expand" />
      </div>
    </div>
  );
}

export function FilterDate({ label, value, onChange, min, max }: { label: string; value: string; onChange: (v: string) => void; min?: string; max?: string }) {
  const id = useId();
  return (
    <div className="adm-f">
      <label htmlFor={id}>{label}</label>
      <div className="ctl"><input id={id} type="date" value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} /></div>
    </div>
  );
}

/** Matn bo'yicha qidiruv: bo'sh so'rov — hammasi */
export const matches = (q: string, ...fields: (string | null | undefined)[]) => {
  const s = q.toLowerCase();
  return !s || fields.some((f) => f?.toLowerCase().includes(s));
};

/* ---------- Jadval + sahifalash ---------- */
export interface Col<T> { key: string; head: string; cell: (r: T) => ReactNode; width?: string; align?: 'right' }

const SIZES = [10, 20, 50, 100];

export function DataTable<T>({ cols, rows, rowKey, onRow, loading, error, onRetry, empty }: {
  cols: Col<T>[]; rows: T[]; rowKey: (r: T) => string; onRow?: (r: T) => void;
  loading?: boolean; error?: string; onRetry?: () => void; empty?: { icon: IconName; title: string; hint?: string };
}) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  useEffect(() => { setPage(0); }, [rows, size]);
  const cur = Math.min(page, pages - 1);
  const slice = useMemo(() => rows.slice(cur * size, cur * size + size), [rows, cur, size]);
  const from = rows.length ? cur * size + 1 : 0;
  const to = Math.min(rows.length, cur * size + size);

  let body: ReactNode;
  if (error) body = <LoadError message={error} onRetry={onRetry ?? (() => {})} />;
  else if (loading && !rows.length) body = <div className="adm-skel" aria-busy="true" aria-label="Yuklanmoqda">{Array.from({ length: 6 }, (_, i) => <div key={i} className="sk" />)}</div>;
  else if (!rows.length) body = <EmptyState icon={empty?.icon ?? 'list'} title={empty?.title ?? 'Ma’lumot topilmadi'} hint={empty?.hint ?? 'Filtr yoki qidiruvni o‘zgartirib ko‘ring'} />;
  else body = (
    <div className="adm-scroll">
      <table>
        <thead><tr>{cols.map((c) => <th key={c.key} style={{ width: c.width, textAlign: c.align }}>{c.head}</th>)}</tr></thead>
        <tbody>
          {slice.map((r) => (
            <tr key={rowKey(r)} className={onRow ? 'click' : ''} onClick={onRow && (() => onRow(r))}
              tabIndex={onRow ? 0 : undefined}
              onKeyDown={onRow && ((e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onRow(r); } })}>
              {cols.map((c) => <td key={c.key} style={{ textAlign: c.align }}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const nav = (icon: IconName, label: string, go: number, off: boolean) => (
    <button className="ib sl" aria-label={label} disabled={off} onClick={() => setPage(go)}><Icon name={icon} /></button>
  );
  return (
    <section className="adm-card">
      {body}
      <footer className="adm-pager">
        <label>Sahifadagi yozuvlar:
          <select value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Sahifadagi yozuvlar soni">
            {SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <span className="rng">{from} – {to} / {rows.length} ta</span>
        <div className="pg">
          {nav('first', 'Birinchi sahifa', 0, cur === 0)}
          {nav('prev', 'Oldingi sahifa', cur - 1, cur === 0)}
          {nav('chevron', 'Keyingi sahifa', cur + 1, cur >= pages - 1)}
          {nav('last', 'Oxirgi sahifa', pages - 1, cur >= pages - 1)}
        </div>
      </footer>
    </section>
  );
}

/** Jadval qatori: bosh matn + ikkinchi qator */
export const Cell2 = ({ a, b }: { a: ReactNode; b?: ReactNode }) => (
  <div className="c2"><div>{a}</div>{b ? <div className="muted">{b}</div> : null}</div>
);
