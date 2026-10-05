import { useEffect, useState } from 'react';
import { api, AttendanceItem } from '../lib/api';
import { AttendanceList } from './OrgAttendance';

export default function History() {
  const [items, setItems] = useState<AttendanceItem[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.myAttendance().then(setItems).catch((e) => setError(e.message));
  }, []);
  return (
    <div className="card">
      <h2>Mening davomatim</h2>
      {error && <div className="alert err">{error}</div>}
      <AttendanceList items={items} />
    </div>
  );
}
