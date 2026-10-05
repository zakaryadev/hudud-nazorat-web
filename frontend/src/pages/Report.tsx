import { useEffect, useState } from 'react';
import { api, Territory, User } from '../lib/api';
import { compressImage } from '../lib/geo';
import { useGps, usePhoto } from '../lib/hooks';
import Icon from '../components/Icon';
import { GeoHelp, PhotoRow } from '../components/Parts';
import { Field, SelectField, TextArea, TopBar } from '../components/ui';
import { useToast } from '../components/Toast';

// Tashrif/hisobot yozuvi: hudud (ixtiyoriy), manzil, izoh, GPS va rasm
export default function Report({ user, onBack, onDone }: { user: User; onBack: () => void; onDone: () => void }) {
  const toast = useToast();
  const [territories, setTerritories] = useState<Territory[]>(user.territories ?? []);
  const [territoryId, setTerritoryId] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const gps = useGps(true);
  const photo = usePhoto();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.territories().then((l) => setTerritories(l.filter((t) => t.isActive !== false))).catch(() => {});
  }, []);

  async function submit() {
    if (!gps.pos) return;
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
      await api.createRecord({
        territoryId: territoryId || undefined,
        latitude: gps.pos.latitude,
        longitude: gps.pos.longitude,
        accuracy: gps.pos.accuracy,
        address: address.trim() || undefined,
        comment: comment.trim() || undefined,
        photoUrl,
      });
      toast('Hisobot yuborildi');
      onDone();
    } catch (e) {
      setFailed(true);
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar title="Hisobot" sub="Tashrif haqida yozuv" onBack={onBack} />
      <div className="scroll nonav" style={{ paddingTop: 12 }}>
        <SelectField label="Hudud (ixtiyoriy)" value={territoryId} onChange={setTerritoryId} options={[{ value: '', label: 'Hududsiz' }, ...territories.map((t) => ({ value: t.id, label: t.name }))]} />
        <Field label="Manzil (ixtiyoriy)" value={address} onChange={setAddress} />
        <TextArea label="Izoh" value={comment} onChange={setComment} rows={4} />
        <div className="row">
          <span className={`gps ${gps.pos ? '' : 'off'}`} style={{ margin: 0, background: 'var(--sc-high)' }}>
            <i />{gps.busy ? 'Joylashuv aniqlanmoqda…' : gps.pos ? `GPS ±${Math.round(gps.pos.accuracy)} m` : 'Joylashuv aniqlanmadi'}
          </span>
          <button className="btn text sl" onClick={gps.locate} disabled={gps.busy}><Icon name="gps" />{gps.pos ? 'Yangilash' : 'Aniqlash'}</button>
        </div>
        {gps.denied && <GeoHelp />}
        {gps.error && !gps.denied && <div className="err-text">{gps.error}</div>}
        <PhotoRow preview={photo.preview} onFile={photo.setFile} />
        <button className="btn fill big sl" disabled={!gps.pos || busy} onClick={submit}>{busy ? 'Yuborilmoqda…' : failed ? 'Qayta urinish' : 'Yuborish'}</button>
      </div>
    </>
  );
}
