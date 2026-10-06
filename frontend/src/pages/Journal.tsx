import { useEffect, useMemo, useState } from 'react';
import { api, AttendanceItem, VisitRecordItem } from '../lib/api';
import { absoluteUrl, downloadCsv } from '../lib/csv';
import { fmtTime } from '../lib/date';
import { useLoad } from '../lib/hooks';
import Icon from '../components/Icon';
import { Avatar, Tag } from '../components/ui';
import { AttendanceSheet, RecordSheet } from '../components/Details';
import { Cell2, Col, DataTable, FilterDate, FilterSelect, matches, PageHead, SearchBar } from '../components/admin';
import { defaultFilter, Filter, useOrgLists } from '../components/orgFilter';
import { useToast } from '../components/Toast';

const LIMIT = 500;
const day = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.');
type ZoneFilter = 'all' | 'in' | 'out';

// Admin: davomat jurnali (kind="att") va xodimlar hisobotlari (kind="rec"), umumiy filtr va CSV bilan
export default function Journal({ kind, preset }: { kind: 'att' | 'rec'; preset?: Partial<Filter> }) {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>({ ...defaultFilter(), ...preset });
  useEffect(() => { if (preset) setFilter({ ...defaultFilter(), ...preset }); }, [preset]);
  const [q, setQ] = useState('');
  const [zone, setZone] = useState<ZoneFilter>('all');
  const lists = useOrgLists();
  const [a, setA] = useState<AttendanceItem | null>(null);
  const [r, setR] = useState<VisitRecordItem | null>(null);

  const params = { ...filter, limit: String(LIMIT) };
  const att = useLoad<AttendanceItem[]>(() => (kind === 'att' ? api.orgAttendance(params) : Promise.resolve([])), [kind, filter]);
  const rec = useLoad<VisitRecordItem[]>(() => (kind === 'rec' ? api.orgRecords(params) : Promise.resolve([])), [kind, filter]);
  const cur = kind === 'att' ? att : rec;

  const attRows = useMemo(
    () => (att.data ?? []).filter((x) => (zone === 'all' || (zone === 'in') === x.withinZone) && matches(q, x.user?.fullName, x.user?.phone, x.territory.name)),
    [att.data, q, zone],
  );
  const recRows = useMemo(
    () => (rec.data ?? []).filter((x) => matches(q, x.user?.fullName, x.user?.phone, x.territory?.name, x.address, x.comment)),
    [rec.data, q],
  );
  const total = kind === 'att' ? attRows.length : recRows.length;

  const set = (k: keyof Filter) => (v: string) => setFilter((f) => ({ ...f, [k]: v }));
  const active = (filter.userId ? 1 : 0) + (filter.territoryId ? 1 : 0) + (zone !== 'all' ? 1 : 0);

  function exportCsv() {
    const range = `${filter.from || 'boshi'}_${filter.to || 'oxiri'}`;
    if (kind === 'att') {
      downloadCsv(`davomat_${range}.csv`, [
        ['Sana va vaqt', 'Xodim', 'Telefon', 'Hudud', 'Holat', 'Masofa (m)', 'GPS aniqligi (m)', 'Rasm'],
        ...attRows.map((x) => [`${x.checkInAt.slice(0, 10)} ${fmtTime(x.checkInAt)}`, x.user?.fullName, x.user?.phone, x.territory.name, x.withinZone ? 'Hududda' : 'Hududda emas', x.distanceM, x.accuracy != null ? Math.round(x.accuracy) : '', absoluteUrl(x.photoUrl)]),
      ]);
    } else {
      downloadCsv(`hisobotlar_${range}.csv`, [
        ['Sana va vaqt', 'Xodim', 'Telefon', 'Hudud', 'Manzil', 'Izoh', 'Rasm'],
        ...recRows.map((x) => [`${x.createdAt.slice(0, 10)} ${fmtTime(x.createdAt)}`, x.user?.fullName, x.user?.phone, x.territory?.name, x.address, x.comment, absoluteUrl(x.photoUrl)]),
      ]);
    }
    toast('CSV tayyorlandi');
  }

  const attCols: Col<AttendanceItem>[] = [
    { key: 'when', head: 'Sana va vaqt', width: '150px', cell: (x) => <Cell2 a={day(x.checkInAt)} b={fmtTime(x.checkInAt)} /> },
    { key: 'user', head: 'Xodim', cell: (x) => <div className="who"><Avatar text={x.user?.fullName} tone={x.withinZone ? 'ok' : 'warn'} size={32} /><Cell2 a={x.user?.fullName} b={x.user?.phone} /></div> },
    { key: 'zone', head: 'Hudud', cell: (x) => x.territory.name },
    { key: 'st', head: 'Holat', width: '140px', cell: (x) => <Tag tone={x.withinZone ? 'ok' : 'warn'}>{x.withinZone ? 'Hududda' : 'Hududda emas'}</Tag> },
    { key: 'dist', head: 'Masofa', width: '100px', cell: (x) => `${x.distanceM} m` },
    { key: 'gps', head: 'GPS aniqligi', width: '120px', cell: (x) => x.accuracy == null ? '—' : <span className={x.accuracy > 100 ? 'err-text' : ''}>±{Math.round(x.accuracy)} m</span> },
    { key: 'ph', head: 'Rasm', width: '80px', cell: (x) => x.photoUrl ? <Avatar src={x.photoUrl} size={36} /> : <span className="muted">—</span> },
  ];
  const recCols: Col<VisitRecordItem>[] = [
    { key: 'when', head: 'Sana va vaqt', width: '150px', cell: (x) => <Cell2 a={day(x.createdAt)} b={fmtTime(x.createdAt)} /> },
    { key: 'user', head: 'Xodim', cell: (x) => <div className="who"><Avatar text={x.user?.fullName} tone="t2" size={32} /><Cell2 a={x.user?.fullName} b={x.user?.phone} /></div> },
    { key: 'zone', head: 'Hudud', cell: (x) => x.territory?.name ?? '—' },
    { key: 'addr', head: 'Manzil', cell: (x) => x.address || '—' },
    { key: 'cm', head: 'Izoh', cell: (x) => <span className="clamp">{x.comment || '—'}</span> },
    { key: 'ph', head: 'Rasm', width: '80px', cell: (x) => x.photoUrl ? <Avatar src={x.photoUrl} size={36} /> : <span className="muted">—</span> },
  ];

  const note = cur.data && cur.data.length >= LIMIT ? ` · oxirgi ${LIMIT} ta yozuv ko‘rsatilmoqda` : '';
  return (
    <>
      <PageHead
        title={kind === 'att' ? 'Davomat jurnali' : 'Xodimlar hisobotlari'}
        sub={<>Jami topildi: <b>{total}</b> ta{note}</>}
        actions={<button className="btn outline sl" onClick={exportCsv} disabled={!total}><Icon name="download" />CSV</button>}
      />
      <SearchBar
        value={q} onSubmit={setQ} activeFilters={active}
        placeholder={kind === 'att' ? 'Xodim ismi, telefon yoki hudud nomi' : 'Xodim, hudud, manzil yoki izoh'}
        filters={<>
          <FilterDate label="Dan" value={filter.from} max={filter.to || undefined} onChange={set('from')} />
          <FilterDate label="Gacha" value={filter.to} min={filter.from || undefined} onChange={set('to')} />
          <FilterSelect label="Xodim" value={filter.userId} onChange={set('userId')} options={[{ value: '', label: 'Barchasi' }, ...lists.users.map((u) => ({ value: u.id, label: u.fullName }))]} />
          <FilterSelect label="Hudud" value={filter.territoryId} onChange={set('territoryId')} options={[{ value: '', label: 'Barchasi' }, ...lists.territories.map((t) => ({ value: t.id, label: t.name }))]} />
          {kind === 'att' && <FilterSelect label="Holat" value={zone} onChange={(v) => setZone(v as ZoneFilter)} options={[{ value: 'all', label: 'Barchasi' }, { value: 'in', label: 'Hududda' }, { value: 'out', label: 'Hududda emas' }]} />}
        </>}
      />
      {kind === 'att'
        ? <DataTable cols={attCols} rows={attRows} rowKey={(x) => x.id} onRow={setA} loading={att.loading} error={att.error} onRetry={att.reload} empty={{ icon: 'history', title: 'Yozuv topilmadi' }} />
        : <DataTable cols={recCols} rows={recRows} rowKey={(x) => x.id} onRow={setR} loading={rec.loading} error={rec.error} onRetry={rec.reload} empty={{ icon: 'doc', title: 'Hisobot topilmadi' }} />}
      <AttendanceSheet item={a} onClose={() => setA(null)} />
      <RecordSheet item={r} onClose={() => setR(null)} />
    </>
  );
}
