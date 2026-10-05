import { useEffect, useState } from 'react';
import { api, Daily, DayStatus } from '../lib/api';
import { ymd } from '../lib/date';

const LABEL: Record<DayStatus, string> = { INSIDE: 'Ichkarida', OUTSIDE_ONLY: 'Faqat tashqarida', NONE: 'Belgilamagan' };
const CLS: Record<DayStatus, string> = { INSIDE: 'ok', OUTSIDE_ONLY: 'warn', NONE: 'err' };

// Admin paneli: tanlangan kun uchun har bir xodimning davomat holati (FR-7.1)
export default function Dashboard() {
  const [date, setDate] = useState(ymd());
  const [data, setData] = useState<Daily | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    api.daily(date).then(setData).catch((e) => setError(e.message));
  }, [date]);

  return (
    <div className="stack">
      <div className="card">
        <div className="row">
          <h2>Kunlik kesim</h2>
          <input type="date" value={date} max={ymd()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
        {data && (
          <div className="tiles">
            <div className="tile"><b>{data.summary.total}</b><span>Jami</span></div>
            <div className="tile ok"><b>{data.summary.inside}</b><span>Ichkarida</span></div>
            <div className="tile warn"><b>{data.summary.outsideOnly}</b><span>Tashqarida</span></div>
            <div className="tile err"><b>{data.summary.none}</b><span>Belgilamagan</span></div>
          </div>
        )}
      </div>

      <div className="card">
        {error && <div className="alert err">{error}</div>}
        {!data && !error && <div className="muted">Yuklanmoqda…</div>}
        {data && !data.items.length && <div className="muted">Faol xodim yo‘q</div>}
        {data && (
          <ul className="list">
            {data.items.map((i) => (
              <li key={i.user.id}>
                <div className="row">
                  <strong>{i.user.fullName}</strong>
                  <span className={`badge ${CLS[i.status]}`}>{LABEL[i.status]}</span>
                </div>
                {i.attempts > 0 ? (
                  <div className="muted small">
                    {new Date(i.lastAt!).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} · {i.lastTerritory} · {i.lastDistanceM} m · {i.attempts} marta
                    {i.minAccuracy != null && i.minAccuracy > 100 && <span className="warnText"> · GPS aniqligi past (±{Math.round(i.minAccuracy)} m)</span>}
                  </div>
                ) : (
                  <div className="muted small">{i.user.phone}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
