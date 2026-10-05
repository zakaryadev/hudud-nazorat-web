import { User } from '../lib/api';

export default function Profile({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <div className="card">
      <h2>Profil</h2>
      <dl className="dl">
        <dt>F.I.Sh</dt><dd>{user.fullName}</dd>
        <dt>Telefon</dt><dd>{user.phone}</dd>
        <dt>Tashkilot</dt><dd>{user.org.name}</dd>
        <dt>Rol</dt><dd>{user.role === 'ADMIN' ? 'Administrator' : 'Xodim'}</dd>
      </dl>
      <button onClick={onLogout}>Chiqish</button>
    </div>
  );
}
