import { useEffect, useState } from 'react';
import { api, AttendanceItem, VisitRecordItem } from '../lib/api';
import { absoluteUrl, downloadCsv } from '../lib/csv';
import { fmtTime, uzDate } from '../lib/date';
import { useLoad } from '../lib/hooks';
import Icon from '../components/Icon';
import { EmptyState, IconButton, Skeleton, TopBar } from '../components/ui';
import { LoadError } from '../components/Parts';
import { AttendanceGroups, RecordGroups } from '../components/Lists';
import { AttendanceSheet, RecordSheet } from '../components/Details';
import { defaultFilter, Filter, FilterChips, FilterSheet, useOrgLists } from '../components/FilterSheet';
import { useToast } from '../components/Toast';

// Admin: davomat jurnali (kind="att") va xodimlar hisobotlari (kind="rec"), umumiy filtr va CSV bilan
export default function Journal({ kind, preset, onBack }: { kind: 'att' | 'rec'; preset?: Partial<Filter>; onBack?: () => void }) {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>({ ...defaultFilter(), ...preset });
  useEffect(() => { if (preset) setFilter({ ...defaultFilter(), ...preset }); }, [preset]);
  const [sheet, setSheet] = useState(false);
  const lists = useOrgLists();
  const [a, setA] = useState<AttendanceItem | null>(null);
  const [r, setR] = useState<VisitRecordItem | null>(null);

  const att = useLoad<AttendanceItem[]>(() => (kind === 'att' ? api.orgAttendance(filter) : Promise.resolve([])), [kind, filter]);
  const rec = useLoad<VisitRecordItem[]>(() => (kind === 'rec' ? api.orgRecords(filter) : Promise.resolve([])), [kind, filter]);
  const cur = kind === 'att' ? att : rec;
  const count = cur.data?.length ?? 0;

  function exportCsv() {
    const range = `${filter.from || 'boshi'}_${filter.to || 'oxiri'}`;
    if (kind === 'att') {
      downloadCsv(`davomat_${range}.csv`, [
        ['Sana va vaqt', 'Xodim', 'Telefon', 'Hudud', 'Holat', 'Masofa (m)', 'GPS aniqligi (m)', 'Rasm'],
        ...(att.data ?? []).map((x) => [`${x.checkInAt.slice(0, 10)} ${fmtTime(x.checkInAt)}`, x.user?.fullName, x.user?.phone, x.territory.name, x.withinZone ? 'Ichkarida' : 'Tashqarida', x.distanceM, x.accuracy != null ? Math.round(x.accuracy) : '', absoluteUrl(x.photoUrl)]),
      ]);
    } else {
      downloadCsv(`hisobotlar_${range}.csv`, [
        ['Sana va vaqt', 'Xodim', 'Telefon', 'Hudud', 'Manzil', 'Izoh', 'Rasm'],
        ...(rec.data ?? []).map((x) => [`${x.createdAt.slice(0, 10)} ${fmtTime(x.createdAt)}`, x.user?.fullName, x.user?.phone, x.territory?.name, x.address, x.comment, absoluteUrl(x.photoUrl)]),
      ]);
    }
    toast('CSV tayyorlandi');
  }

  return (
    <>
      <TopBar
        title={kind === 'att' ? 'Jurnal' : 'Hisobotlar'}
        sub={`${uzDate(filter.from)} – ${uzDate(filter.to)}${cur.data ? ` · ${count} ta` : ''}`}
        onBack={onBack}
        actions={<>
          <IconButton icon="filter" label="Filtr" onClick={() => setSheet(true)} />
          <button className="ib sl" onClick={exportCsv} disabled={!count} aria-label="CSV yuklab olish" style={{ opacity: count ? 1 : 0.38 }}><Icon name="download" /></button>
        </>}
      />
      <div className="scroll">
        <FilterChips value={filter} onChange={setFilter} onOpen={() => setSheet(true)} {...lists} />
        {cur.loading && !cur.data ? <Skeleton rows={5} /> : cur.error ? <LoadError message={cur.error} onRetry={cur.reload} /> :
          !count ? <EmptyState icon={kind === 'att' ? 'history' : 'doc'} title="Yozuv topilmadi" hint="Filtrni o‘zgartirib ko‘ring" /> :
          kind === 'att' ? <AttendanceGroups items={att.data!} admin onOpen={setA} /> : <RecordGroups items={rec.data!} admin onOpen={setR} />}
      </div>
      <FilterSheet open={sheet} onClose={() => setSheet(false)} value={filter} onApply={setFilter} {...lists} />
      <AttendanceSheet item={a} onClose={() => setA(null)} />
      <RecordSheet item={r} onClose={() => setR(null)} />
    </>
  );
}
