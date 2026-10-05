import { FormEvent, useState } from 'react';
import { api, setToken, User } from '../lib/api';
import Icon from '../components/Icon';
import { Field } from '../components/ui';

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
    <div className="shell">
      <div className="login">
        <div className="logo"><Icon name="pin" /></div>
        <div>
          <h1>Hudud nazorat</h1>
          <p className="muted">Ish joyingizda ekanligingizni tasdiqlang</p>
        </div>
        <form onSubmit={submit}>
          <Field label="Telefon" type="tel" inputMode="tel" autoComplete="username" value={phone} onChange={setPhone} required />
          <Field label="Parol" type="password" autoComplete="current-password" value={password} onChange={setPassword} required />
          {error && <div className="err-text" role="alert">{error}</div>}
          <button className="btn fill big sl" disabled={busy}>{busy ? 'Kirilmoqda…' : 'Kirish'}</button>
        </form>
      </div>
    </div>
  );
}
