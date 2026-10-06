import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler, User } from './lib/api';
import { Filter } from './components/orgFilter';
import { NavBar, NavItem } from './components/ui';
import { AdminNavItem, AdminShell } from './components/admin';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Home from './pages/Home';
import CheckIn from './pages/CheckIn';
import History from './pages/History';
import Report from './pages/Report';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Zones from './pages/Zones';
import Staff from './pages/Staff';

type Route = 'home' | 'checkin' | 'history' | 'profile' | 'report' | 'panel' | 'journal' | 'zones' | 'staff' | 'orgReports';

const EMPLOYEE_NAV: NavItem[] = [
  { key: 'home', icon: 'home', label: 'Bosh' },
  { key: 'checkin', icon: 'pin', label: 'Belgilash' },
  { key: 'history', icon: 'history', label: 'Tarix' },
  { key: 'profile', icon: 'user', label: 'Profil' },
];
const ADMIN_NAV: AdminNavItem[] = [
  { key: 'panel', icon: 'dash', label: 'Panel' },
  { key: 'journal', icon: 'list', label: 'Davomat jurnali' },
  { key: 'orgReports', icon: 'doc', label: 'Hisobotlar' },
  { key: 'zones', icon: 'pin', label: 'Hududlar' },
  { key: 'staff', icon: 'group', label: 'Xodimlar' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!getToken());
  const [route, setRoute] = useState<Route>('home');
  const [histKind, setHistKind] = useState<'att' | 'rec'>('att');
  const [preset, setPreset] = useState<Partial<Filter> | undefined>();

  const start = (u: User) => {
    setUser(u);
    setRoute(u.role === 'ADMIN' ? 'panel' : 'home');
  };
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api.me().then(start).catch(() => setToken(null)).finally(() => setLoading(false));
  }, [logout]);

  // Bosh ekranga qaytganda bugungi holatni yangilaymiz
  useEffect(() => {
    if (route === 'home' && user) api.me().then(setUser).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  if (loading) return <div className="shell"><div className="loading">Yuklanmoqda…</div></div>;
  if (!user) return <Login onLogin={start} />;

  const go = (r: string) => setRoute(r as Route);

  if (user.role === 'ADMIN') {
    return (
      <div className="adm-root">
        <ToastProvider>
          <AdminShell nav={ADMIN_NAV} active={route} onSelect={(k) => { if (k === 'journal') setPreset(undefined); go(k); }} user={user} onProfile={() => go('profile')} onLogout={logout}>
            {route === 'panel' && <Dashboard onOpenJournal={(userId, date) => { setPreset({ userId, from: date, to: date }); go('journal'); }} />}
            {route === 'journal' && <Journal kind="att" preset={preset} />}
            {route === 'orgReports' && <Journal kind="rec" />}
            {route === 'zones' && <Zones />}
            {route === 'staff' && <Staff meId={user.id} />}
            {route === 'profile' && <div className="adm-profile"><Profile user={user} onLogout={logout} /></div>}
          </AdminShell>
        </ToastProvider>
      </div>
    );
  }

  // Tabs: "Hisobot" ichki sahifasi "Tarix" ostida yonadi
  const active = route === 'report' ? 'history' : route;
  const back = route === 'report' ? () => { setHistKind('rec'); go('history'); } : () => go('home');
  const sub = !EMPLOYEE_NAV.some((n) => n.key === route);

  return (
    <div className="shell">
      <ToastProvider>
        {route === 'home' && <Home user={user} go={go} />}
        {route === 'checkin' && <CheckIn user={user} onBack={() => go('home')} onDone={() => go('home')} />}
        {route === 'history' && <History kind={histKind} setKind={setHistKind} onBack={sub ? back : undefined} onNewReport={() => go('report')} />}
        {route === 'report' && <Report user={user} onBack={back} onDone={() => { setHistKind('rec'); go('history'); }} />}
        {route === 'profile' && <Profile user={user} onLogout={logout} onBack={sub ? back : undefined} />}
        <NavBar items={EMPLOYEE_NAV} active={active} onSelect={go} />
      </ToastProvider>
    </div>
  );
}
