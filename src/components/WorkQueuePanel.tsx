import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Bot, CheckCircle2, ListTodo, Loader2, Play, Plus, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { readApiResponse } from '../lib/apiResponse';

type WorkerCapability = { id: string; label: string; mode: string; canClaimTasks: boolean; supportedTaskTypes: string[]; description: string; configured?: boolean; };
type StaffMember = { id: string; name: string; role: string; effectiveAvailability: 'available' | 'busy' | 'unavailable'; activeTaskCount: number; };

type WorkTask = {
  id: string; taskType: string; title: string; description: string | null;
  status: string; priority: string; assignedWorker: string; assignedStaffId: string | null; entityType: string | null;
  entityId: string | null; correlationId: string | null; requiresApproval: boolean;
  approvedAt: string | null; attemptCount: number; maxAttempts: number;
  errorMessage: string | null; output?: Record<string, any> | null; createdAt: string; updatedAt: string;
};

interface WorkQueuePanelProps { token: string; }

const statusTone: Record<string, string> = {
  queued: 'text-sky-400 border-sky-400/30 bg-sky-400/5',
  running: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  awaiting_approval: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  completed: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  failed: 'text-red-400 border-red-400/30 bg-red-400/5',
  cancelled: 'text-text-tertiary border-border-default bg-bg-subtle'
};

