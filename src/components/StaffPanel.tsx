import { FormEvent, useCallback, useEffect, useState } from 'react';
import { UserPlus, RefreshCw, Users, Loader2 } from 'lucide-react';

type StaffMember = {
  id: string; name: string; email: string | null; phone: string | null; role: string;
  status: 'active' | 'inactive'; availability: 'available' | 'unavailable';
  activeTaskCount: number; effectiveAvailability: 'available' | 'busy' | 'unavailable';
};

interface StaffPanelProps { token: string; }

export default function StaffPanel({ token }: StaffPanelProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/staff', { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to load staff directory.');
      setStaff(Array.isArray(body.staff) ? body.staff : []);
    } catch (err: any) { setError(err?.message || 'Staff directory unavailable.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void loadStaff(); }, [loadStaff]);

  const createStaff = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(null);
    try {
      const response = await fetch('/api/staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, role, email: email || null, phone: phone || null })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to create staff member.');
      setName(''); setRole(''); setEmail(''); setPhone(''); await loadStaff();
    } catch (err: any) { setError(err?.message || 'Unable to create staff member.'); }
    finally { setSaving(false); }
  };

  const updateStaff = async (member: StaffMember, patch: Partial<StaffMember>) => {
    setError(null);
    const next = { ...member, ...patch };
    try {
      const response = await fetch(`/api/staff/${encodeURIComponent(member.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: next.name, role: next.role, email: next.email, phone: next.phone, status: next.status, availability: next.availability })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to update staff member.');
      await loadStaff();
    } catch (err: any) { setError(err?.message || 'Unable to update staff member.'); }
  };

  return <div className="space-y-5 min-w-0">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="flex items-center gap-2 text-accent mb-2"><Users className="w-4 h-4" /><span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em]">People operations</span></div>
        <h1 className="text-2xl font-display font-semibold text-text-primary">Staff Management</h1>
        <p className="text-sm text-text-secondary mt-1 max-w-2xl">Maintain the real staff roster, responsibilities and availability. Active assignments determine who is currently busy.</p>
      </div>
      <button onClick={() => void loadStaff()} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border-default bg-bg-raised text-text-secondary text-xs font-mono"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
    </div>

    <form onSubmit={createStaff} className="border border-border-default bg-bg-raised rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><UserPlus className="w-4 h-4 text-accent" /> Add staff member</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-[10px] text-text-tertiary font-mono uppercase">Full name<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-sm text-text-primary normal-case" /></label>
        <label className="text-[10px] text-text-tertiary font-mono uppercase">Role / responsibility<input required maxLength={80} value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Sales, Operations, Field Research" className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-sm text-text-primary normal-case" /></label>
        <label className="text-[10px] text-text-tertiary font-mono uppercase">Email (optional)<input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-sm text-text-primary normal-case" /></label>
        <label className="text-[10px] text-text-tertiary font-mono uppercase">Phone (optional)<input value={phone} onChange={e => setPhone(e.target.value)} maxLength={40} className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-sm text-text-primary normal-case" /></label>
      </div>
      <div className="flex justify-end"><button type="submit" disabled={saving || !name.trim() || !role.trim()} className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-accent text-black text-xs font-bold disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />} Add to roster</button></div>
    </form>

    {error && <div role="alert" className="border border-danger/30 bg-danger/5 text-danger rounded-lg p-3 text-sm">{error}</div>}
    {loading ? <div className="p-8 text-center text-sm text-text-tertiary">Loading staff…</div> : staff.length === 0 ? <div className="border border-dashed border-border-default rounded-xl p-10 text-center"><Users className="w-8 h-8 mx-auto text-text-tertiary mb-3" /><h2 className="text-sm font-semibold text-text-primary">No staff records yet</h2><p className="text-xs text-text-secondary mt-2">Add your actual team members to make named task ownership available in Work Queue.</p></div> : <div className="space-y-2">
      {staff.map(member => <article key={member.id} className="border border-border-default bg-bg-raised rounded-lg p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><h2 className="text-sm font-semibold text-text-primary">{member.name}</h2><div className="flex flex-wrap items-center gap-2 mt-1"><input aria-label={`Role for ${member.name}`} defaultValue={member.role} onBlur={e => { if (e.target.value.trim() && e.target.value.trim() !== member.role) void updateStaff(member, { role: e.target.value.trim() }); }} maxLength={80} className="max-w-52 bg-bg-base border border-border-default rounded px-2 py-1 text-xs text-text-secondary" />{member.email && <span className="text-xs text-text-secondary">{member.email}</span>}{member.phone && <span className="text-xs text-text-secondary">{member.phone}</span>}</div><p className="text-[10px] text-text-tertiary font-mono mt-2">{member.activeTaskCount} active assignment{member.activeTaskCount === 1 ? '' : 's'} · {member.effectiveAvailability}</p></div>
          <div className="flex flex-wrap gap-2">
            <label className="text-[9px] text-text-tertiary font-mono uppercase">Availability<select value={member.availability} onChange={e => void updateStaff(member, { availability: e.target.value as StaffMember['availability'] })} className="block mt-1 bg-bg-base border border-border-default rounded px-2 py-1.5 text-xs text-text-primary"><option value="available">Available</option><option value="unavailable">Unavailable</option></select></label>
            <label className="text-[9px] text-text-tertiary font-mono uppercase">Employment<select value={member.status} onChange={e => void updateStaff(member, { status: e.target.value as StaffMember['status'] })} className="block mt-1 bg-bg-base border border-border-default rounded px-2 py-1.5 text-xs text-text-primary"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          </div>
        </div>
      </article>)}
    </div>}
  </div>;
}
