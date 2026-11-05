import { useCallback, useEffect, useState } from 'react';
import { Search, RefreshCw, ShieldCheck, Users, UserCheck, UserX, ShieldAlert } from 'lucide-react';

type Account = {
  id: string; companyName: string; email: string; city: string; serviceType: string;
  role: 'admin' | 'user'; accountStatus: 'active' | 'suspended';
  createdAt: string; lastLoginAt: string | null;
};
type Overview = { contractors: number; active: number; suspended: number; activeAdministrators: number };

export default function AdminConsolePanel({ token }: { token: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryResponse, directoryResponse] = await Promise.all([
        fetch('/api/admin/overview', { headers, cache: 'no-store' }),
        fetch(`/api/admin/contractors${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`, { headers, cache: 'no-store' })
      ]);
      if (!summaryResponse.ok || !directoryResponse.ok) {
        const failed = !summaryResponse.ok ? summaryResponse : directoryResponse;
        throw new Error(failed.status === 403 ? 'Administrator access is required.' : 'Unable to load platform administration data.');
      }
      const [summary, directory] = await Promise.all([summaryResponse.json(), directoryResponse.json()]);
      setOverview(summary); setAccounts(directory.contractors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the admin console.');
    } finally { setLoading(false); }
  }, [token, search]);

  useEffect(() => { void load(); }, [load]);

  const updateAccount = async (account: Account, change: { role?: 'admin' | 'user'; accountStatus?: 'active' | 'suspended' }) => {
    setBusyId(account.id); setError('');
    try {
      const response = await fetch(`/api/admin/contractors/${encodeURIComponent(account.id)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(change)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Account update failed.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account update failed.');
    } finally { setBusyId(null); }
  };

  const cards = [
    { label: 'Total workspaces', value: overview?.contractors ?? '—', Icon: Users },
    { label: 'Active accounts', value: overview?.active ?? '—', Icon: UserCheck },
    { label: 'Suspended', value: overview?.suspended ?? '—', Icon: UserX },
    { label: 'Active admins', value: overview?.activeAdministrators ?? '—', Icon: ShieldCheck }
  ];

  return <section className="h-full overflow-y-auto p-4 md:p-6 space-y-6" aria-labelledby="admin-console-title">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="text-[10px] font-mono tracking-[0.22em] text-accent uppercase">Platform control</div>
        <h1 id="admin-console-title" className="mt-1 text-xl font-semibold text-text-primary">Admin Console</h1>
        <p className="mt-1 text-xs text-text-secondary">Manage contractor access without opening private business workspaces.</p>
      </div>
      <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border-dim px-3 py-2 text-xs text-text-primary hover:bg-bg-subtle disabled:opacity-50">
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
      </button>
    </header>

    {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}

    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map(({ label, value, Icon }) => <div key={label} className="rounded-xl border border-border-dim bg-bg-raised p-4">
        <div className="flex items-center justify-between text-text-tertiary"><span className="text-[10px] uppercase tracking-wider">{label}</span><Icon className="h-4 w-4" /></div>
        <div className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">{value}</div>
      </div>)}
    </div>

    <div className="rounded-xl border border-border-dim bg-bg-raised overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-dim p-4">
        <div><h2 className="text-sm font-semibold text-text-primary">Contractor accounts</h2><p className="mt-1 text-[11px] text-text-tertiary">Up to 200 matching accounts. Access changes are written to the audit log.</p></div>
        <label className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search company, email or city" className="w-full rounded-lg border border-border-dim bg-bg-base py-2 pl-9 pr-3 text-xs text-text-primary outline-none focus:border-accent" />
        </label>
      </div>
      {loading ? <div className="p-8 text-center text-xs text-text-tertiary">Loading platform accounts…</div> : accounts.length === 0 ? <div className="p-8 text-center text-xs text-text-tertiary">No contractor accounts found.</div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-bg-overlay text-[10px] uppercase tracking-wider text-text-tertiary"><tr><th className="px-4 py-3">Workspace</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Access</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-border-dim/70">{accounts.map(account => <tr key={account.id} className="text-text-secondary">
            <td className="px-4 py-3"><div className="font-medium text-text-primary">{account.companyName}</div><div className="mt-0.5 text-[10px] text-text-tertiary">{account.email}</div><div className="mt-0.5 font-mono text-[9px] text-text-tertiary">{account.id}</div></td>
            <td className="px-4 py-3"><div>{account.city}</div><div className="text-[10px] text-text-tertiary">{account.serviceType}</div></td>
            <td className="px-4 py-3"><span className="rounded-full border border-border-dim px-2 py-1 text-[10px]">{account.role}</span></td>
            <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] ${account.accountStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{account.accountStatus}</span></td>
            <td className="px-4 py-3 text-[10px]">{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : 'Never'}</td>
            <td className="px-4 py-3"><div className="flex items-center gap-2">
              <button disabled={busyId === account.id || (account.role === 'admin' && account.accountStatus === 'active' && overview?.activeAdministrators === 1)} onClick={() => void updateAccount(account, { role: account.role === 'admin' ? 'user' : 'admin' })} className="rounded-md border border-border-dim px-2 py-1.5 hover:border-accent disabled:opacity-40">{account.role === 'admin' ? 'Remove admin' : 'Make admin'}</button>
              <button disabled={busyId === account.id} onClick={() => void updateAccount(account, { accountStatus: account.accountStatus === 'active' ? 'suspended' : 'active' })} className="rounded-md border border-border-dim px-2 py-1.5 hover:border-accent disabled:opacity-40">{account.accountStatus === 'active' ? 'Suspend' : 'Reactivate'}</button>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>}
    </div>

    <div className="flex items-start gap-2 rounded-lg border border-border-dim bg-bg-overlay p-3 text-[11px] text-text-tertiary">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>Server-side authorization uses persisted roles. Suspended accounts are denied on authenticated requests. The final active administrator cannot be removed or suspended.</p>
    </div>
  </section>;
}
