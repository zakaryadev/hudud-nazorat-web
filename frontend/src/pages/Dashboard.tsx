import { useState } from 'react';
import { api, DailyItem, DayStatus } from '../lib/api';
import { downloadCsv } from '../lib/csv';
import { fmtTime, uzDate, WEEKDAYS, ymd } from '../lib/date';
import { useLoad } from '../lib/hooks';
import Icon from '../components/Icon';
import { Avatar, Chip, EmptyState, IconButton, ListItem, Sheet, Skeleton, StatusRing, Tag, TopBar } from '../components/ui';
import { LoadError } from '../components/Parts';
import { useToast } from '../components/Toast';

const LABEL: Record<DayStatus, string> = { INSIDE: 'Ichkarida', OUTSIDE_ONLY: 'Tashqarida', NONE: 'Belgilamagan' };
const TONE: Record<DayStatus, 'ok' | 'warn' | 'err'> = { INSIDE: 'ok', OUTSIDE_ONLY: 'warn', NONE: 'err' };

// Admin paneli: tanlangan kunning holati (FR-7.1)
export default function Dashboard({ onOpenJournal }: { onOpenJournal: (userId: string, date: string) => void }) {
  const toast = useToast();
  const [date, setDate] = useState(ymd());
  const [flt, setFlt] = useState<'all' | DayStatus>('all');
  const [sel, setSel] = useState<DailyItem | null>(null);
  const q = useLoad(() => api.daily(date), [date]);
  const d = q.data;

  const week = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400000));
  const items = (d?.items ?? []).filter((i) => flt === 'all' || i.status === flt);
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

  return (
    <>
      <TopBar
        title="Panel"
        sub={`Kunlik kesim · ${uzDate(date)}`}
        actions={<>
          <span className="ib sl" aria-label="Sana tanlash"><Icon name="calendar" /><input type="date" aria-label="Sana" value={date} max={ymd()} onChange={(e) => e.target.value && setDate(e.target.value)} /></span>
          <IconButton icon="download" label="CSV yuklab olish" onClick={exportCsv} />
        </>}
      />
      <div className="scroll">
        <div className="week">
          {week.map((w) => (
            <button key={ymd(w)} className={`sl ${ymd(w) === date ? 'on' : ''}`} onClick={() => setDate(ymd(w))} aria-label={uzDate(w)}>
              <span>{WEEKDAYS[w.getDay()]}</span><b>{w.getDate()}</b>
            </button>
          ))}
        </div>

        {q.error ? <LoadError message={q.error} onRetry={q.reload} /> : !d ? <Skeleton rows={4} /> : (
          <>
            <div className="kpis">
              <div className="kpi wide row-k">
                <div className="stack-sm" style={{ gap: 0 }}><span>Belgilaganlar</span><b>{marked} / {d.summary.total}</b></div>
                <StatusRing value={pct}><span style={{ fontSize: 16, fontWeight: 500 }}>{Math.round(pct * 100)}%</span></StatusRing>
              </div>
              <div className="kpi ok"><b>{d.summary.inside}</b><span>Ichkarida</span></div>
              <div className="kpi warn"><b>{d.summary.outsideOnly}</b><span>Faqat tashqarida</span></div>
              <div className="kpi err wide"><b>{d.summary.none}</b><span>Belgilamagan</span></div>
            </div>
            <div className="chips">
              {([['all', 'Hammasi'], ['INSIDE', 'Ichkarida'], ['OUTSIDE_ONLY', 'Tashqarida'], ['NONE', 'Belgilamagan']] as const).map(([k, l]) => (
                <Chip key={k} on={flt === k} onClick={() => setFlt(k)}>{l}</Chip>
              ))}
            </div>
            {items.length ? (
              <div className="card list">
                {items.map((i) => {
                  const bad = i.minAccuracy != null && i.minAccuracy > 100;
                  return (
                    <ListItem key={i.user.id} onClick={() => setSel(i)}
                      lead={<Avatar text={i.user.fullName} tone={TONE[i.status]} />}
                      title={i.user.fullName}
                      sub={i.attempts ? `${fmtTime(i.lastAt!)} · ${i.lastTerritory} · ${i.lastDistanceM} m${bad ? ` · GPS ±${Math.round(i.minAccuracy!)} m` : ''}` : 'Bugun belgilamagan'}
                      subWarn={bad}
                      trail={<Tag tone={TONE[i.status]}>{LABEL[i.status]}</Tag>} />
                  );
                })}
              </div>
            ) : <EmptyState icon="group" title={d.items.length ? 'Bu holatda xodim yo‘q' : 'Faol xodim yo‘q'} hint={d.items.length ? undefined : '“Xodimlar” bo‘limida xodim qo‘shing'} />}
          </>
        )}
      </div>

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
