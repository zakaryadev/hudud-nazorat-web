import Icon, { IconName } from '../components/Icon';
import { Avatar, ListItem, TopBar } from '../components/ui';

// Admin: asosiy 4 bo'limga sig'magan narsalar
export default function More({ go, onLogout }: { go: (route: string) => void; onLogout: () => void }) {
  const item = (icon: IconName, title: string, sub: string, route: string) => (
    <ListItem lead={<Avatar tone="t2" icon={icon} />} title={title} sub={sub} trail={<Icon name="chevron" />} onClick={() => go(route)} />
  );
  return (
    <>
      <TopBar title="Yana" />
      <div className="scroll">
        <div className="card list">
          {item('doc', 'Hisobotlar', 'Xodimlar yuborgan hisobotlar', 'orgReports')}
          {item('pin', 'Belgilash', 'Admin sifatida davomat belgilash', 'checkin')}
          {item('add', 'Hisobot yuborish', 'Tashrif haqida yozuv', 'report')}
          {item('history', 'Mening tarixim', 'O‘z davomat va hisobotlaringiz', 'history')}
          {item('user', 'Profil', 'Rejim, ilovani o‘rnatish', 'profile')}
        </div>
        <div className="card list">
          <ListItem lead={<Avatar tone="err" icon="logout" />} title="Chiqish" onClick={onLogout} />
        </div>
      </div>
    </>
  );
}
