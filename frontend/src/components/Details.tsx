import { AttendanceItem, VisitRecordItem } from '../lib/api';
import { fmtTime, uzDate } from '../lib/date';
import { Sheet, Tag } from './ui';

const when = (iso: string) => `${uzDate(new Date(iso))}, ${fmtTime(iso)}`;

export function AttendanceSheet({ item, onClose }: { item: AttendanceItem | null; onClose: () => void }) {
  return (
    <Sheet open={!!item} onClose={onClose} title={item?.user?.fullName ?? item?.territory.name}>
      {item && (
        <>
          {item.photoUrl && <img className="photo-full" src={item.photoUrl} alt="Davomat rasmi" />}
          <dl className="detail">
            <dt>Holat</dt><dd><Tag tone={item.withinZone ? 'ok' : 'warn'}>{item.withinZone ? 'Ichkarida' : 'Tashqarida'}</Tag></dd>
            <dt>Hudud</dt><dd>{item.territory.name}</dd>
            <dt>Vaqt</dt><dd>{when(item.checkInAt)}</dd>
            <dt>Masofa</dt><dd>{item.distanceM} m</dd>
            {item.accuracy != null && <><dt>GPS aniqligi</dt><dd className={item.accuracy > 100 ? 'err-text' : ''}>±{Math.round(item.accuracy)} m{item.accuracy > 100 ? ' (past)' : ''}</dd></>}
            {item.user && <><dt>Telefon</dt><dd>{item.user.phone}</dd></>}
          </dl>
        </>
      )}
    </Sheet>
  );
}

export function RecordSheet({ item, onClose }: { item: VisitRecordItem | null; onClose: () => void }) {
  return (
    <Sheet open={!!item} onClose={onClose} title={item?.user?.fullName ?? 'Hisobot'}>
      {item && (
        <>
          {item.photoUrl && <img className="photo-full" src={item.photoUrl} alt="Hisobot rasmi" />}
          <dl className="detail">
            <dt>Vaqt</dt><dd>{when(item.createdAt)}</dd>
            {item.territory && <><dt>Hudud</dt><dd>{item.territory.name}</dd></>}
            {item.address && <><dt>Manzil</dt><dd>{item.address}</dd></>}
            {item.user && <><dt>Telefon</dt><dd>{item.user.phone}</dd></>}
          </dl>
          {item.comment && <p>{item.comment}</p>}
        </>
      )}
    </Sheet>
  );
}
