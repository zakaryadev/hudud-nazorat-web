import { useMemo, useState } from 'react';
import { api, OrgUser } from '../lib/api';
import { useLoad } from '../lib/hooks';
import Icon from '../components/Icon';
import { Avatar, Field, Segmented, Sheet, Switch, Tag } from '../components/ui';
import { Col, DataTable, FilterSelect, matches, PageHead, PrimaryButton, SearchBar } from '../components/admin';
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
  const [text, setText] = useState('');
  const [role, setRole] = useState('');
  const [st, setSt] = useState('');
  const list = q.data ?? [];
  const rows = useMemo(
    () => list.filter((u) => (!role || u.role === role) && (!st || (st === 'on') === u.isActive) && matches(text, u.fullName, u.phone)),
    [list, text, role, st],
  );

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

  const cols: Col<OrgUser>[] = [
    { key: 'n', head: 'F.I.Sh', cell: (u) => <div className="who" style={{ opacity: u.isActive ? 1 : 0.55 }}><Avatar text={u.fullName} tone={u.role === 'ADMIN' ? '' : 't2'} size={32} />{u.fullName}</div> },
    { key: 'p', head: 'Telefon', width: '190px', cell: (u) => u.phone },
    { key: 'r', head: 'Rol', width: '160px', cell: (u) => <Tag tone={u.role === 'ADMIN' ? '' : 'neutral'}>{u.role === 'ADMIN' ? 'Administrator' : 'Xodim'}</Tag> },
    { key: 'a', head: 'Faol', width: '100px', cell: (u) => <span onClick={(e) => e.stopPropagation()}><Switch on={u.isActive} disabled={u.id === meId} onChange={(v) => setActive(u, v)} label={`${u.fullName}: faol`} /></span> },
    { key: 'ac', head: '', width: '56px', align: 'right', cell: (u) => <button className="ib sl" aria-label={`${u.fullName}: tafsilot`} onClick={(e) => { e.stopPropagation(); setSel(u); }}><Icon name="edit" /></button> },
  ];

  return (
    <>
      <PageHead title="Xodimlar" sub={<>Jami topildi: <b>{rows.length}</b> ta</>} actions={<PrimaryButton icon="add" onClick={() => setAdd(true)}>Xodim qo‘shish</PrimaryButton>} />
      <SearchBar value={text} onSubmit={setText} placeholder="F.I.Sh yoki telefon" activeFilters={(role ? 1 : 0) + (st ? 1 : 0)}
        filters={<>
          <FilterSelect label="Rol" value={role} onChange={setRole} options={[{ value: '', label: 'Barchasi' }, { value: 'EMPLOYEE', label: 'Xodim' }, { value: 'ADMIN', label: 'Administrator' }]} />
          <FilterSelect label="Holat" value={st} onChange={setSt} options={[{ value: '', label: 'Barchasi' }, { value: 'on', label: 'Faol' }, { value: 'off', label: 'Nofaol' }]} />
        </>} />
      <DataTable cols={cols} rows={rows} rowKey={(u) => u.id} onRow={setSel} loading={q.loading} error={q.error} onRetry={q.reload}
        empty={{ icon: 'group', title: 'Xodimlar yo‘q', hint: '“Xodim qo‘shish” tugmasi bilan xodim qo‘shing' }} />
      <NewUserSheet open={add} onClose={() => setAdd(false)} onSaved={q.reload} />
      <UserSheet user={sel} onClose={() => setSel(null)} onSaved={q.reload} />
    </>
  );
}
