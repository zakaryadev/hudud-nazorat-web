import { ReactNode, useRef } from 'react';
import Icon from './Icon';
import { EmptyState } from './ui';

/** GPS ruxsati rad etilganda yo'riqnoma */
export const GeoHelp = () => (
  <div className="help" role="alert">
    <strong>Joylashuvga ruxsat bering</strong>
    <ol>
      <li>Brauzer manzil satridagi <b>🔒</b> belgisini bosing, <em>Joylashuv</em> ni <em>Ruxsat berish</em> qiling va sahifani yangilang.</li>
      <li>Telefonda <em>Joylashuv (GPS)</em> xizmati yoqilgan bo‘lsin.</li>
      <li>Kamera ochilmasa, shu yerda <em>Kamera</em> ruxsatini ham yoqing.</li>
    </ol>
  </div>
);

/** Yuklashda xato bo'lsa — qayta urinish bilan bo'sh holat */
export const LoadError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <EmptyState icon="warn" title="Yuklab bo‘lmadi" hint={message} action={<button className="btn tonal" onClick={onRetry}>Qayta urinish</button>} />
);

/** Rasm olish qatori: kamera ochadi, oldindan ko'rsatadi */
export function PhotoRow({ preview, onFile }: { preview: string; onFile: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="photo">
      <div className="th">{preview ? <img src={preview} alt="Tanlangan rasm" /> : <Icon name="image" />}</div>
      <div>
        <div style={{ fontWeight: 500 }}>{preview ? 'Rasm tayyor' : 'Rasm olinmagan'}</div>
        <div className="s">{preview ? 'Yuborishdan oldin kichraytiriladi' : 'Ixtiyoriy'}</div>
      </div>
      <input ref={ref} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      <button className="ib sl" onClick={() => ref.current?.click()} aria-label={preview ? 'Rasmni almashtirish' : 'Rasmga olish'}><Icon name="camera" /></button>
    </div>
  );
}

export const Section = ({ title, action }: { title: string; action?: ReactNode }) => (
  <div className="sec"><h3>{title}</h3>{action}</div>
);
