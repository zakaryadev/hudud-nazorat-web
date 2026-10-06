import { api, DayStatus, User } from '../lib/api';
import Icon from '../components/Icon';
import { Fab, ListItem, Avatar, Tag, StatusRing, Skeleton, TopBar } from '../components/ui';
import { Section } from '../components/Parts';
import { fmtTime, uzDate, ymd } from '../lib/date';
import { useGeoPermission, useLoad } from '../lib/hooks';

const HERO: Record<DayStatus, { cls: string; title: string; hint: string; ring: number }> = {
  INSIDE: { cls: '', title: 'Bugun belgilangan', hint: 'Davomat hududda qabul qilingan', ring: 1 },
  OUTSIDE_ONLY: { cls: 'warn', title: 'Hududda emas', hint: 'Hududga borib qayta belgilang', ring: 0.5 },
  NONE: { cls: 'none', title: 'Bugun belgilanmagan', hint: 'Hududga borib davomatni belgilang', ring: 0 },
};

export default function Home({ user, go }: { user: User; go: (route: string) => void }) {
  const st = user.todayStatus ?? { status: 'NONE' as DayStatus, attempts: 0, lastAt: null };
  const hero = HERO[st.status];
  const perm = useGeoPermission();
  const att = useLoad(() => api.myAttendance(), []);
  const today = (att.data ?? []).filter((a) => ymd(new Date(a.checkInAt)) === ymd());
  const territories = user.territories ?? [];
  const first = user.fullName.split(' ')[0];

  const gps = perm === 'granted' ? { cls: '', text: 'GPS ruxsati bor' } : perm === 'denied' ? { cls: 'bad', text: 'GPS ruxsati berilmagan' } : { cls: 'off', text: 'GPS ruxsati so‘raladi' };

  return (
    <>
      <TopBar title={`Salom, ${first}`} sub={`${user.org.name} · ${uzDate(new Date())}`} />
      <div className="scroll">
        <div className={`hero ${hero.cls}`}>
          <StatusRing value={hero.ring}><Icon name={st.status === 'INSIDE' ? 'check' : st.status === 'OUTSIDE_ONLY' ? 'warn' : 'pin'} /></StatusRing>
          <div>
            <h2>{hero.title}</h2>
            <p>{st.lastAt ? `${fmtTime(st.lastAt)} · ${st.attempts} marta` : hero.hint}</p>
            <span className={`gps ${gps.cls}`}><i />{gps.text}</span>
          </div>
        </div>

        <Section title="Bugun" action={<button className="sl" onClick={() => go('history')}>Hammasi</button>} />
        {att.loading ? <Skeleton rows={2} /> : today.length ? (
          <div className="card tl">
            {today.map((a) => (
              <div className="it" key={a.id}>
                <span className="tm">{fmtTime(a.checkInAt)}</span>
                <i className={`dot ${a.withinZone ? '' : 'w'}`} />
                <div><b>{a.territory.name}</b><div className="s">{a.withinZone ? 'Hududda' : 'Hududda emas'} · {a.distanceM} m</div></div>
              </div>
            ))}
          </div>
        ) : <div className="card"><div className="li"><Avatar tone="neutral" icon="history" /><div className="mid"><div className="t">Bugun yozuv yo‘q</div><div className="s">Belgilaganingizdan keyin shu yerda ko‘rinadi</div></div><span /></div></div>}

        <Section title="Mening hududlarim" />
        {territories.length ? (
          <div className="card list">
            {territories.map((t) => (
              <ListItem key={t.id} lead={<Avatar tone="t2" icon="pin" />} title={t.name} sub={t.address || 'Manzil ko‘rsatilmagan'} trail={<Tag tone="neutral">{t.radiusM} m</Tag>} />
            ))}
          </div>
        ) : <div className="card"><div className="li"><Avatar tone="neutral" icon="lock" /><div className="mid"><div className="t">Hudud biriktirilmagan</div><div className="s">Administratorga murojaat qiling</div></div><span /></div></div>}

        <div className="card list">
          <ListItem lead={<Avatar tone="t2" icon="doc" />} title="Hisobot yuborish" sub="Tashrif haqida izoh va rasm" trail={<Icon name="chevron" />} onClick={() => go('report')} />
        </div>
      </div>
      {territories.length > 0 && <Fab extended icon="pin" label="Belgilash" onClick={() => go('checkin')} />}
    </>
  );
}
