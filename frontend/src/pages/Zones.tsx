import { useEffect, useMemo, useState } from 'react';
import { AdminTerritory, api, OrgUser } from '../lib/api';
import { getPosition } from '../lib/geo';
import { useLoad } from '../lib/hooks';
import Icon from '../components/Icon';
import MapView from '../components/MapView';
import { Avatar, Chip, Field, Sheet, Switch, Tag } from '../components/ui';
import { Cell2, Col, DataTable, FilterSelect, matches, PageHead, PrimaryButton, SearchBar } from '../components/admin';
import { useToast } from '../components/Toast';

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
  const [text, setText] = useState('');
  const [st, setSt] = useState('');
  const list = zones.data ?? [];
  const rows = useMemo(() => list.filter((z) => (!st || (st === 'on') === (z.isActive !== false)) && matches(text, z.name, z.address)), [list, text, st]);

  const cols: Col<AdminTerritory>[] = [
    { key: 'name', head: 'Hudud nomi', cell: (z) => <Cell2 a={z.name} b={z.address} /> },
    { key: 'r', head: 'Radius', width: '110px', cell: (z) => `${z.radiusM} m` },
    { key: 'xy', head: 'Koordinatalar', width: '190px', cell: (z) => <span className="mono">{z.latitude.toFixed(5)}, {z.longitude.toFixed(5)}</span> },
    { key: 'as', head: 'Xodimlar', width: '200px', cell: (z) => z.assignees?.length
      ? <div className="who"><div className="stack">{z.assignees.slice(0, 4).map((a) => <Avatar key={a.id} text={a.fullName} tone="t2" />)}</div><span className="muted">{z.assignees.length} ta</span></div>
      : <span className="muted">Biriktirilmagan</span> },
    { key: 'st', head: 'Holat', width: '120px', cell: (z) => <Tag tone={z.isActive === false ? 'neutral' : 'ok'}>{z.isActive === false ? 'Faol emas' : 'Faol'}</Tag> },
    { key: 'ac', head: '', width: '56px', align: 'right', cell: (z) => <button className="ib sl" aria-label={`${z.name}: tahrirlash`} onClick={(e) => { e.stopPropagation(); setSheet(z); }}><Icon name="edit" /></button> },
  ];

  return (
    <>
      <PageHead title="Hududlar" sub={<>Jami topildi: <b>{rows.length}</b> ta</>} actions={<PrimaryButton icon="add" onClick={() => setSheet('new')}>Hudud qo‘shish</PrimaryButton>} />
      <SearchBar value={text} onSubmit={setText} placeholder="Hudud nomi yoki manzil" activeFilters={st ? 1 : 0}
        filters={<FilterSelect label="Holat" value={st} onChange={setSt} options={[{ value: '', label: 'Barchasi' }, { value: 'on', label: 'Faol' }, { value: 'off', label: 'Faol emas' }]} />} />
      <DataTable cols={cols} rows={rows} rowKey={(z) => z.id} onRow={setSheet} loading={zones.loading} error={zones.error} onRetry={zones.reload}
        empty={{ icon: 'pin', title: 'Hududlar yo‘q', hint: '“Hudud qo‘shish” tugmasi bilan birinchi hududni yarating' }} />
      <ZoneSheet zone={sheet} users={users.data ?? []} onClose={() => setSheet(null)} onSaved={zones.reload} />
    </>
  );
}
