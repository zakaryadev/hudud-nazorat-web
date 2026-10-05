import { FormEvent, useEffect, useState } from 'react';
import { AdminTerritory, api, OrgUser } from '../lib/api';
import { getPosition } from '../lib/geo';
import MapPicker from './MapPicker';

export default function Territories() {
  const [list, setList] = useState<AdminTerritory[] | null>(null);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [radiusM, setRadiusM] = useState(150);
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editIds, setEditIds] = useState<string[]>([]);
  const [editing2, setEditing2] = useState<string | null>(null); // hudud ma'lumotlarini tahrirlash
  const [draft, setDraft] = useState({ name: '', address: '', radiusM: 150, isActive: true });

  const employees = users.filter((u) => u.isActive);
  const load = () => api.territories().then(setList).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    api.users().then(setUsers).catch((e) => setError(e.message));
  }, []);

  const toggle = (ids: string[], id: string) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!point) return setError('Xaritada hudud markazini belgilang');
    setBusy(true);
    setError('');
    try {
      await api.createTerritory({
        name: name.trim(),
        address: address.trim() || undefined,
        latitude: point.latitude,
        longitude: point.longitude,
        radiusM,
        assigneeIds: assignees,
      });
      setName(''); setAddress(''); setPoint(null); setAssignees([]);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveAssignees(id: string) {
    setError('');
    try {
      await api.setAssignees(id, editIds);
      setEditing(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function saveTerritory(id: string) {
    setError('');
    try {
      await api.updateTerritory(id, {
        name: draft.name.trim(),
        address: draft.address.trim(),
        radiusM: draft.radiusM,
        isActive: draft.isActive,
      });
      setEditing2(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const UserChecks = ({ ids, onToggle }: { ids: string[]; onToggle: (id: string) => void }) => (
    <div className="checks">
      {employees.map((u) => (
        <label key={u.id} className="check">
          <input type="checkbox" checked={ids.includes(u.id)} onChange={() => onToggle(u.id)} />
          {u.fullName}
        </label>
      ))}
    </div>
  );

  return (
    <div className="stack">
      <form className="card" onSubmit={submit}>
        <h2>Yangi hudud</h2>
        <label>Nomi<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Manzil (ixtiyoriy)<input value={address} onChange={(e) => setAddress(e.target.value)} /></label>
        <label>Geofence radiusi: {radiusM} m
          <input type="range" min={20} max={1000} step={10} value={radiusM} onChange={(e) => setRadiusM(Number(e.target.value))} />
        </label>
        <MapPicker value={point} radiusM={radiusM} onChange={setPoint} />
        <div className="row">
          <span className="small muted">
            {point ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}` : 'Xaritani bosib markazni belgilang'}
          </span>
          <button type="button" onClick={() => getPosition().then(setPoint).catch((e) => setError(e.message))}>Mening joyim</button>
        </div>
        <div className="small muted">Biriktiriladigan xodimlar</div>
        <UserChecks ids={assignees} onToggle={(id) => setAssignees((a) => toggle(a, id))} />
        {error && <div className="alert err">{error}</div>}
        <button className="primary" disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Hudud yaratish'}</button>
      </form>

      <div className="card">
        <h2>Hududlar</h2>
        {!list ? <div className="muted">Yuklanmoqda…</div> : !list.length ? <div className="muted">Hozircha hudud yo‘q</div> : (
          <ul className="list">
            {list.map((t) => (
              <li key={t.id}>
                <div className="row">
                  <strong>{t.name}{t.isActive === false && <span className="badge err"> faol emas</span>}</strong>
                  <span className="badge">{t.radiusM} m</span>
                </div>
                {t.address && <div className="muted small">{t.address}</div>}
                {editing2 === t.id && (
                  <div className="stack">
                    <label>Nomi<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
                    <label>Manzil<input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></label>
                    <label>Radius: {draft.radiusM} m
                      <input type="range" min={20} max={1000} step={10} value={draft.radiusM} onChange={(e) => setDraft({ ...draft, radiusM: Number(e.target.value) })} />
                    </label>
                    <label className="check"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />Faol (yangi davomat qabul qilinadi)</label>
                    <div className="row">
                      <button className="primary" onClick={() => saveTerritory(t.id)}>Saqlash</button>
                      <button onClick={() => setEditing2(null)}>Bekor</button>
                    </div>
                  </div>
                )}
                {editing2 !== t.id && (
                  <button className="link" onClick={() => { setEditing2(t.id); setDraft({ name: t.name, address: t.address ?? '', radiusM: t.radiusM, isActive: t.isActive !== false }); }}>Tahrirlash</button>
                )}
                <div className="small">
                  {t.assignees?.length ? t.assignees.map((a) => a.fullName).join(', ') : <span className="muted">Xodim biriktirilmagan</span>}
                </div>
                {editing === t.id ? (
                  <>
                    <UserChecks ids={editIds} onToggle={(id) => setEditIds((a) => toggle(a, id))} />
                    <div className="row">
                      <button className="primary" onClick={() => saveAssignees(t.id)}>Saqlash</button>
                      <button onClick={() => setEditing(null)}>Bekor</button>
                    </div>
                  </>
                ) : (
                  <button className="link" onClick={() => { setEditing(t.id); setEditIds(t.assignees?.map((a) => a.id) ?? []); }}>Xodimlarni o‘zgartirish</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
