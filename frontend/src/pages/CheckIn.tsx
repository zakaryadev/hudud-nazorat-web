import { useEffect, useRef, useState } from 'react';
import { api, AttendanceResult, Territory, User } from '../lib/api';
import { compressImage, getPosition, haversineMeters, Position } from '../lib/geo';

export default function CheckIn({ user }: { user: User }) {
  const [territories, setTerritories] = useState<Territory[]>(user.territories ?? []);
  const [territoryId, setTerritoryId] = useState('');
  const [pos, setPos] = useState<Position | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [gpsBusy, setGpsBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Admin uchun /me da biriktirilgan hududlar bo'lmasligi mumkin — to'liq ro'yxatni olamiz
  useEffect(() => {
    api.territories().then(setTerritories).catch((e) => setError(e.message));
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
    try {
      setPos(await getPosition());
    } catch (e) {
      setError((e as Error).message);
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
        const blob = await compressImage(photo).catch(() => photo);
        photoUrl = (await api.upload(blob)).url;
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
          <strong>{result.withinZone ? '✓ Davomat qabul qilindi' : '⚠ Hudud tashqarisida'}</strong>
          <div>{result.message}</div>
        </div>
        <p className="muted">
          {result.territory.name} · masofa {result.distanceM} m · ruxsat {result.territory.radiusM} m
        </p>
        <button className="primary" onClick={() => setResult(null)}>Yangi davomat</button>
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

      <div className="step">
        <button onClick={locate} disabled={gpsBusy}>{gpsBusy ? 'Aniqlanmoqda…' : pos ? 'GPS ni yangilash' : 'Joylashuvni aniqlash'}</button>
        {pos && (
          <div className="small">
            {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)} · aniqlik ±{Math.round(pos.accuracy)} m
            {approxDist !== null && territory && (
              <div className={approxDist <= territory.radiusM ? 'okText' : 'warnText'}>
                Hududgacha ≈ {approxDist} m {approxDist <= territory.radiusM ? '(ichkarida)' : '(tashqarida)'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="step">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        <button onClick={() => fileRef.current?.click()}>{photo ? 'Rasmni almashtirish' : 'Rasmga olish'}</button>
        {preview && <img className="preview" src={preview} alt="Tanlangan rasm" />}
      </div>

      {error && <div className="alert err">{error}</div>}

      <button className="primary" disabled={!territory || !pos || busy} onClick={submit}>
        {busy ? 'Yuborilmoqda…' : 'Davomatni yuborish'}
      </button>
    </div>
  );
}
