import { useEffect, useMemo, useState } from 'react';
import { api, AttendanceResult, Territory, User } from '../lib/api';
import { compressImage, haversineMeters } from '../lib/geo';
import { useGps, usePhoto } from '../lib/hooks';
import Icon from '../components/Icon';
import MapView from '../components/MapView';
import { GeoHelp, PhotoRow } from '../components/Parts';
import { SelectField } from '../components/ui';
import { useToast } from '../components/Toast';
import { fmtTime } from '../lib/date';

export default function CheckIn({ user, onBack, onDone }: { user: User; onBack: () => void; onDone: () => void }) {
  const toast = useToast();
  const [territories, setTerritories] = useState<Territory[]>(user.territories ?? []);
  const [territoryId, setTerritoryId] = useState('');
  const gps = useGps(true); // ekran ochilishi bilan joylashuvni aniqlaymiz
  const photo = usePhoto();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<AttendanceResult | null>(null);

  // Admin uchun /me da hududlar bo'lmasligi mumkin — to'liq ro'yxatni olamiz
  useEffect(() => {
    api.territories().then((l) => setTerritories(l.filter((t) => t.isActive !== false))).catch((e) => toast(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!territoryId && territories.length === 1) setTerritoryId(territories[0].id);
  }, [territories, territoryId]);

  const territory = territories.find((t) => t.id === territoryId);
  const { pos } = gps;
  const dist = useMemo(
    () => (pos && territory ? Math.round(haversineMeters(pos.latitude, pos.longitude, territory.latitude, territory.longitude)) : null),
    [pos, territory],
  );
  const inside = dist !== null && territory ? dist <= territory.radiusM : null;

  async function submit() {
    if (!territory || !pos) return;
    setBusy(true);
    setFailed(false);
    try {
      let photoUrl: string | undefined;
      if (photo.file) {
        if (photo.uploaded.current?.file !== photo.file) {
          const blob = await compressImage(photo.file).catch(() => photo.file!);
          photo.uploaded.current = { file: photo.file, url: (await api.upload(blob)).url };
        }
        photoUrl = photo.uploaded.current.url;
      }
      setResult(await api.setAttendance({ territoryId: territory.id, latitude: pos.latitude, longitude: pos.longitude, accuracy: pos.accuracy, photoUrl }));
      navigator.vibrate?.(inside ? 30 : [60, 40, 60]);
    } catch (e) {
      setFailed(true);
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const ok = result.withinZone;
    return (
      <div className={`success ${ok ? '' : 'warn'}`}>
        <div className="big">
          {ok ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : <Icon name="warn" className="" />}
        </div>
        <h2>{result.alreadyMarked ? 'Bugun allaqachon belgilangan' : ok ? 'Belgilandi' : 'Hududda emassiz'}</h2>
        <p>
          {result.alreadyMarked
            ? <>{result.territory.name} · {fmtTime(result.checkInAt)}<br />Birinchi muvaffaqiyatli belgilash saqlangan</>
            : <>{result.territory.name} · hududdan {result.distanceM} m<br />ruxsat etilgan masofa {result.territory.radiusM} m</>}
        </p>
        <button className="btn fill big sl" style={{ marginTop: 16 }} onClick={onDone}>Tayyor</button>
      </div>
    );
  }

  const gpsLine = gps.busy ? 'Joylashuv aniqlanmoqda…' : pos ? `GPS ±${Math.round(pos.accuracy)} m` : 'Joylashuv aniqlanmadi';
  return (
    <div className="checkin">
      <div className="mapwrap">
        <button className="back sl" onClick={onBack} aria-label="Orqaga"><Icon name="back" /></button>
        <MapView value={territory ? { latitude: territory.latitude, longitude: territory.longitude } : null} radiusM={territory?.radiusM ?? 100} me={pos} height="100%" />
        {dist !== null && territory && (
          <span className={`tag float ${inside ? 'ok' : 'warn'}`}>
            <Icon name={inside ? 'check' : 'warn'} />Hududgacha ≈ {dist} m, {inside ? 'hududda' : 'hududda emas'}
          </span>
        )}
      </div>
      <div className="dock">
        <div className="handle" />
        {territories.length > 1 ? (
          <SelectField label="Hudud" value={territoryId} onChange={setTerritoryId} options={[{ value: '', label: '— tanlang —' }, ...territories.map((t) => ({ value: t.id, label: `${t.name} (${t.radiusM} m)` }))]} />
        ) : territory ? (
          <div className="row"><strong>{territory.name}</strong><span className="muted">{territory.radiusM} m</span></div>
        ) : null}
        <div className="row">
          <span className={`gps ${pos ? (pos.accuracy > 100 ? 'bad' : '') : 'off'}`} style={{ margin: 0, background: 'var(--sc-high)' }}><i />{gpsLine}</span>
          <button className="btn text sl" onClick={gps.locate} disabled={gps.busy}><Icon name="gps" />{pos ? 'Yangilash' : 'Aniqlash'}</button>
        </div>
        {pos && pos.accuracy > 100 && <div className="err-text">GPS aniqligi past. Ochiq joyga chiqib yangilang.</div>}
        {gps.denied && <GeoHelp />}
        {gps.error && !gps.denied && <div className="err-text">{gps.error}</div>}
        <PhotoRow preview={photo.preview} onFile={photo.setFile} />
        <button className="btn fill big sl" disabled={!territory || !pos || busy} onClick={submit}>
          {busy ? 'Yuborilmoqda…' : failed ? 'Qayta urinish' : 'Belgilash'}
        </button>
      </div>
    </div>
  );
}
