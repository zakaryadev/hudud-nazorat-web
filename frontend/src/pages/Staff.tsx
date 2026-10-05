import { useState } from 'react';
import { api, OrgUser } from '../lib/api';
import { useLoad } from '../lib/hooks';
import { Avatar, EmptyState, Fab, Field, ListItem, Segmented, Sheet, Skeleton, Switch, Tag, TopBar } from '../components/ui';
import { LoadError } from '../components/Parts';
import { useToast } from '../components/Toast';

function NewUserSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ fullName: '', phone: '+998', password: '', role: 'EMPLOYEE' as 'EMPLOYEE' | 'ADMIN' });
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!f.fullName.trim() || f.phone.trim().length < 9 || f.password.length < 4) return toast('Hamma maydonni to‘ldiring (parol kamida 4 belgi)');
    setBusy(true);
    try {
      await api.createUser({ ...f, fullName: f.fullName.trim(), phone: f.phone.trim() });
      toast('Xodim qo‘shildi');
      setF({ fullName: '', phone: '+998', password: '', role: 'EMPLOYEE' });
      onSaved();
      onClose();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet open={open} onClose={onClose} title="Yangi xodim">
      <Field label="F.I.Sh" value={f.fullName} onChange={(v) => setF({ ...f, fullName: v })} required />
      <Field label="Telefon" type="tel" inputMode="tel" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} required />
      <Field label="Parol (kamida 4 belgi)" value={f.password} onChange={(v) => setF({ ...f, password: v })} autoComplete="off" required />
      <Segmented value={f.role} onChange={(role) => setF({ ...f, role })} options={[{ value: 'EMPLOYEE', label: 'Xodim' }, { value: 'ADMIN', label: 'Administrator' }]} />
      <div className="actions">
        <button className="btn text sl" onClick={onClose}>Bekor</button>
        <button className="btn fill sl" disabled={busy} onClick={save}>{busy ? 'Saqlanmoqda…' : 'Qo‘shish'}</button>
      </div>
    </Sheet>
  );
}

function UserSheet({ user, onClose, onSaved }: { user: OrgUser | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  async function savePw() {
    if (!user) return;
    try {
      await api.updateUser(user.id, { password: pw });
      toast('Parol almashtirildi');
      setPw('');
      onSaved();
      onClose();
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <Sheet open={!!user} onClose={onClose} title={user?.fullName}>
      {user && (
        <>
          <dl className="detail">
            <dt>Telefon</dt><dd>{user.phone}</dd>
            <dt>Rol</dt><dd>{user.role === 'ADMIN' ? 'Administrator' : 'Xodim'}</dd>
            <dt>Holat</dt><dd><Tag tone={user.isActive ? 'ok' : 'neutral'}>{user.isActive ? 'Faol' : 'Nofaol'}</Tag></dd>
          </dl>
          <Field label="Yangi parol (kamida 4 belgi)" value={pw} onChange={setPw} autoComplete="off" />
          <div className="actions">
            <button className="btn text sl" onClick={onClose}>Yopish</button>
            <button className="btn fill sl" disabled={pw.length < 4} onClick={savePw}>Parolni almashtirish</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

export default function Staff({ meId }: { meId: string }) {
  const toast = useToast();
  const q = useLoad(() => api.users(), []);
  const [add, setAdd] = useState(false);
  const [sel, setSel] = useState<OrgUser | null>(null);
  const list = q.data ?? [];

  async function setActive(u: OrgUser, v: boolean) {
    q.setData((d) => d && d.map((x) => (x.id === u.id ? { ...x, isActive: v } : x))); // darhol ko'rsatamiz
    try {
      await api.updateUser(u.id, { isActive: v });
      toast(v ? 'Xodim faollashtirildi' : 'Xodim nofaol qilindi');
    } catch (e) {
      toast((e as Error).message);
      q.reload();
    }
  }

  return (
    <>
      <TopBar title="Xodimlar" sub={q.data ? `${list.length} ta xodim` : undefined} />
      <div className="scroll">
        {q.error ? <LoadError message={q.error} onRetry={q.reload} /> : q.loading && !q.data ? <Skeleton rows={4} /> :
          !list.length ? <EmptyState icon="group" title="Xodimlar yo‘q" hint="“+” tugmasi bilan xodim qo‘shing" /> : (
            <div className="card list">
              {list.map((u) => (
                <ListItem key={u.id} onClick={() => setSel(u)}
                  lead={<div style={{ opacity: u.isActive ? 1 : 0.5 }}><Avatar text={u.fullName} tone={u.role === 'ADMIN' ? '' : 't2'} /></div>}
                  title={<span style={{ opacity: u.isActive ? 1 : 0.6 }}>{u.fullName}</span>}
                  sub={`${u.role === 'ADMIN' ? 'Administrator' : 'Xodim'} · ${u.isActive ? 'faol' : 'nofaol'}`}
                  trail={<span onClick={(e) => e.stopPropagation()}><Switch on={u.isActive} disabled={u.id === meId} onChange={(v) => setActive(u, v)} label={`${u.fullName}: faol`} /></span>} />
              ))}
            </div>
          )}
      </div>
      <Fab icon="add" label="Xodim qo‘shish" onClick={() => setAdd(true)} />
      <NewUserSheet open={add} onClose={() => setAdd(false)} onSaved={q.reload} />
      <UserSheet user={sel} onClose={() => setSel(null)} onSaved={q.reload} />
    </>
  );
}
