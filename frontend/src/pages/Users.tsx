import { FormEvent, useEffect, useState } from 'react';
import { api, OrgUser } from '../lib/api';

export default function Users() {
  const [users, setUsers] = useState<OrgUser[] | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', phone: '+998', password: '', role: 'EMPLOYEE' as 'ADMIN' | 'EMPLOYEE' });
  const [busy, setBusy] = useState(false);

  const load = () => api.users().then(setUsers).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.createUser({ ...form, phone: form.phone.trim() });
      setForm({ ...form, fullName: '', phone: '+998', password: '' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <form className="card" onSubmit={submit}>
        <h2>Xodim qo‘shish</h2>
        <label>F.I.Sh<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></label>
        <label>Telefon<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
        <label>Parol (kamida 4 belgi)<input type="text" minLength={4} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        <label>Rol
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'ADMIN' | 'EMPLOYEE' })}>
            <option value="EMPLOYEE">Xodim</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </label>
        {error && <div className="alert err">{error}</div>}
        <button className="primary" disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Qo‘shish'}</button>
      </form>

      <div className="card">
        <h2>Xodimlar</h2>
        {!users ? <div className="muted">Yuklanmoqda…</div> : (
          <ul className="list">
            {users.map((u) => (
              <li key={u.id}>
                <div className="row"><strong>{u.fullName}</strong><span className="badge">{u.role === 'ADMIN' ? 'Admin' : 'Xodim'}</span></div>
                <div className="muted small">{u.phone}{!u.isActive && ' · nofaol'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
