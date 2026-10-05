import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler, User } from './lib/api';
import { Filter } from './components/FilterSheet';
import { NavBar, NavItem } from './components/ui';
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
import More from './pages/More';

type Route = 'home' | 'checkin' | 'history' | 'profile' | 'report' | 'panel' | 'journal' | 'zones' | 'staff' | 'more' | 'orgReports';

const EMPLOYEE_NAV: NavItem[] = [
  { key: 'home', icon: 'home', label: 'Bosh' },
  { key: 'checkin', icon: 'pin', label: 'Belgilash' },
  { key: 'history', icon: 'history', label: 'Tarix' },
  { key: 'profile', icon: 'user', label: 'Profil' },
];
const ADMIN_NAV: NavItem[] = [
  { key: 'panel', icon: 'dash', label: 'Panel' },
  { key: 'journal', icon: 'list', label: 'Jurnal' },
  { key: 'zones', icon: 'pin', label: 'Hududlar' },
  { key: 'staff', icon: 'group', label: 'Xodimlar' },
  { key: 'more', icon: 'more', label: 'Yana' },
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

  const admin = user.role === 'ADMIN';
  const nav = admin ? ADMIN_NAV : EMPLOYEE_NAV;
  const go = (r: string) => setRoute(r as Route);
  // Pastki menyuda qaysi tab yonib turadi: admin ichki sahifalari "Yana" ostida
  const tabs = nav.map((n) => n.key);
  const active = tabs.includes(route) ? route : admin ? 'more' : route === 'report' ? 'history' : 'home';
  // Ichki sahifalarda "Orqaga" qayerga qaytaradi
  const back = admin ? () => go('more') : route === 'report' ? () => { setHistKind('rec'); go('history'); } : () => go('home');
  const sub = !tabs.includes(route);

  return (
    <div className="shell">
      <ToastProvider>
        {route === 'home' && <Home user={user} go={go} />}
        {route === 'checkin' && <CheckIn user={user} onBack={() => (admin ? go('more') : go('home'))} onDone={() => go(admin ? 'panel' : 'home')} />}
        {route === 'history' && <History kind={histKind} setKind={setHistKind} onBack={sub ? back : undefined} onNewReport={() => go('report')} />}
        {route === 'report' && <Report user={user} onBack={back} onDone={() => { setHistKind('rec'); go('history'); }} />}
        {route === 'profile' && <Profile user={user} onLogout={logout} onBack={sub ? back : undefined} />}
        {admin && route === 'panel' && <Dashboard onOpenJournal={(userId, date) => { setPreset({ userId, from: date, to: date }); go('journal'); }} />}
        {admin && route === 'journal' && <Journal kind="att" preset={preset} />}
        {admin && route === 'orgReports' && <Journal kind="rec" onBack={back} />}
        {admin && route === 'zones' && <Zones />}
        {admin && route === 'staff' && <Staff meId={user.id} />}
        {admin && route === 'more' && <More go={go} onLogout={logout} />}
        <NavBar items={nav} active={active} onSelect={(k) => { if (k === 'journal') setPreset(undefined); go(k); }} />
      </ToastProvider>
    </div>
  );
}
