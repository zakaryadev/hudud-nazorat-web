import { useEffect, useState } from 'react';
import { User } from '../lib/api';
import { applyTheme, getTheme, isDark } from '../lib/theme';
import { Avatar, ListItem, Switch, Tag, TopBar } from '../components/ui';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';

interface InstallEvent extends Event { prompt: () => Promise<void> }

export default function Profile({ user, onLogout, onBack }: { user: User; onLogout: () => void; onBack?: () => void }) {
  const toast = useToast();
  const [dark, setDark] = useState(isDark());
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const standalone = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  const toggle = (v: boolean) => { applyTheme(v ? 'dark' : 'light'); setDark(v); };
  const installApp = () =>
    install ? install.prompt() : toast('Brauzer menyusidan “Bosh ekranga qo‘shish” ni tanlang');

  return (
    <>
      <TopBar title="Profil" onBack={onBack} />
      <div className="scroll">
        <div className="profile">
          <Avatar text={user.fullName} />
          <h2>{user.fullName}</h2>
          <div className="muted">{user.phone}</div>
          <Tag tone="neutral">{user.org.name} · {user.role === 'ADMIN' ? 'Administrator' : 'Xodim'}</Tag>
        </div>
        <div className="card list">
          <ListItem
            lead={<Avatar tone="t2" icon={dark ? 'moon' : 'sun'} />}
            title="Qorong‘i rejim"
            sub={getTheme() ? 'Qo‘lda tanlangan' : 'Tizim sozlamasiga mos'}
            trail={<Switch on={dark} onChange={toggle} label="Qorong‘i rejim" />}
          />
          {!standalone && <ListItem lead={<Avatar tone="t2" icon="phone" />} title="Ilovani o‘rnatish" sub="Bosh ekranga qo‘shish" trail={<Icon name="chevron" />} onClick={installApp} />}
          <ListItem lead={<Avatar tone="err" icon="logout" />} title="Chiqish" onClick={onLogout} />
        </div>
      </div>
    </>
  );
}
