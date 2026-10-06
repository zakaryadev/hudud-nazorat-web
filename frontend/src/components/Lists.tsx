import { AttendanceItem, VisitRecordItem } from '../lib/api';
import { fmtTime, groupByDay } from '../lib/date';
import { Avatar, ListItem, Tag } from './ui';
import { Section } from './Parts';

/** Davomat yozuvlari kun bo'yicha guruhlangan. admin=true bo'lsa xodim ismi sarlavha */
export function AttendanceGroups({ items, admin, onOpen }: { items: AttendanceItem[]; admin?: boolean; onOpen: (a: AttendanceItem) => void }) {
  return (
    <>
      {groupByDay(items, (a) => a.checkInAt).map((g) => (
        <div key={g.label} className="grp">
          <Section title={g.label} />
          <div className="card list">
            {g.items.map((a) => (
              <ListItem
                key={a.id}
                onClick={() => onOpen(a)}
                lead={a.photoUrl ? <Avatar src={a.photoUrl} /> : admin && a.user ? <Avatar text={a.user.fullName} tone={a.withinZone ? 'ok' : 'warn'} /> : <Avatar tone={a.withinZone ? 'ok' : 'warn'} icon={a.withinZone ? 'check' : 'warn'} />}
                title={admin && a.user ? a.user.fullName : a.territory.name}
                sub={`${admin ? `${a.territory.name} · ` : ''}${fmtTime(a.checkInAt)} · ${a.distanceM} m${a.accuracy != null && a.accuracy > 100 ? ' · GPS aniqligi past' : ''}`}
                subWarn={a.accuracy != null && a.accuracy > 100}
                trail={<Tag tone={a.withinZone ? 'ok' : 'warn'}>{a.withinZone ? 'Hududda' : 'Hududda emas'}</Tag>}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function RecordGroups({ items, admin, onOpen }: { items: VisitRecordItem[]; admin?: boolean; onOpen: (r: VisitRecordItem) => void }) {
  return (
    <>
      {groupByDay(items, (r) => r.createdAt).map((g) => (
        <div key={g.label} className="grp">
          <Section title={g.label} />
          <div className="card list">
            {g.items.map((r) => (
              <ListItem
                key={r.id}
                onClick={() => onOpen(r)}
                lead={r.photoUrl ? <Avatar src={r.photoUrl} /> : <Avatar tone="t2" icon="doc" />}
                title={admin && r.user ? r.user.fullName : r.territory?.name ?? 'Hisobot'}
                sub={`${fmtTime(r.createdAt)}${admin && r.territory ? ` · ${r.territory.name}` : ''}${r.comment ? ` · ${r.comment}` : ''}`}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
