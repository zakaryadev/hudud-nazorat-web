import { FormEvent, useState } from 'react';
import { api, setToken, User } from '../lib/api';

export default function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { accessToken } = await api.login(phone.trim(), password);
      setToken(accessToken);
      onLogin(await api.me());
    } catch (err) {
      setToken(null);
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card login" onSubmit={submit}>
        <h1>Hudud nazorat</h1>
        <label>
          Telefon
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Parol
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <div className="alert err">{error}</div>}
        <button className="primary" disabled={busy}>{busy ? 'Kirilmoqda…' : 'Kirish'}</button>
      </form>
    </div>
  );
}
