import { CSSProperties, ReactNode, useEffect, useId, useRef } from 'react';
import Icon, { IconName } from './Icon';
import { initials } from '../lib/date';

/* ---------- Top app bar (katta sarlavha) ---------- */
export function TopBar({ title, sub, onBack, actions }: { title: string; sub?: string; onBack?: () => void; actions?: ReactNode }) {
  return (
    <header className="top">
      {(onBack || actions) && (
        <div className="row">
          {onBack ? (
            <button className="ib sl" onClick={onBack} aria-label="Orqaga"><Icon name="back" /></button>
          ) : <span />}
          <div className="row gap4">{actions}</div>
        </div>
      )}
      <h1 style={!onBack && !actions ? { paddingTop: 16 } : undefined}>{title}</h1>
      {sub && <div className="sub">{sub}</div>}
    </header>
  );
}

export const IconButton = ({ icon, label, onClick }: { icon: IconName; label: string; onClick?: () => void }) => (
  <button className="ib sl" onClick={onClick} aria-label={label}><Icon name={icon} /></button>
);

/* ---------- Pastki menyu ---------- */
export interface NavItem { key: string; icon: IconName; label: string }
export function NavBar({ items, active, onSelect }: { items: NavItem[]; active: string; onSelect: (k: string) => void }) {
  return (
    <nav className="nav" aria-label="Asosiy menyu">
      {items.map((n) => (
        <button key={n.key} className={active === n.key ? 'on' : ''} onClick={() => onSelect(n.key)} aria-current={active === n.key ? 'page' : undefined}>
          <span className="pill sl"><Icon name={n.icon} /></span>
          {n.label}
        </button>
      ))}
    </nav>
  );
}

export const Fab = ({ icon, label, onClick, extended = false }: { icon: IconName; label: string; onClick: () => void; extended?: boolean }) => (
  <button className={`fab sl ${extended ? '' : 'sq'}`} onClick={onClick} aria-label={label}>
    <Icon name={icon} />{extended && label}
  </button>
);

/* ---------- Kichik elementlar ---------- */
export type Tone = 'ok' | 'warn' | 'err' | 'neutral' | 't2' | '';
export const Avatar = ({ text, tone = '', icon, src, size }: { text?: string; tone?: Tone; icon?: IconName; src?: string | null; size?: number }) => (
  <div className={`av ${tone}`} style={size ? ({ width: size, height: size, borderRadius: size / 2 } as CSSProperties) : undefined}>
    {src ? <img src={src} alt="" loading="lazy" /> : icon ? <Icon name={icon} /> : initials(text ?? '')}
  </div>
);

export const Tag = ({ tone, children }: { tone: Tone; children: ReactNode }) => <span className={`tag ${tone}`}>{children}</span>;

export const Chip = ({ children, on, onClick, icon, close }: { children: ReactNode; on?: boolean; onClick?: () => void; icon?: IconName; close?: boolean }) => (
  <button className={`chip sl ${on ? 'on' : ''}`} onClick={onClick} aria-pressed={on}>
    {on && !close && <Icon name="check" />}
    {icon && !on && <Icon name={icon} />}
    {children}
    {close && <Icon name="close" />}
  </button>
);

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg2" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {value === o.value && <Icon name="check" />}{o.label}
        </button>
      ))}
    </div>
  );
}

export const Switch = ({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) => (
  <button className={`sw ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)} />
);

/** Doiraviy progress (holat halqasi) */
export function StatusRing({ value, children }: { value: number; children?: ReactNode }) {
  const C = 264;
  return (
    <div className="ring">
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <circle className="tr" cx="48" cy="48" r="42" fill="none" strokeWidth="9" />
        <circle className="pg" cx="48" cy="48" r="42" fill="none" strokeWidth="9" style={{ ['--off' as string]: C - C * value } as CSSProperties} />
      </svg>
      <div className="c">{children}</div>
    </div>
  );
}

export const Skeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="card list" aria-busy="true" aria-label="Yuklanmoqda">
    {Array.from({ length: rows }, (_, i) => (
      <div className="li" key={i}>
        <div className="sk round" /><div className="stack-sm"><div className="sk line w60" /><div className="sk line w40" /></div><span />
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon, title, hint, action }: { icon: IconName; title: string; hint?: string; action?: ReactNode }) => (
  <div className="empty">
    <div className="empty-ic"><Icon name={icon} /></div>
    <h3>{title}</h3>
    {hint && <p>{hint}</p>}
    {action}
  </div>
);

/* ---------- Forma maydonlari (outlined) ---------- */
interface FieldProps { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; min?: string; max?: string; autoComplete?: string; inputMode?: 'tel' | 'numeric' | 'text' }
export function Field({ label, value, onChange, type = 'text', ...rest }: FieldProps) {
  const id = useId();
  return (
    <div className="tf">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}
export function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  const id = useId();
  return (
    <div className="tf area">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <div className="tf select">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="chevron" className="caret" />
    </div>
  );
}

/* ---------- Bottom sheet ---------- */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  );
}

export const ListItem = ({ lead, title, sub, subWarn, trail, onClick }: { lead: ReactNode; title: ReactNode; sub?: ReactNode; subWarn?: boolean; trail?: ReactNode; onClick?: () => void }) => {
  const body = (
    <>
      {lead}
      <div className="mid"><div className="t">{title}</div>{sub && <div className={`s ${subWarn ? 'warnt' : ''}`}>{sub}</div>}</div>
      {trail ?? <span />}
    </>
  );
  // Qator ichida Switch kabi tugma bo'lishi mumkin, shuning uchun <button> emas, role="button"
  return onClick ? (
    <div
      className="li sl"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {body}
    </div>
  ) : <div className="li">{body}</div>;
};