export default function WorkQueuePanel({ token }: WorkQueuePanelProps) {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [workerCapabilities, setWorkerCapabilities] = useState<WorkerCapability[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState('research');
  const [description, setDescription] = useState('');
  const [inputJson, setInputJson] = useState('{}');
  const [assignedWorker, setAssignedWorker] = useState('human');
  const [priority, setPriority] = useState('normal');
  const [requiresApproval, setRequiresApproval] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/work-tasks?limit=100', { headers: { Authorization: `Bearer ${token}` } });
      const body = await readApiResponse<any>(response, 'Work queue request');
      if (!response.ok) throw new Error(body.error || 'Unable to load work queue.');
      setTasks(Array.isArray(body.tasks) ? body.tasks : []);
      try {
        const staffResponse = await fetch('/api/staff', { headers: { Authorization: `Bearer ${token}` } });
        if (staffResponse.ok) {
          const staffBody = await readApiResponse<any>(staffResponse, 'Staff directory request');
          setStaff(Array.isArray(staffBody.staff) ? staffBody.staff : []);
        }
      } catch { /* Existing queue tasks remain visible if staff metadata is unavailable. */ }
      try {
        const workerResponse = await fetch('/api/workers', { headers: { Authorization: `Bearer ${token}` } });
        if (workerResponse.ok) {
          const workerBody = await readApiResponse<any>(workerResponse, 'Worker capability request');
          setWorkerCapabilities(Array.isArray(workerBody.workers) ? workerBody.workers : []);
        }
      } catch {
        // Queue remains usable if capability metadata is temporarily unavailable.
      }
    } catch (err: any) { setError(err?.message || 'Work queue unavailable.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    let taskInput: Record<string, unknown> | undefined;
    if (assignedWorker === 'hermes') {
      try {
        const parsed = JSON.parse(inputJson || '{}');
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Input must be a JSON object.');
        taskInput = parsed as Record<string, unknown>;
      } catch (err: any) {
        setError(err?.message || 'Hermes input must be valid JSON.');
        return;
      }
    }
    setSaving(true); setError(null);
    try {
      const response = await fetch('/api/work-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taskType, title: title.trim(), description: description.trim() || undefined, assignedWorker, ...(assignedWorker === 'human' && assignedStaffId ? { assignedStaffId } : {}), priority, requiresApproval, ...(taskInput ? { input: taskInput } : {}) })
      });
      const body = await readApiResponse<any>(response, 'Create work item');
      if (!response.ok) throw new Error(body.error || 'Unable to create task.');
      setTitle(''); setDescription(''); setTaskType('research'); setInputJson('{}'); setRequiresApproval(false); setAssignedStaffId('');
      await loadTasks();
    } catch (err: any) { setError(err?.message || 'Unable to create task.'); }
    finally { setSaving(false); }
  };

  const transition = async (task: WorkTask, status: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/work-tasks/${encodeURIComponent(task.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, ...(status === 'failed' ? { errorMessage: 'Marked failed by workspace operator.' } : {}) })
      });
      const body = await readApiResponse<any>(response, 'Update work item');
      if (!response.ok) throw new Error(body.error || 'Task update failed.');
      await loadTasks();
    } catch (err: any) { setError(err?.message || 'Task update failed.'); }
  };


  const assignStaff = async (task: WorkTask, staffId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/work-tasks/${encodeURIComponent(task.id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignedStaffId: staffId || null })
      });
      const body = await readApiResponse<any>(response, 'Assign staff member');
      if (!response.ok) throw new Error(body.error || 'Unable to assign staff member.');
      await loadTasks();
    } catch (err: any) { setError(err?.message || 'Unable to assign staff member.'); }
  };
 
  const executeWithHermes = async (task: WorkTask) => {
    setError(null);
    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jsonrpc: '2.0', id: `work-${task.id}`, method: 'tools/call', params: { name: 'hal_execute_hermes_work_task', arguments: { taskId: task.id } } })
      });
      const body = await readApiResponse<any>(response, 'Hermes execution');
      if (!response.ok) throw new Error(body.error?.message || body.error || 'Hermes execution failed.');
      const result = body.structuredData || body.result?.structuredData;
      if (result?.success === false) throw new Error(result.error || 'Hermes could not complete this task.');
      await loadTasks();
    } catch (err: any) {
      setError(err?.message || 'Unable to execute this task with Hermes.');
      await loadTasks();
    }
  };

  const counts = tasks.reduce((acc, task) => { acc[task.status] = (acc[task.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-accent mb-2"><ListTodo className="w-4 h-4" /><span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em]">Work orchestration</span></div>
          <h1 className="text-2xl font-display font-semibold text-text-primary">Work Queue</h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">Assign work to a person or specialist worker, track its state and preserve the execution trail. A queued task is an assignment, not proof that an agent has executed it.</p>
        </div>
        <button onClick={() => void loadTasks()} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border-default bg-bg-raised text-text-secondary hover:text-text-primary disabled:opacity-50 text-xs font-mono"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {['queued', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled'].map(status => (
          <div key={status} className="border border-border-default bg-bg-raised rounded-lg p-3">
            <div className="text-[9px] uppercase tracking-wider text-text-tertiary font-mono">{status.replace('_', ' ')}</div>
            <div className="text-xl font-semibold text-text-primary mt-1 tabular-nums">{counts[status] || 0}</div>
          </div>
        ))}
      </div>

      <section className="border border-border-default bg-bg-raised rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Worker readiness</h2>
          <span className="text-[10px] text-text-tertiary font-mono">Verified execution boundaries</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {workerCapabilities.map(worker => (
            <div key={worker.id} className="rounded-lg border border-border-default bg-bg-base p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-text-primary">{worker.label}</span>
                <span className="text-[9px] uppercase tracking-wide text-text-tertiary font-mono">{worker.mode.replace('_', ' ')}</span>
              </div>
              <p className="text-[10px] leading-relaxed text-text-secondary mt-1">{worker.description}</p>
              {worker.configured !== undefined && <p className="text-[9px] text-text-tertiary mt-2">Provider key: {worker.configured ? 'configured' : 'not configured'}</p>}
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={createTask} className="border border-border-default bg-bg-raised rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Plus className="w-4 h-4 text-accent" /> Create work item</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-[10px] text-text-tertiary font-mono uppercase">Task title
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={180} required placeholder="e.g. Audit the selected plumbing prospects" className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-sm text-text-primary outline-none focus:border-accent normal-case" />
          </label>
          <label className="text-[10px] text-text-tertiary font-mono uppercase">Task type
            <input value={taskType} onChange={e => setTaskType(e.target.value)} maxLength={80} required className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-sm text-text-primary outline-none focus:border-accent normal-case" />
          </label>
          <label className="text-[10px] text-text-tertiary font-mono uppercase">Assigned worker
            <select value={assignedWorker} onChange={e => setAssignedWorker(e.target.value)} className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-sm text-text-primary">
              {['human', 'hal_assistant', 'hermes', 'gemini', 'nemotron'].map(workerId => {
                const worker = workerCapabilities.find(item => item.id === workerId);
                return <option key={workerId} value={workerId}>{worker?.label || workerId} — {worker?.mode || 'status unavailable'}</option>;
              })}
            </select>
          </label>
          {assignedWorker === 'human' && <label className="text-[10px] text-text-tertiary font-mono uppercase">Named staff owner (optional)
            <select value={assignedStaffId} onChange={e => setAssignedStaffId(e.target.value)} className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-sm text-text-primary">
              <option value="">Unassigned human work</option>
              {staff.filter(member => member.effectiveAvailability === 'available').map(member => <option key={member.id} value={member.id}>{member.name} — {member.role}</option>)}
            </select>
            {staff.length === 0 && <span className="block mt-1 text-[9px] normal-case">Add employees in Staff Management before assigning named owners.</span>}
          </label>}
          {assignedWorker === 'hermes' && (
            <label className="text-[10px] text-text-tertiary font-mono uppercase md:col-span-2">Hermes task input (JSON)
              <textarea value={inputJson} onChange={e => setInputJson(e.target.value)} rows={4} spellCheck={false} placeholder={'{ "message": "Review the current lead pipeline and identify missing evidence." }' } className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-xs font-mono text-text-primary outline-none focus:border-accent normal-case resize-y" />
              <span className="block mt-1 text-[9px] text-text-tertiary normal-case">Use task type hermes_lab_asset with a registered toolId and parameters to generate an asset, or hermes_agent_task with a message and optional artifactId to ask the existing Hermes Studio agent to analyze workspace context or revise that artifact.</span>
            </label>
          )}
          <label className="text-[10px] text-text-tertiary font-mono uppercase">Priority
            <select value={priority} onChange={e => setPriority(e.target.value)} className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-sm text-text-primary">
              {['low', 'normal', 'high', 'urgent'].map(value => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-[10px] text-text-tertiary font-mono uppercase">Instructions
          <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={2} placeholder="Describe the expected result and any constraints…" className="mt-1 w-full rounded-md bg-bg-base border border-border-default p-2.5 text-sm text-text-primary outline-none focus:border-accent normal-case resize-y" />
        </label>
        <label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={requiresApproval} onChange={e => setRequiresApproval(e.target.checked)} /> Require approval before this task can be queued for execution</label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-text-tertiary">Agent workers are assignment targets; automated execution is enabled only where a verified executor is connected.</p>
          <button type="submit" disabled={saving || !title.trim()} className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-accent text-black text-xs font-bold disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Queue task</button>
        </div>
      </form>

      {error && <div className="border border-danger/30 bg-danger/5 text-danger rounded-lg p-3 text-sm">{error}</div>}
      {loading ? <div className="p-8 text-center text-sm text-text-tertiary">Loading work queue…</div> : tasks.length === 0 ? (
        <div className="border border-dashed border-border-default rounded-xl p-10 text-center"><ListTodo className="w-8 h-8 mx-auto text-text-tertiary mb-3" /><h2 className="text-sm font-semibold text-text-primary">No assigned work yet</h2><p className="text-xs text-text-secondary mt-2">Create a task above or let a connected MCP agent enqueue work.</p></div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <article key={task.id} className="border border-border-default bg-bg-raised rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-text-primary">{task.title}</h3><span className={`text-[9px] px-2 py-0.5 border rounded font-mono uppercase ${statusTone[task.status] || ''}`}>{task.status.replace('_', ' ')}</span><span className="text-[9px] text-text-tertiary font-mono uppercase">{task.priority}</span></div>
                  {task.description && <p className="text-xs text-text-secondary mt-2 whitespace-pre-wrap">{task.description}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[10px] text-text-tertiary font-mono"><span className="inline-flex items-center gap-1"><Bot className="w-3 h-3" />{task.assignedWorker === 'human' ? (staff.find(member => member.id === task.assignedStaffId)?.name || 'Human — unassigned') : task.assignedWorker}</span><span>{task.taskType}</span><span>{task.attemptCount}/{task.maxAttempts} attempts</span><span>{new Date(task.createdAt).toLocaleString()}</span>{task.requiresApproval && <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" />{task.approvedAt ? 'approved' : 'approval required'}</span>}</div>
                  {task.assignedWorker === 'human' && task.assignedStaffId && <p className="text-[10px] text-text-tertiary mt-1">Role: {staff.find(member => member.id === task.assignedStaffId)?.role || 'Staff record'}</p>}
                  {task.assignedWorker !== 'human' && task.status === 'running' && <p className="text-[10px] text-amber-300 mt-2">Execution is owned by {task.assignedWorker}; a human cannot mark agent work complete. The registered executor must submit its receipt.</p>}
                  {task.assignedWorker !== 'human' && task.status === 'queued' && (() => {
                    const worker = workerCapabilities.find(item => item.id === task.assignedWorker);
                    const supported = worker?.supportedTaskTypes.includes(task.taskType) || false;
                    return <p className="text-[10px] text-text-tertiary mt-2">{supported ? 'A registered executor supports this task type.' : 'No verified executor currently supports this worker/task combination. It remains queued, not running.'}</p>;
                  })()}
                  {task.output?.replyText && <div className="mt-3 rounded-md border border-border-default bg-bg-base p-3"><div className="text-[9px] font-mono uppercase tracking-wider text-text-tertiary mb-1">Hermes result</div><p className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">{task.output.replyText}</p>{task.output.updatedArtifactId && <p className="text-[10px] text-text-tertiary mt-2">Updated artifact: {task.output.updatedArtifactId}</p>}</div>}
                  {task.output?.artifactId && <p className="text-[10px] text-text-tertiary mt-2">Artifact receipt: {task.output.artifactId} · {task.output.status || 'saved'}</p>}
                  {task.errorMessage && <p className="text-xs text-red-400 mt-2">{task.errorMessage}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {task.assignedWorker === 'human' && ['queued', 'awaiting_approval', 'failed'].includes(task.status) && <label className="text-[9px] text-text-tertiary font-mono uppercase">Owner<select aria-label={`Assign staff for ${task.title}`} value={task.assignedStaffId || ''} onChange={e => void assignStaff(task, e.target.value)} className="block mt-1 max-w-40 bg-bg-base border border-border-default rounded px-2 py-1.5 text-[10px] text-text-primary"><option value="">Unassigned</option>{staff.filter(member => member.effectiveAvailability === 'available' || member.id === task.assignedStaffId).map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>}
                  {task.status === 'awaiting_approval' && <button onClick={() => void transition(task, 'queued')} className="px-2.5 py-1.5 rounded border border-orange-400/30 text-orange-300 text-[10px] font-mono">Approve</button>}
                  {task.status === 'queued' && task.assignedWorker === 'hermes' && workerCapabilities.find(item => item.id === 'hermes')?.supportedTaskTypes.includes(task.taskType) && <button onClick={() => void executeWithHermes(task)} className="px-2.5 py-1.5 rounded border border-accent/40 text-accent text-[10px] font-mono inline-flex items-center gap-1"><Play className="w-3 h-3" /> Run with Hermes</button>}
                  {task.status === 'queued' && task.assignedWorker === 'human' && <button onClick={() => void transition(task, 'running')} className="px-2.5 py-1.5 rounded border border-border-default text-text-secondary text-[10px] font-mono">Start</button>}
                  {task.status === 'running' && task.assignedWorker === 'human' && <button onClick={() => void transition(task, 'failed')} className="px-2.5 py-1.5 rounded border border-red-400/30 text-red-300 text-[10px] font-mono">Fail</button>}
                  {task.status === 'running' && task.assignedWorker === 'human' && <button onClick={() => void transition(task, 'completed')} className="px-2.5 py-1.5 rounded border border-emerald-400/30 text-emerald-300 text-[10px] font-mono inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Complete</button>}
                  {['queued', 'awaiting_approval', 'running', 'failed'].includes(task.status) && <button onClick={() => void transition(task, 'cancelled')} className="px-2.5 py-1.5 rounded border border-border-default text-text-tertiary text-[10px] font-mono inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancel</button>}
                  {task.status === 'failed' && task.attemptCount < task.maxAttempts && <button onClick={() => void transition(task, 'queued')} className="px-2.5 py-1.5 rounded border border-border-default text-text-secondary text-[10px] font-mono">Retry</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
