import { useEffect, useRef, useState } from 'react';
import { api, Territory, User, VisitRecordItem } from '../lib/api';
import { compressImage, GeoError, getPosition, Position } from '../lib/geo';
import { daysAgo, ymd } from '../lib/date';
import { absoluteUrl, downloadCsv } from '../lib/csv';
import Filters, { Filter } from './Filters';
import GeoHelp from './GeoHelp';

export function RecordList({ items }: { items: VisitRecordItem[] | null }) {
  if (!items) return <div className="muted">Yuklanmoqda…</div>;
  if (!items.length) return <div className="muted">Hozircha hisobot yo‘q</div>;
  return (
    <ul className="list">
      {items.map((r) => (
        <li key={r.id}>
          <div className="row">
            <strong>{r.user ? r.user.fullName : r.territory?.name ?? 'Hisobot'}</strong>
            <span className="muted small">{new Date(r.createdAt).toLocaleString('uz-UZ')}</span>
          </div>
          {(r.user || r.address) && (
            <div className="muted small">{[r.user && r.territory?.name, r.address].filter(Boolean).join(' · ')}</div>
          )}
          {r.comment && <div>{r.comment}</div>}
          {r.photoUrl && <a className="small" href={r.photoUrl} target="_blank" rel="noreferrer">Rasm</a>}
        </li>
      ))}
    </ul>
  );
}

export function OrgReports() {
  const [filter, setFilter] = useState<Filter>({ from: daysAgo(6), to: ymd(), userId: '', territoryId: '' });
  const [items, setItems] = useState<VisitRecordItem[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setItems(null);
    setError('');
    api.orgRecords(filter).then(setItems).catch((e) => setError(e.message));
  }, [filter]);
  return (
    <div className="card">
      <h2>Xodimlar hisobotlari</h2>
      <Filters value={filter} onChange={setFilter} />
      <div className="row">
        <span className="muted small">{items ? `${items.length} ta hisobot` : ''}</span>
        <button
          disabled={!items?.length}
          onClick={() =>
            items &&
            downloadCsv(`hisobotlar_${filter.from || 'boshi'}_${filter.to || 'oxiri'}.csv`, [
              ['Sana va vaqt', 'Xodim', 'Telefon', 'Hudud', 'Manzil', 'Izoh', 'Rasm'],
              ...items.map((r) => [
                new Date(r.createdAt).toLocaleString('uz-UZ'),
                r.user?.fullName,
                r.user?.phone,
                r.territory?.name,
                r.address,
                r.comment,
                absoluteUrl(r.photoUrl),
              ]),
            ])
          }
        >
          CSV yuklab olish
        </button>
      </div>
      {error && <div className="alert err">{error}</div>}
      <RecordList items={items} />
    </div>
  );
}

export default function Report({ user }: { user: User }) {
  const [territories, setTerritories] = useState<Territory[]>(user.territories ?? []);
  const [territoryId, setTerritoryId] = useState('');
  const [pos, setPos] = useState<Position | null>(null);
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [gpsBusy, setGpsBusy] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const uploaded = useRef<{ file: File; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [mine, setMine] = useState<VisitRecordItem[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMine = () => api.myRecords().then(setMine).catch((e) => setError(e.message));
  useEffect(() => {
    api.territories().then(setTerritories).catch(() => {});
    loadMine();
  }, []);

  useEffect(() => {
    if (!photo) return setPreview('');
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

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
    if (!pos) return;
    setBusy(true);
    setSent(false);
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
      await api.createRecord({
        territoryId: territoryId || undefined,
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
        address: address.trim() || undefined,
        comment: comment.trim() || undefined,
        photoUrl,
      });
      setSent(true);
      uploaded.current = null;
      setPhoto(null); setPos(null); setAddress(''); setComment('');
      await loadMine();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Hisobot yuborish</h2>
        {sent && <div className="alert ok">✓ Hisobot yuborildi</div>}
        <label>Hudud (ixtiyoriy)
          <select value={territoryId} onChange={(e) => setTerritoryId(e.target.value)}>
            <option value="">— hududsiz —</option>
            {territories.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label>Manzil (ixtiyoriy)<input value={address} onChange={(e) => setAddress(e.target.value)} /></label>
        <label>Izoh<textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></label>

        <div className="step">
          <button onClick={locate} disabled={gpsBusy}>{gpsBusy ? 'Aniqlanmoqda…' : pos ? 'GPS ni yangilash' : 'Joylashuvni aniqlash'}</button>
          {pos && <div className="small">{pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)} · aniqlik ±{Math.round(pos.accuracy)} m</div>}
        </div>
        {geoDenied && <GeoHelp />}
        <div className="step">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          <button onClick={() => fileRef.current?.click()}>{photo ? 'Rasmni almashtirish' : 'Rasmga olish'}</button>
          {preview && <img className="preview" src={preview} alt="Tanlangan rasm" />}
        </div>

        {error && <div className="alert err">{error}</div>}
        <button className="primary" disabled={!pos || busy} onClick={submit}>{busy ? 'Yuborilmoqda…' : error && pos ? 'Qayta urinish' : 'Hisobotni yuborish'}</button>
      </div>

      <div className="card">
        <h2>Mening hisobotlarim</h2>
        <RecordList items={mine} />
      </div>
    </div>
  );
}
