import { useEffect, useState } from 'react';
import { api, AttendanceItem, VisitRecordItem } from '../lib/api';
import { AttendanceList } from './OrgAttendance';
import { RecordList } from './Report';

export default function History() {
  const [kind, setKind] = useState<'att' | 'rec'>('att');
  const [att, setAtt] = useState<AttendanceItem[] | null>(null);
  const [rec, setRec] = useState<VisitRecordItem[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.myAttendance().then(setAtt).catch((e) => setError(e.message));
    api.myRecords().then(setRec).catch((e) => setError(e.message));
  }, []);
  return (
    <div className="card">
      <div className="seg">
        <button className={kind === 'att' ? 'active' : ''} onClick={() => setKind('att')}>Davomat</button>
        <button className={kind === 'rec' ? 'active' : ''} onClick={() => setKind('rec')}>Hisobotlar</button>
      </div>
      {error && <div className="alert err">{error}</div>}
      {kind === 'att' ? <AttendanceList items={att} /> : <RecordList items={rec} />}
    </div>
  );
}
