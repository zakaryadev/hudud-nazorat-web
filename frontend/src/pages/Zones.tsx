import { useEffect, useState } from 'react';
import { AdminTerritory, api, OrgUser } from '../lib/api';
import { getPosition } from '../lib/geo';
import { useLoad } from '../lib/hooks';
import Icon from '../components/Icon';
import MapView from '../components/MapView';
import { Avatar, Chip, EmptyState, Fab, Field, Sheet, Skeleton, Switch, Tag, TopBar } from '../components/ui';
import { LoadError } from '../components/Parts';
import { useToast } from '../components/Toast';

/** Xaritasiz sxematik ko'rinish: radiusga mutanosib doira (ro'yxatda ko'p xarita yuklamaslik uchun) */
function ZoneArt({ radiusM, active }: { radiusM: number; active: boolean }) {
  const r = 14 + Math.sqrt(radiusM) * 1.3;
  return (
    <div className="zone-art" style={{ opacity: active ? 1 : 0.55 }}>
      <svg viewBox="0 0 240 88" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g stroke="var(--outline-variant)" strokeWidth="1" opacity=".6">
          {[22, 44, 66].map((y) => <line key={y} x1="0" x2="240" y1={y} y2={y} />)}
          {[40, 80, 120, 160, 200].map((x) => <line key={x} y1="0" y2="88" x1={x} x2={x} />)}
        </g>
        <circle cx="120" cy="44" r={r} fill="var(--primary)" fillOpacity=".16" stroke="var(--primary)" strokeWidth="2" />
        <circle cx="120" cy="44" r="5" fill="var(--primary)" stroke="var(--surface)" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

function ZoneSheet({ zone, users, onClose, onSaved }: { zone: AdminTerritory | 'new' | null; users: OrgUser[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const edit = zone && zone !== 'new' ? zone : null;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [radiusM, setRadiusM] = useState(150);
  const [point, setPoint] = useState<{ latitude: number; longitude: number } | null>(null);
  const [active, setActive] = useState(true);
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!zone) return;
    setName(edit?.name ?? '');
    setAddress(edit?.address ?? '');
    setRadiusM(edit?.radiusM ?? 150);
    setPoint(edit ? { latitude: edit.latitude, longitude: edit.longitude } : null);
    setActive(edit?.isActive !== false);
    setIds(edit?.assignees?.map((a) => a.id) ?? []);
  }, [zone, edit]);

  const toggle = (id: string) => setIds((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  async function save() {
    if (!name.trim()) return toast('Hudud nomini kiriting');
    if (!point) return toast('Xaritada hudud markazini belgilang');
    setBusy(true);
    try {
      if (edit) {
        await api.updateTerritory(edit.id, { name: name.trim(), address: address.trim(), latitude: point.latitude, longitude: point.longitude, radiusM, isActive: active });
        await api.setAssignees(edit.id, ids);
      } else {
        await api.createTerritory({ name: name.trim(), address: address.trim() || undefined, latitude: point.latitude, longitude: point.longitude, radiusM, assigneeIds: ids });
      }
      toast(edit ? 'Hudud saqlandi' : 'Hudud yaratildi');
      onSaved();
      onClose();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={!!zone} onClose={onClose} title={edit ? 'Hududni tahrirlash' : 'Yangi hudud'}>
      <Field label="Nomi" value={name} onChange={setName} required />
      <Field label="Manzil (ixtiyoriy)" value={address} onChange={setAddress} />
      <div className="stack-sm">
        <div className="row"><span>Geofence radiusi</span><b style={{ fontFamily: 'var(--mono)' }}>{radiusM} m</b></div>
        <input type="range" min={20} max={1000} step={10} value={radiusM} onChange={(e) => setRadiusM(Number(e.target.value))} aria-label="Radius" />
      </div>
      <MapView value={point} radiusM={radiusM} onChange={setPoint} height={190} round />
      <div className="row">
        <span className="muted">{point ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}` : 'Xaritani bosib markazni belgilang'}</span>
        <button className="btn text sl" onClick={() => getPosition().then(setPoint).catch((e) => toast(e.message))}><Icon name="gps" />Mening joyim</button>
      </div>
      {edit && (
        <div className="row"><div><div>Faol</div><div className="muted">O‘chirilsa yangi davomat qabul qilinmaydi</div></div><Switch on={active} onChange={setActive} label="Faol" /></div>
      )}
      <div className="stack-sm">
        <span className="muted">Biriktirilgan xodimlar</span>
        <div className="checks">{users.filter((u) => u.isActive).map((u) => <Chip key={u.id} on={ids.includes(u.id)} onClick={() => toggle(u.id)}>{u.fullName}</Chip>)}</div>
      </div>
      <div className="actions">
        <button className="btn text sl" onClick={onClose}>Bekor</button>
        <button className="btn fill sl" disabled={busy} onClick={save}>{busy ? 'Saqlanmoqda…' : 'Saqlash'}</button>
      </div>
    </Sheet>
  );
}

export default function Zones() {
  const zones = useLoad(() => api.territories(), []);
  const users = useLoad(() => api.users(), []);
  const [sheet, setSheet] = useState<AdminTerritory | 'new' | null>(null);
  const list = zones.data ?? [];

  return (
    <>
      <TopBar title="Hududlar" sub={zones.data ? `${list.length} ta hudud` : undefined} />
      <div className="scroll">
        {zones.error ? <LoadError message={zones.error} onRetry={zones.reload} /> : zones.loading && !zones.data ? <Skeleton rows={3} /> :
          !list.length ? <EmptyState icon="pin" title="Hududlar yo‘q" hint="“+” tugmasi bilan birinchi hududni yarating" /> :
          list.map((z) => (
            <div className="card" key={z.id}>
              <ZoneArt radiusM={z.radiusM} active={z.isActive !== false} />
              <div className="zone-body">
                <div className="row"><h4>{z.name}</h4>{z.isActive === false ? <Tag tone="neutral">Faol emas</Tag> : <Tag tone="ok">Faol</Tag>}</div>
                <div className="muted">{z.address ? `${z.address} · ` : ''}{z.radiusM} m</div>
                <div className="row">
                  {z.assignees?.length ? <div className="stack">{z.assignees.slice(0, 4).map((a) => <Avatar key={a.id} text={a.fullName} tone="t2" />)}</div> : <span className="muted">Xodim biriktirilmagan</span>}
                  <button className="btn text sl" onClick={() => setSheet(z)}><Icon name="edit" />Tahrirlash</button>
                </div>
              </div>
            </div>
          ))}
      </div>
      <Fab icon="add" label="Yangi hudud" onClick={() => setSheet('new')} />
      <ZoneSheet zone={sheet} users={users.data ?? []} onClose={() => setSheet(null)} onSaved={zones.reload} />
    </>
  );
}
