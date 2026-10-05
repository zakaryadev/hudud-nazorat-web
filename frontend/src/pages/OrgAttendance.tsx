import { useEffect, useState } from 'react';
import { api, AttendanceItem } from '../lib/api';
import { daysAgo, ymd } from '../lib/date';
import { absoluteUrl, downloadCsv } from '../lib/csv';
import Filters, { Filter } from './Filters';

export function AttendanceList({ items }: { items: AttendanceItem[] | null }) {
  if (!items) return <div className="muted">Yuklanmoqda…</div>;
  if (!items.length) return <div className="muted">Hozircha yozuv yo‘q</div>;
  return (
    <ul className="list">
      {items.map((a) => (
        <li key={a.id}>
          <div className="row">
            <strong>{a.user ? a.user.fullName : a.territory.name}</strong>
            <span className={`badge ${a.withinZone ? 'ok' : 'warn'}`}>{a.withinZone ? 'Ichkarida' : 'Tashqarida'}</span>
          </div>
          <div className="muted small">
            {a.user && `${a.territory.name} · `}
            {new Date(a.checkInAt).toLocaleString('uz-UZ')} · {a.distanceM} m
            {a.accuracy != null && (
              <span className={a.accuracy > 100 ? 'warnText' : ''}> · ±{Math.round(a.accuracy)} m{a.accuracy > 100 ? ' (aniqlik past)' : ''}</span>
            )}
          </div>
          {a.photoUrl && <a href={a.photoUrl} target="_blank" rel="noreferrer" className="small">Rasm</a>}
        </li>
      ))}
    </ul>
  );
}

function exportCsv(items: AttendanceItem[], f: Filter) {
  downloadCsv(`davomat_${f.from || 'boshi'}_${f.to || 'oxiri'}.csv`, [
    ['Sana va vaqt', 'Xodim', 'Telefon', 'Hudud', 'Holat', 'Masofa (m)', 'GPS aniqligi (m)', 'Rasm'],
    ...items.map((a) => [
      new Date(a.checkInAt).toLocaleString('uz-UZ'),
      a.user?.fullName,
      a.user?.phone,
      a.territory.name,
      a.withinZone ? 'Ichkarida' : 'Tashqarida',
      a.distanceM,
      a.accuracy != null ? Math.round(a.accuracy) : '',
      absoluteUrl(a.photoUrl),
    ]),
  ]);
}

// Admin: davomat jurnali (sana oralig'i, xodim, hudud bo'yicha filtr)
export default function OrgAttendance() {
  const [filter, setFilter] = useState<Filter>({ from: daysAgo(6), to: ymd(), userId: '', territoryId: '' });
  const [items, setItems] = useState<AttendanceItem[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setItems(null);
    setError('');
    api.orgAttendance(filter).then(setItems).catch((e) => setError(e.message));
  }, [filter]);
  return (
    <div className="card">
      <h2>Davomat jurnali</h2>
      <Filters value={filter} onChange={setFilter} />
      <div className="row">
        <span className="muted small">{items ? `${items.length} ta yozuv` : ''}</span>
        <button disabled={!items?.length} onClick={() => items && exportCsv(items, filter)}>CSV yuklab olish</button>
      </div>
      {error && <div className="alert err">{error}</div>}
      <AttendanceList items={items} />
    </div>
  );
}
