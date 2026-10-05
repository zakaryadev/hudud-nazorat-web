import { useEffect, useState } from 'react';
import { AdminTerritory, api, OrgUser } from '../lib/api';
import { daysAgo, uzDate, ymd } from '../lib/date';
import { Chip, Field, SelectField, Sheet } from './ui';

export interface Filter { from: string; to: string; userId: string; territoryId: string }
export const defaultFilter = (): Filter => ({ from: daysAgo(6), to: ymd(), userId: '', territoryId: '' });

/** Faol filtrlar chip ko'rinishida; × bosilsa shu filtr tozalanadi */
export function FilterChips({ value, users, territories, onChange, onOpen }: { value: Filter; users: OrgUser[]; territories: AdminTerritory[]; onChange: (f: Filter) => void; onOpen: () => void }) {
  const def = defaultFilter();
  const isDefaultRange = value.from === def.from && value.to === def.to;
  return (
    <div className="chips">
      <Chip on close onClick={() => onChange({ ...value, from: def.from, to: def.to })}>
        {isDefaultRange ? '7 kun' : `${uzDate(value.from)} – ${uzDate(value.to)}`}
      </Chip>
      {value.userId && <Chip on close onClick={() => onChange({ ...value, userId: '' })}>{users.find((u) => u.id === value.userId)?.fullName ?? 'Xodim'}</Chip>}
      {value.territoryId && <Chip on close onClick={() => onChange({ ...value, territoryId: '' })}>{territories.find((t) => t.id === value.territoryId)?.name ?? 'Hudud'}</Chip>}
      <Chip icon="filter" onClick={onOpen}>Filtr</Chip>
    </div>
  );
}

export function FilterSheet({ open, onClose, value, onApply, users, territories }: { open: boolean; onClose: () => void; value: Filter; onApply: (f: Filter) => void; users: OrgUser[]; territories: AdminTerritory[] }) {
  const [f, setF] = useState(value);
  useEffect(() => { if (open) setF(value); }, [open, value]);
  const set = (k: keyof Filter) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Sheet open={open} onClose={onClose} title="Filtr">
      <div className="field-row">
        <Field label="Dan" type="date" value={f.from} max={f.to || undefined} onChange={set('from')} />
        <Field label="Gacha" type="date" value={f.to} min={f.from || undefined} onChange={set('to')} />
      </div>
      <SelectField label="Xodim" value={f.userId} onChange={set('userId')} options={[{ value: '', label: 'Hammasi' }, ...users.map((u) => ({ value: u.id, label: u.fullName }))]} />
      <SelectField label="Hudud" value={f.territoryId} onChange={set('territoryId')} options={[{ value: '', label: 'Hammasi' }, ...territories.map((t) => ({ value: t.id, label: t.name }))]} />
      <div className="actions">
        <button className="btn text sl" onClick={() => { onApply(defaultFilter()); onClose(); }}>Tozalash</button>
        <button className="btn fill sl" onClick={() => { onApply(f); onClose(); }}>Qo‘llash</button>
      </div>
    </Sheet>
  );
}

/** Admin ro'yxatlari uchun xodim va hududlar */
export function useOrgLists() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [territories, setTerritories] = useState<AdminTerritory[]>([]);
  useEffect(() => {
    api.users().then(setUsers).catch(() => {});
    api.territories().then(setTerritories).catch(() => {});
  }, []);
  return { users, territories };
}
