import { DayStatus, User } from '../lib/api';

const TEXT: Record<DayStatus, { cls: string; title: string; hint: string }> = {
  INSIDE: { cls: 'ok', title: '✓ Bugun belgilangan', hint: 'Hudud ichida davomat qabul qilingan' },
  OUTSIDE_ONLY: { cls: 'warn', title: '⚠ Faqat hudud tashqarisida', hint: 'Hudud ichida qayta belgilang' },
  NONE: { cls: 'err', title: 'Bugun hali belgilanmagan', hint: 'Hududga borib davomatni belgilang' },
};

export default function Home({ user, onCheckIn }: { user: User; onCheckIn: () => void }) {
  const st = user.todayStatus ?? { status: 'NONE' as DayStatus, attempts: 0, lastAt: null };
  const t = TEXT[st.status];
  const territories = user.territories ?? [];
  return (
    <div className="stack">
      <div className="card">
        <h2>Bugungi holat</h2>
        <div className={`alert ${t.cls}`}>
          <strong>{t.title}</strong>
          <div>{t.hint}</div>
          {st.lastAt && (
            <div className="small">
              Oxirgi: {new Date(st.lastAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} · {st.attempts} marta
            </div>
          )}
        </div>
        <button className="primary big" onClick={onCheckIn} disabled={!territories.length}>Davomat belgilash</button>
      </div>

      <div className="card">
        <h2>Mening hududlarim</h2>
        {!territories.length ? (
          <div className="muted">Sizga hududlar biriktirilmagan. Administratorga murojaat qiling.</div>
        ) : (
          <ul className="list">
            {territories.map((x) => (
              <li key={x.id}>
                <div className="row"><strong>{x.name}</strong><span className="badge">{x.radiusM} m</span></div>
                {x.address && <div className="muted small">{x.address}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
