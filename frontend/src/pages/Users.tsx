import { FormEvent, useEffect, useState } from 'react';
import { api, OrgUser } from '../lib/api';

export default function Users({ meId }: { meId: string }) {
  const [users, setUsers] = useState<OrgUser[] | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', phone: '+998', password: '', role: 'EMPLOYEE' as 'ADMIN' | 'EMPLOYEE' });
  const [busy, setBusy] = useState(false);
  const [pwFor, setPwFor] = useState<string | null>(null);
  const [pw, setPw] = useState('');

  const load = () => api.users().then(setUsers).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function act(id: string, body: { isActive?: boolean; password?: string }) {
    setError('');
    try {
      await api.updateUser(id, body);
      setPwFor(null);
      setPw('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

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
                {u.id !== meId && (
                  <div className="row left">
                    <button className="link" onClick={() => act(u.id, { isActive: !u.isActive })}>{u.isActive ? 'Nofaol qilish' : 'Faollashtirish'}</button>
                    <button className="link" onClick={() => { setPwFor(pwFor === u.id ? null : u.id); setPw(''); }}>Parolni o‘zgartirish</button>
                  </div>
                )}
                {pwFor === u.id && (
                  <div className="row left">
                    <input type="text" placeholder="Yangi parol (kamida 4)" minLength={4} value={pw} onChange={(e) => setPw(e.target.value)} />
                    <button className="primary" disabled={pw.length < 4} onClick={() => act(u.id, { password: pw })}>Saqlash</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
