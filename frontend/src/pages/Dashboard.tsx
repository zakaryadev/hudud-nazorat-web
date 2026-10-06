import { useMemo, useState } from 'react';
import { api, DailyItem, DayStatus } from '../lib/api';
import { downloadCsv } from '../lib/csv';
import { fmtTime, uzDate, ymd } from '../lib/date';
import { useLoad } from '../lib/hooks';
import Icon from '../components/Icon';
import { Avatar, Sheet, StatusRing, Tag } from '../components/ui';
import { Cell2, Col, DataTable, FilterSelect, matches, PageHead, SearchBar } from '../components/admin';
import { useToast } from '../components/Toast';

const LABEL: Record<DayStatus, string> = { INSIDE: 'Hududda', OUTSIDE_ONLY: 'Hududda emas', NONE: 'Belgilamagan' };
const TONE: Record<DayStatus, 'ok' | 'warn' | 'err'> = { INSIDE: 'ok', OUTSIDE_ONLY: 'warn', NONE: 'err' };

// Admin paneli: tanlangan kunning holati (FR-7.1)
export default function Dashboard({ onOpenJournal }: { onOpenJournal: (userId: string, date: string) => void }) {
  const toast = useToast();
  const [date, setDate] = useState(ymd());
  const [flt, setFlt] = useState<'all' | DayStatus>('all');
  const [text, setText] = useState('');
  const [sel, setSel] = useState<DailyItem | null>(null);
  const q = useLoad(() => api.daily(date), [date]);
  const d = q.data;

  const rows = useMemo(() => (d?.items ?? []).filter((i) => (flt === 'all' || i.status === flt) && matches(text, i.user.fullName, i.user.phone, i.lastTerritory)), [d, flt, text]);
  const marked = d ? d.summary.inside + d.summary.outsideOnly : 0;
  const pct = d && d.summary.total ? marked / d.summary.total : 0;

  const exportCsv = () => {
    if (!d) return;
    downloadCsv(`kunlik_${d.date}.csv`, [
      ['Xodim', 'Telefon', 'Holat', 'Urinishlar', 'Oxirgi vaqt', 'Oxirgi hudud', 'Masofa (m)', 'Eng yaxshi GPS aniqligi (m)'],
      ...d.items.map((i) => [i.user.fullName, i.user.phone, LABEL[i.status], i.attempts, i.lastAt ? fmtTime(i.lastAt) : '', i.lastTerritory, i.lastDistanceM, i.minAccuracy != null ? Math.round(i.minAccuracy) : '']),
    ]);
    toast('CSV tayyorlandi');
  };

  const cols: Col<DailyItem>[] = [
    { key: 'user', head: 'Xodim', cell: (i) => <div className="who"><Avatar text={i.user.fullName} tone={TONE[i.status]} size={32} /><Cell2 a={i.user.fullName} b={i.user.phone} /></div> },
    { key: 'st', head: 'Holat', width: '150px', cell: (i) => <Tag tone={TONE[i.status]}>{LABEL[i.status]}</Tag> },
    { key: 'at', head: 'Vaqt', width: '90px', cell: (i) => (i.lastAt ? fmtTime(i.lastAt) : '—') },
    { key: 'zone', head: 'Hudud', cell: (i) => i.lastTerritory ?? '—' },
    { key: 'dist', head: 'Masofa', width: '100px', cell: (i) => (i.lastDistanceM != null ? `${i.lastDistanceM} m` : '—') },
    { key: 'gps', head: 'GPS aniqligi', width: '120px', cell: (i) => (i.minAccuracy == null ? '—' : <span className={i.minAccuracy > 100 ? 'err-text' : ''}>±{Math.round(i.minAccuracy)} m</span>) },
    { key: 'n', head: 'Urinishlar', width: '100px', cell: (i) => i.attempts },
  ];
  const kpi = (key: 'all' | DayStatus, tone: string, value: number | undefined, label: string) => (
    <button className={`adm-kpi sl ${tone} ${flt === key ? 'on' : ''}`} onClick={() => setFlt(flt === key ? 'all' : key)} aria-pressed={flt === key}>
      <b>{value ?? '–'}</b><span>{label}</span>
    </button>
  );

  return (
    <>
      <PageHead
        title="Kunlik kesim"
        sub={<>{uzDate(date)} · Jami xodimlar: <b>{d?.summary.total ?? '–'}</b> ta</>}
        actions={<>
          <label className="adm-date"><Icon name="calendar" /><input type="date" aria-label="Sana" value={date} max={ymd()} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
          <button className="btn outline sl" onClick={exportCsv} disabled={!d}><Icon name="download" />CSV</button>
        </>}
      />
      <div className="adm-kpis">
        <div className="adm-kpi row-k">
          <div><b>{marked} / {d?.summary.total ?? '–'}</b><span>Belgilaganlar</span></div>
          <StatusRing value={pct}><span style={{ fontSize: 15, fontWeight: 500 }}>{Math.round(pct * 100)}%</span></StatusRing>
        </div>
        {kpi('INSIDE', 'ok', d?.summary.inside, 'Hududda')}
        {kpi('OUTSIDE_ONLY', 'warn', d?.summary.outsideOnly, 'Hududda emas')}
        {kpi('NONE', 'err', d?.summary.none, 'Belgilamagan')}
      </div>
      <SearchBar
        value={text} onSubmit={setText} placeholder="Xodim ismi, telefon yoki hudud nomi" activeFilters={flt !== 'all' ? 1 : 0}
        filters={<FilterSelect label="Holat" value={flt} onChange={(v) => setFlt(v as 'all' | DayStatus)} options={[{ value: 'all', label: 'Barchasi' }, { value: 'INSIDE', label: 'Hududda' }, { value: 'OUTSIDE_ONLY', label: 'Hududda emas' }, { value: 'NONE', label: 'Belgilamagan' }]} />}
      />
      <DataTable cols={cols} rows={rows} rowKey={(i) => i.user.id} onRow={setSel} loading={q.loading} error={q.error} onRetry={q.reload}
        empty={{ icon: 'group', title: d?.items.length ? 'Xodim topilmadi' : 'Faol xodim yo‘q', hint: d?.items.length ? undefined : '“Xodimlar” bo‘limida xodim qo‘shing' }} />

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel?.user.fullName}>
        {sel && (
          <>
            <dl className="detail">
              <dt>Holat</dt><dd><Tag tone={TONE[sel.status]}>{LABEL[sel.status]}</Tag></dd>
              <dt>Telefon</dt><dd>{sel.user.phone}</dd>
              <dt>Urinishlar</dt><dd>{sel.attempts}</dd>
              {sel.lastAt && <><dt>Oxirgi</dt><dd>{fmtTime(sel.lastAt)} · {sel.lastTerritory}</dd><dt>Masofa</dt><dd>{sel.lastDistanceM} m</dd></>}
              {sel.minAccuracy != null && <><dt>GPS aniqligi</dt><dd className={sel.minAccuracy > 100 ? 'err-text' : ''}>±{Math.round(sel.minAccuracy)} m</dd></>}
            </dl>
            <div className="actions"><button className="btn tonal sl" onClick={() => { onOpenJournal(sel.user.id, date); setSel(null); }}>Jurnalda ochish</button></div>
          </>
        )}
      </Sheet>
    </>
  );
}
