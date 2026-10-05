import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler, User } from './lib/api';
import Login from './pages/Login';
import Home from './pages/Home';
import CheckIn from './pages/CheckIn';
import History from './pages/History';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import OrgAttendance from './pages/OrgAttendance';
import Report, { OrgReports } from './pages/Report';
import Territories from './pages/Territories';
import Users from './pages/Users';

type Tab = 'home' | 'checkin' | 'report' | 'history' | 'profile' | 'dashboard' | 'journal' | 'orgReports' | 'territories' | 'users';

const EMPLOYEE_TABS: [Tab, string][] = [
  ['home', 'Bosh'],
  ['checkin', 'Belgilash'],
  ['report', 'Hisobot'],
  ['history', 'Tarix'],
];
const ADMIN_TABS: [Tab, string][] = [
  ['dashboard', 'Panel'],
  ['journal', 'Jurnal'],
  ['orgReports', 'Hisobotlar'],
  ['territories', 'Hududlar'],
  ['users', 'Xodimlar'],
  ['checkin', 'Belgilash'],
  ['report', 'Hisobot'],
  ['history', 'Tarix'],
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getToken());
  const [tab, setTab] = useState<Tab>('home');

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api
      .me()
      .then((u) => {
        setUser(u);
        setTab(u.role === 'ADMIN' ? 'dashboard' : 'home');
      })
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, [logout]);

  // Bosh ekranga qaytganda bugungi holatni yangilaymiz
  useEffect(() => {
    if (tab === 'home' && user) api.me().then(setUser).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (loading) return <div className="center muted">Yuklanmoqda…</div>;
  if (!user)
    return (
      <Login
        onLogin={(u) => {
          setUser(u);
          setTab(u.role === 'ADMIN' ? 'dashboard' : 'home');
        }}
      />
    );

  const isAdmin = user.role === 'ADMIN';
  const tabs = isAdmin ? ADMIN_TABS : EMPLOYEE_TABS;

  return (
    <div className="app">
      <header className="topbar">
        <button className="who" onClick={() => setTab('profile')} aria-label="Profil">
          <strong>{user.fullName}</strong>
          <div className="muted small">{user.org.name}</div>
        </button>
        <button className="link" onClick={logout}>Chiqish</button>
      </header>

      <main>
        {tab === 'home' && <Home user={user} onCheckIn={() => setTab('checkin')} />}
        {tab === 'checkin' && <CheckIn user={user} />}
        {tab === 'report' && <Report user={user} />}
        {tab === 'history' && <History />}
        {tab === 'profile' && <Profile user={user} onLogout={logout} />}
        {isAdmin && tab === 'dashboard' && <Dashboard />}
        {isAdmin && tab === 'journal' && <OrgAttendance />}
        {isAdmin && tab === 'orgReports' && <OrgReports />}
        {isAdmin && tab === 'territories' && <Territories />}
        {isAdmin && tab === 'users' && <Users meId={user.id} />}
      </main>

      <nav className="tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </nav>
    </div>
  );
}
