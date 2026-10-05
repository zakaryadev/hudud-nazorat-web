import { useEffect, useRef, useState } from 'react';
import { api, AttendanceResult, Territory, User } from '../lib/api';
import { compressImage, GeoError, getPosition, haversineMeters, Position } from '../lib/geo';
import GeoHelp from './GeoHelp';
import MapPicker from './MapPicker';

export default function CheckIn({ user }: { user: User }) {
  const [territories, setTerritories] = useState<Territory[]>(user.territories ?? []);
  const [territoryId, setTerritoryId] = useState('');
  const [pos, setPos] = useState<Position | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [gpsBusy, setGpsBusy] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Yuklangan rasm: yuborish xato bo'lib qayta urinilganda rasm ikkinchi marta yuklanmaydi
  const uploaded = useRef<{ file: File; url: string } | null>(null);

  // Admin uchun /me da biriktirilgan hududlar bo'lmasligi mumkin — to'liq ro'yxatni olamiz
  useEffect(() => {
    api.territories().then((l) => setTerritories(l.filter((t) => t.isActive !== false))).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!territoryId && territories.length === 1) setTerritoryId(territories[0].id);
  }, [territories, territoryId]);

  useEffect(() => {
    if (!photo) return setPreview('');
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const territory = territories.find((t) => t.id === territoryId);
  const approxDist =
    pos && territory ? Math.round(haversineMeters(pos.latitude, pos.longitude, territory.latitude, territory.longitude)) : null;

  async function locate() {
    setGpsBusy(true);
    setError('');
    setGeoDenied(false);
    try {
      setPos(await getPosition());
    } catch (e) {
      setError((e as Error).message);
      setGeoDenied(e instanceof GeoError && e.denied);
    } finally {
      setGpsBusy(false);
    }
  }

  async function submit() {
    if (!territory || !pos) return;
    setBusy(true);
    setError('');
    try {
      let photoUrl: string | undefined;
      if (photo) {
        if (uploaded.current?.file !== photo) {
          const blob = await compressImage(photo).catch(() => photo);
          uploaded.current = { file: photo, url: (await api.upload(blob)).url };
        }
        photoUrl = uploaded.current.url;
      }
      setResult(
        await api.setAttendance({
          territoryId: territory.id,
          latitude: pos.latitude,
          longitude: pos.longitude,
          accuracy: pos.accuracy,
          photoUrl,
        }),
      );
      setPhoto(null);
      setPos(null);
      uploaded.current = null;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="card">
        <div className={`alert ${result.withinZone ? 'ok' : 'warn'}`}>
          <strong>{result.withinZone ? '✓ Belgilandi' : '⚠ Belgilandi — hudud tashqarisida'}</strong>
          <div>{result.message}</div>
        </div>
        <p className="muted">
          {result.territory.name} · masofa {result.distanceM} m · ruxsat {result.territory.radiusM} m
        </p>
        <button className="primary" onClick={() => setResult(null)}>Yangi belgilash</button>
      </div>
    );
  }

  if (!territories.length && !error) {
    return <div className="card muted">Sizga hududlar biriktirilmagan. Administratorga murojaat qiling.</div>;
  }

  return (
    <div className="card">
      <h2>Davomat belgilash</h2>

      <label>
        Hudud
        <select value={territoryId} onChange={(e) => setTerritoryId(e.target.value)}>
          <option value="">— tanlang —</option>
          {territories.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.radiusM} m)</option>
          ))}
        </select>
      </label>
      {territory?.address && <div className="muted small">{territory.address}</div>}

      {territory && (
        <MapPicker
          value={{ latitude: territory.latitude, longitude: territory.longitude }}
          radiusM={territory.radiusM}
          me={pos}
          height={200}
        />
      )}

      <div className="step">
        <button onClick={locate} disabled={gpsBusy}>{gpsBusy ? 'Aniqlanmoqda…' : pos ? 'GPS ni yangilash' : 'Joylashuvni aniqlash'}</button>
        {pos && (
          <div className="small">
            {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)} · aniqlik ±{Math.round(pos.accuracy)} m
            {pos.accuracy > 100 && <div className="warnText">GPS aniqligi past — ochiq joyga chiqib yangilang</div>}
            {approxDist !== null && territory && (
              <div className={approxDist <= territory.radiusM ? 'okText' : 'warnText'}>
                Hududgacha ≈ {approxDist} m {approxDist <= territory.radiusM ? '(ichkarida)' : '(tashqarida)'}
              </div>
            )}
          </div>
        )}
      </div>
      {geoDenied && <GeoHelp />}

      <div className="step">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        <button onClick={() => fileRef.current?.click()}>{photo ? 'Rasmni almashtirish' : 'Rasmga olish'}</button>
        {preview && <img className="preview" src={preview} alt="Tanlangan rasm" />}
      </div>

      {error && <div className="alert err">{error}</div>}

      <button className="primary big" disabled={!territory || !pos || busy} onClick={submit}>
        {busy ? 'Yuborilmoqda…' : error && pos ? 'Qayta urinish' : 'Belgilash'}
      </button>
    </div>
  );
}
