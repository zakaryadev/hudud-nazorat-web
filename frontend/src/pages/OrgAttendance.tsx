import { useEffect, useState } from 'react';
import { api, AttendanceItem } from '../lib/api';

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
          </div>
          {a.photoUrl && <a href={a.photoUrl} target="_blank" rel="noreferrer" className="small">Rasm</a>}
        </li>
      ))}
    </ul>
  );
}

export default function OrgAttendance() {
  const [items, setItems] = useState<AttendanceItem[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.orgAttendance().then(setItems).catch((e) => setError(e.message));
  }, []);
  return (
    <div className="card">
      <h2>Tashkilot davomati</h2>
      {error && <div className="alert err">{error}</div>}
      <AttendanceList items={items} />
    </div>
  );
}
