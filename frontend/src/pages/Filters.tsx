import { useEffect, useState } from 'react';
import { AdminTerritory, api, OrgUser } from '../lib/api';

export interface Filter {
  from: string;
  to: string;
  userId: string;
  territoryId: string;
}

// Admin hisobotlari uchun filtrlar: sana oralig'i, xodim, hudud
export default function Filters({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [territories, setTerritories] = useState<AdminTerritory[]>([]);
  useEffect(() => {
    api.users().then(setUsers).catch(() => {});
    api.territories().then(setTerritories).catch(() => {});
  }, []);
  const set = (k: keyof Filter) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });

  return (
    <div className="filters">
      <label>Dan<input type="date" value={value.from} max={value.to || undefined} onChange={set('from')} /></label>
      <label>Gacha<input type="date" value={value.to} min={value.from || undefined} onChange={set('to')} /></label>
      <label>Xodim
        <select value={value.userId} onChange={set('userId')}>
          <option value="">Hammasi</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
      </label>
      <label>Hudud
        <select value={value.territoryId} onChange={set('territoryId')}>
          <option value="">Hammasi</option>
          {territories.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
    </div>
  );
}
