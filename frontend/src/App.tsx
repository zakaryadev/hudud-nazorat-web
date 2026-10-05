import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler, User } from './lib/api';
import Login from './pages/Login';
import CheckIn from './pages/CheckIn';
import History from './pages/History';
import Territories from './pages/Territories';
import Report, { OrgReports } from './pages/Report';
import Users from './pages/Users';
import OrgAttendance from './pages/OrgAttendance';

type Tab = 'checkin' | 'history' | 'org' | 'territories' | 'users' | 'report' | 'orgReports';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getToken());
  const [tab, setTab] = useState<Tab>('checkin');

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, [logout]);

  if (loading) return <div className="center muted">Yuklanmoqda…</div>;
  if (!user) return <Login onLogin={(u) => { setUser(u); setTab('checkin'); }} />;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <strong>{user.fullName}</strong>
          <div className="muted small">{user.org.name}</div>
        </div>
        <button className="link" onClick={logout}>Chiqish</button>
      </header>

      <main>
        {tab === 'checkin' && <CheckIn user={user} />}
        {tab === 'history' && <History />}
        {tab === 'report' && <Report user={user} />}
        {tab === 'orgReports' && user.role === 'ADMIN' && <OrgReports />}
        {tab === 'org' && user.role === 'ADMIN' && <OrgAttendance />}
        {tab === 'territories' && user.role === 'ADMIN' && <Territories />}
        {tab === 'users' && user.role === 'ADMIN' && <Users />}
      </main>

      <nav className="tabs">
        <button className={tab === 'checkin' ? 'active' : ''} onClick={() => setTab('checkin')}>Davomat</button>
        <button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>Hisobot</button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Tarix</button>
        {user.role === 'ADMIN' && (
          <>
            <button className={tab === 'org' ? 'active' : ''} onClick={() => setTab('org')}>Tashkilot</button>
            <button className={tab === 'orgReports' ? 'active' : ''} onClick={() => setTab('orgReports')}>Hisobotlar</button>
            <button className={tab === 'territories' ? 'active' : ''} onClick={() => setTab('territories')}>Hududlar</button>
            <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Xodimlar</button>
          </>
        )}
      </nav>
    </div>
  );
}
