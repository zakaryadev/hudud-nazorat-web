import { useState } from 'react';
import { api, AttendanceItem, VisitRecordItem } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { EmptyState, Fab, Segmented, Skeleton, TopBar } from '../components/ui';
import { LoadError } from '../components/Parts';
import { AttendanceGroups, RecordGroups } from '../components/Lists';
import { AttendanceSheet, RecordSheet } from '../components/Details';

export default function History({ kind, setKind, onBack, onNewReport }: { kind: 'att' | 'rec'; setKind: (k: 'att' | 'rec') => void; onBack?: () => void; onNewReport: () => void }) {
  const att = useLoad(() => api.myAttendance(), []);
  const rec = useLoad(() => api.myRecords(), []);
  const [a, setA] = useState<AttendanceItem | null>(null);
  const [r, setR] = useState<VisitRecordItem | null>(null);
  const cur = kind === 'att' ? att : rec;

  return (
    <>
      <TopBar title="Tarix" onBack={onBack} />
      <div className="scroll">
        <Segmented value={kind} onChange={setKind} options={[{ value: 'att', label: 'Davomat' }, { value: 'rec', label: 'Hisobotlar' }]} />
        {cur.loading && !cur.data ? <Skeleton rows={4} /> : cur.error ? <LoadError message={cur.error} onRetry={cur.reload} /> :
          kind === 'att' ? (
            att.data?.length ? <AttendanceGroups items={att.data} onOpen={setA} /> : <EmptyState icon="history" title="Hozircha davomat yo‘q" hint="Belgilaganingizdan keyin shu yerda ko‘rinadi" />
          ) : (
            rec.data?.length ? <RecordGroups items={rec.data} onOpen={setR} /> : <EmptyState icon="doc" title="Hisobot yo‘q" hint="“+” tugmasi bilan birinchi hisobotni yuboring" />
          )}
      </div>
      {kind === 'rec' && <Fab icon="add" label="Hisobot yuborish" onClick={onNewReport} />}
      <AttendanceSheet item={a} onClose={() => setA(null)} />
      <RecordSheet item={r} onClose={() => setR(null)} />
    </>
  );
}
