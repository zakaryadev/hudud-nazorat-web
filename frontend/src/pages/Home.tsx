import { useEffect, useMemo, useState } from 'react';
import { api, AttendanceResult, User } from '../lib/api';
import { haversineMeters } from '../lib/geo';
import { fmtTime, uzDate, ymd } from '../lib/date';
import { useGps, useLoad } from '../lib/hooks';
import Icon from '../components/Icon';
import MapView from '../components/MapView';
import { GeoHelp } from '../components/Parts';
import { useToast } from '../components/Toast';

// Ish vaqti (hozircha sozlama emas): shu vaqtgacha belgilash "Vaqtida" hisoblanadi
const WORK = { start: '09:00', end: '18:00' };
const pad = (n: number) => String(n).padStart(2, '0');
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const WEEKDAY = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

export default function Home({ user, onChanged }: { user: User; onChanged: () => void }) {
  const toast = useToast();
  const now = useNow();
  const gps = useGps(true);
  const att = useLoad(() => api.myAttendance(), []);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<AttendanceResult | null>(null);
  const { pos } = gps;

  // Bugungi birinchi muvaffaqiyatli belgilash (server shuni saqlaydi)
  const first = useMemo(
    () => (att.data ?? []).filter((a) => a.withinZone && ymd(new Date(a.checkInAt)) === ymd()).sort((a, b) => a.checkInAt.localeCompare(b.checkInAt))[0] ?? null,
    [att.data],
  );
  const territories = useMemo(() => (user.territories ?? []).filter((t) => t.isActive !== false), [user.territories]);
  // Eng yaqin hudud (bitta bo'lsa — o'sha)
  const territory = useMemo(() => {
    if (!territories.length) return null;
    if (!pos) return territories[0];
    return [...territories].sort((a, b) => haversineMeters(pos.latitude, pos.longitude, a.latitude, a.longitude) - haversineMeters(pos.latitude, pos.longitude, b.latitude, b.longitude))[0];
  }, [territories, pos]);
  const dist = pos && territory ? Math.round(haversineMeters(pos.latitude, pos.longitude, territory.latitude, territory.longitude)) : null;
  const inside = dist !== null && territory ? dist <= territory.radiusM : null;

  const marked = first ? new Date(first.checkInAt) : null;
  const late = marked ? hm(marked) > WORK.start && hm(marked) <= WORK.end : false;

  async function mark() {
    if (!territory || !pos || busy) return;
    setBusy(true);
    try {
      const r = await api.setAttendance({ territoryId: territory.id, latitude: pos.latitude, longitude: pos.longitude, accuracy: pos.accuracy });
      setLast(r);
      navigator.vibrate?.(r.withinZone ? 30 : [60, 40, 60]);
      if (r.alreadyMarked) toast(`Bugun allaqachon belgilangan · ${fmtTime(r.checkInAt)}`);
      else if (!r.withinZone) toast(r.message);
      att.reload();
      onChanged();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const tries = (att.data ?? []).filter((a) => ymd(new Date(a.checkInAt)) === ymd()).length;
  const gpsChip = gps.busy ? 'GPS aniqlanmoqda…' : pos ? `GPS ±${Math.round(pos.accuracy)} m` : gps.denied ? 'GPS ruxsati yo‘q' : 'GPS topilmadi';
  const state: 'ok' | 'warn' | 'idle' = first ? 'ok' : last && !last.withinZone ? 'warn' : 'idle';

  return (
    <>
      <header className="top">
        <div className="row">
          <div className="greet">
            <div className="av">{user.fullName[0]}</div>
            <div><h1>Salom, {user.fullName.split(' ')[0]}</h1><div className="sub">{WEEKDAY[now.getDay()]}, {uzDate(now)}</div></div>
          </div>
        </div>
      </header>
      <div className="scroll">
        <div className="clock">
          <div className="row"><span className="lbl"><Icon name="history" />Ish vaqti</span><span>{WORK.start} – {WORK.end}</span></div>
          <div className="time">{pad(now.getHours())}:{pad(now.getMinutes())}<small>:{pad(now.getSeconds())}</small></div>
          <div className="chips2">
            {marked && <span><Icon name="check" />Belgilandi · {fmtTime(first!.checkInAt)}</span>}
            <button onClick={gps.locate} disabled={gps.busy}><Icon name="gps" />{gpsChip}</button>
          </div>
        </div>

        {territory ? (
          <div className="mapcard">
            <MapView value={{ latitude: territory.latitude, longitude: territory.longitude }} radiusM={territory.radiusM} me={pos} height="100%" round />
            <span className="mchip l"><Icon name="pin" />{territory.name}</span>
            <span className={`mchip r ${inside === false ? 'warn' : ''}`}><Icon name={inside === false ? 'warn' : 'gps'} />{dist !== null ? (inside ? `Hududda · ${dist} m` : `Hududda emas · ${dist} m`) : gpsChip}</span>
          </div>
        ) : (
          <div className="card"><div className="li"><div className="av neutral"><Icon name="lock" /></div><div className="mid"><div className="t">Hudud biriktirilmagan</div><div className="s">Administratorga murojaat qiling</div></div><span /></div></div>
        )}
        {gps.denied && <GeoHelp />}
        {gps.error && !gps.denied && <div className="err-text">{gps.error}</div>}

        {territory && (
          <>
            <button className={`mark ${state}`} onClick={mark} disabled={!pos || busy}>
              <div>
                <b>{busy ? 'Yuborilmoqda…' : state === 'ok' ? `Belgilandi · ${fmtTime(first!.checkInAt)}` : state === 'warn' ? 'Hududda emassiz — qayta urinish' : 'Belgilash'}</b>
                <span>{state === 'ok' ? `${late ? 'Kechikib' : 'Vaqtida'} · hududda` : pos ? (inside ? 'Siz hududdasiz' : 'Hududga yaqinlashing') : 'Joylashuv kutilmoqda'}</span>
              </div>
              <i><Icon name={state === 'warn' ? 'warn' : state === 'ok' ? 'check' : 'pin'} /></i>
            </button>
            <p className="muted hint">{state === 'ok' ? 'Qayta bossangiz ham birinchi belgilash saqlanadi' : tries ? `Bugun urinishlar: ${tries}` : ' '}</p>
          </>
        )}
      </div>
    </>
  );
}
