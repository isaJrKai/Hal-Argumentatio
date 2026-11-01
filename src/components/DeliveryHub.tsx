import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Plus, 
  Sparkles, 
  Layers, 
  FileText, 
  Key, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  FolderCheck,
  ChevronRight,
  Gauge,
  UploadCloud,
  CheckCheck,
  Send,
  X
} from 'lucide-react';
import { ClientProject, ClientMilestone, ClientAsset, Lead } from '../types';
import { useBusinessContext } from '../context/BusinessContext';

interface DeliveryHubProps {
  token: string;
  leads?: Lead[];
}

export default function DeliveryHub({ token, leads = [] }: DeliveryHubProps) {
  const { workspaceConfig } = useBusinessContext();
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ClientProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Project Modal State
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectLeadId, setNewProjectLeadId] = useState('');
  const [newProjectBusinessName, setNewProjectBusinessName] = useState('');
  const [newProjectClientName, setNewProjectClientName] = useState('');
  const [newProjectCity, setNewProjectCity] = useState('');
  const [newProjectServiceType, setNewProjectServiceType] = useState('');
  const [newProjectPackage, setNewProjectPackage] = useState<'Growth' | 'Dominance' | 'Enterprise'>('Dominance');
  const [newProjectRetainer, setNewProjectRetainer] = useState(2400);

  const fetchProjects = async (retry = 1) => {
    let retryScheduled = false;
    try {
      setLoading(true);
      const activeToken = token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '';
      if (!activeToken) throw new Error('Sign in to load client projects.');
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (!res.ok) throw new Error(`Project list request failed (HTTP ${res.status}).`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Project list response was not a valid array.');
      setProjects(data);
      setSelectedProject(current => current && data.some(project => project.id === current.id)
        ? data.find(project => project.id === current.id) || null
        : data[0] || null);
      setProjectError(null);
    } catch (err) {
      if (retry > 0) {
        retryScheduled = true;
        setTimeout(() => { void fetchProjects(retry - 1); }, 600);
      } else {
        console.warn('Client projects unavailable:', err);
        setProjectError(err instanceof Error ? err.message : 'Client projects could not be loaded.');
      }
    } finally {
      if (!retryScheduled) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectBusinessName.trim() || !newProjectCity.trim() || !newProjectServiceType.trim()) {
      setProjectError('Business name, city and service type are required.');
      return;
    }

    setProjectError(null);
    try {
      const activeToken = token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '';
      if (!activeToken) throw new Error('Your session has expired. Sign in again to create a project.');
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          leadId: newProjectLeadId,
          businessName: newProjectBusinessName.trim(),
          clientName: newProjectClientName.trim(),
          city: newProjectCity.trim(),
          serviceType: newProjectServiceType.trim(),
          packageTier: newProjectPackage,
          monthlyRetainerUsd: newProjectRetainer
        })
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseData.error || `Project creation failed (HTTP ${res.status}).`);

      // A successful POST is not enough: confirm the project appears in the durable list.
      const verifyRes = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${activeToken}` } });
      if (!verifyRes.ok) throw new Error(`Project was accepted, but persistence could not be verified (HTTP ${verifyRes.status}).`);
      const persistedProjects = await verifyRes.json();
      const created = responseData as ClientProject;
      if (!Array.isArray(persistedProjects) || !persistedProjects.some((project: ClientProject) => project.id === created.id)) {
        setProjectError('The server accepted this project, but it is missing from the persistent project list. It may not survive a refresh. Project storage needs repair before this project can be considered saved.');
        setShowNewProjectModal(false);
        return;
      }

      setProjects(persistedProjects);
      setSelectedProject(persistedProjects.find((project: ClientProject) => project.id === created.id) || created);
      setShowNewProjectModal(false);
      setNewProjectBusinessName('');
      setNewProjectClientName('');
      setNewProjectCity('');
      setNewProjectServiceType('');
      setNewProjectLeadId('');
      setProjectError(null);
    } catch (err) {
      console.error('Error creating project:', err);
      setProjectError(err instanceof Error ? err.message : 'Project could not be created.');
    }
  };

  const handleUpdateMilestone = async (milestoneId: string, newStatus: ClientMilestone['status']) => {
    if (!selectedProject) return;

    const updatedMilestones = selectedProject.milestones.map(m => m.id === milestoneId
      ? { ...m, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined }
      : m);
    const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
    const allMilestonesComplete = updatedMilestones.length > 0 && completedCount === updatedMilestones.length;
    const updatedProject = {
      ...selectedProject,
      milestones: updatedMilestones,
      status: allMilestonesComplete ? ('completed' as const) : ('active_delivery' as const)
    };

    try {
      const activeToken = token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '';
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}) },
        body: JSON.stringify({ milestones: updatedMilestones, status: updatedProject.status })
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseData.error || `Milestone update failed (HTTP ${res.status}).`);
      const savedProject = responseData && typeof responseData === 'object' ? { ...updatedProject, ...responseData } : updatedProject;
      setSelectedProject(savedProject);
      setProjects(prev => prev.map(project => project.id === savedProject.id ? savedProject : project));
      setProjectError(null);
    } catch (err) {
      console.error('Failed to save milestone update:', err);
      setProjectError(err instanceof Error ? err.message : 'Milestone update was not saved.');
    }
  };

  const handleUpdateAssetStatus = async (assetId: string, newStatus: ClientAsset['status']) => {
    if (!selectedProject) return;

    const updatedAssets = selectedProject.assets.map(asset => asset.id === assetId
      ? { ...asset, status: newStatus, uploadedAt: newStatus !== 'pending' ? new Date().toISOString() : undefined }
      : asset);
    const updatedProject = { ...selectedProject, assets: updatedAssets };

    try {
      const activeToken = token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '';
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}) },
        body: JSON.stringify({ assets: updatedAssets })
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(responseData.error || `Asset status update failed (HTTP ${res.status}).`);
      const savedProject = responseData && typeof responseData === 'object' ? { ...updatedProject, ...responseData } : updatedProject;
      setSelectedProject(savedProject);
      setProjects(prev => prev.map(project => project.id === savedProject.id ? savedProject : project));
      setProjectError(null);
    } catch (err) {
      console.error('Failed to save asset status:', err);
      setProjectError(err instanceof Error ? err.message : 'Asset status was not saved.');
    }
  };

  const completedMilestones = selectedProject?.milestones.filter(milestone => milestone.status === 'completed').length || 0;
  const totalMilestones = selectedProject?.milestones.length || 0;
  const deliveryProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : null;

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="border-b border-border-dim/60 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold tracking-widest text-brand uppercase bg-brand/10 px-2 py-0.5 rounded">
              Phase 4: Operations & Fulfillment
            </span>
            <span className="w-1 h-1 rounded-full bg-text-tertiary" />
            <span className="text-[10px] font-mono text-text-secondary">CLIENT ONBOARDING & PROJECT DELIVERY HUB</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary mt-1">Client Delivery & Performance Hub</h2>
          <p className="text-xs text-text-secondary max-w-2xl mt-0.5">
            Track client project milestones, manually record asset intake, and share client progress portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="px-3 py-1.5 bg-brand text-black hover:bg-brand-dim rounded-sm font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Onboard New Client</span>
          </button>
        </div>
      </div>

      {projectError && (
        <div role="alert" className="flex items-start gap-2 rounded-sm border border-warning/30 bg-warning/5 p-3 text-xs text-text-primary">
          <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <span>{projectError}</span>
        </div>
      )}

      {/* DUAL COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE PROJECTS LIST (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-bg-raised border border-border-dim rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border-dim/60 pb-2">
              <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wider">
                Active Client Projects ({projects.filter(project => project.status !== 'completed').length})
              </span>
              <span className="text-[9px] font-mono text-brand font-bold uppercase">
                ${projects.filter(project => project.status !== 'completed').reduce((sum, project) => sum + project.monthlyRetainerUsd, 0).toLocaleString()}/mo MRR
              </span>
            </div>

            <div className="space-y-2">
              {projects.length === 0 ? (
                <div className="p-6 text-center text-text-dim text-xs font-mono">
                  {loading ? 'Loading client projects…' : 'No persisted projects are available. Click “Onboard New Client” to start fulfillment.'}
                </div>
              ) : (
                projects.map((project) => {
                  const isSelected = selectedProject?.id === project.id;
                  const completedMilestones = project.milestones.filter(m => m.status === 'completed').length;
                  const progressPct = project.milestones.length > 0 ? Math.round((completedMilestones / project.milestones.length) * 100) : null;

                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`p-3 rounded-sm border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-brand/10 border-brand shadow-xs' 
                          : 'bg-bg-dark border-border-dim hover:border-brand/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-text-primary">{project.businessName}</h4>
                          <span className="text-[10px] font-mono text-text-dim">{project.clientName} • {project.city}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                          project.status === 'completed' ? 'bg-positive/20 text-positive' :
                          project.status === 'active_delivery' ? 'bg-brand/20 text-brand' :
                          'bg-warning/20 text-warning'
                        }`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border-dim/60 flex items-center justify-between text-[10px] font-mono text-text-secondary">
                        <span>Tier: <strong className="text-text-primary">{project.packageTier}</strong></span>
                        <span className="text-brand font-bold">${project.monthlyRetainerUsd}/mo</span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-text-dim">
                          <span>Milestones ({completedMilestones}/{project.milestones.length})</span>
                          <span>{progressPct !== null ? `${progressPct}%` : 'No milestones'}</span>
                        </div>
                        <div className="w-full h-1 bg-bg-base rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand rounded-full transition-all duration-300"
                            style={{ width: `${progressPct ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROJECT DETAILS & DELIVERY WORKSPACE (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedProject ? (
            <div className="space-y-6">
              
              {/* PROJECT HERO METRICS CARD */}
              <div className="bg-bg-raised border border-border-dim rounded-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-dim/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-text-primary">{selectedProject.businessName}</h3>
                      <span className="text-[10px] font-mono bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded font-bold uppercase">
                        {selectedProject.packageTier} Retainer
                      </span>
                    </div>
                    <span className="text-xs font-mono text-text-secondary mt-0.5 block">
                      Client Contact: {selectedProject.clientName} | {selectedProject.city} ({selectedProject.serviceType})
                    </span>
                  </div>

                  {/* Share Client Portal Token Link */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/?portal=${selectedProject.portalAccessToken}#portal-${selectedProject.portalAccessToken}`;
                        navigator.clipboard.writeText(url);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-2.5 py-1.5 bg-bg-dark border border-border-dim hover:border-brand text-text-primary rounded-sm text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy public client review link"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-positive" /> : <Copy className="w-3 h-3 text-brand" />}
                      <span>{copiedLink ? 'Copied Link!' : 'Client Live Portal Link'}</span>
                    </button>
                  </div>
                </div>

                {/* DELIVERY PROGRESS — derived only from milestone states */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                  <div className="p-3 bg-bg-dark border border-border-dim rounded-sm">
                    <span className="text-[9px] text-text-dim uppercase block font-bold">Milestones Complete</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold text-text-primary">{completedMilestones} / {totalMilestones || '—'}</span>
                      <span className="text-[10px] text-text-dim">Operator-updated</span>
                    </div>
                  </div>

                  <div className="p-3 bg-bg-dark border border-border-dim rounded-sm">
                    <span className="text-[9px] text-text-dim uppercase block font-bold">Delivery Progress</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold text-brand">{deliveryProgress !== null ? `${deliveryProgress}%` : 'Not available'}</span>
                      <span className="text-[10px] text-text-dim">Based on completed milestones</span>
                    </div>
                  </div>

                  <div className="p-3 bg-bg-dark border border-border-dim rounded-sm">
                    <span className="text-[9px] text-text-dim uppercase block font-bold">Project Status</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-bold text-text-primary capitalize">{selectedProject.status.replace('_', ' ')}</span>
                      <span className="text-[10px] text-text-dim">Current workflow state</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MILESTONE DELIVERY ROADMAP */}
              <div className="bg-bg-raised border border-border-dim rounded-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border-dim/60 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-brand" />
                    <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                      Milestone Status & Proof References
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-text-dim">Milestone states are manually recorded</span>
                </div>

                <div className="space-y-3">
                  {selectedProject.milestones.map((ms, idx) => (
                    <div 
                      key={ms.id}
                      className={`p-3.5 rounded-sm border transition-all ${
                        ms.status === 'completed' ? 'bg-positive/5 border-positive/30' :
                        ms.status === 'in_progress' ? 'bg-brand/5 border-brand/40' :
                        'bg-bg-dark border-border-dim/60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-bg-base border border-border-dim flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <h5 className="text-xs font-bold text-text-primary">{ms.title}</h5>
                            <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{ms.description}</p>
                            {ms.deliverablesProof && (
                              <p className="text-[10px] font-mono text-brand mt-1 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Proof: {ms.deliverablesProof}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status update selector */}
                        <div className="flex items-center gap-1 shrink-0 font-mono text-[9px] pt-2 sm:pt-0">
                          {(['pending', 'in_progress', 'completed'] as ClientMilestone['status'][]).map(st => (
                            <button
                              key={st}
                              onClick={() => handleUpdateMilestone(ms.id, st)}
                              className={`px-2 py-1 rounded-xs font-bold uppercase transition-colors cursor-pointer ${
                                ms.status === st 
                                  ? (st === 'completed' ? 'bg-positive text-black' : st === 'in_progress' ? 'bg-brand text-black' : 'bg-bg-base text-text-primary border border-border-dim')
                                  : 'bg-bg-base text-text-dim hover:text-text-primary'
                              }`}
                            >
                              {st.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TECHNICAL ASSET INTAKE CHECKLIST */}
              <div className="bg-bg-raised border border-border-dim rounded-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border-dim/60 pb-2">
                  <div className="flex items-center gap-2">
                    <FolderCheck className="w-4 h-4 text-brand" />
                    <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                      Technical Asset Intake Status
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-text-dim">Status tracking only — no credentials stored</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  {selectedProject.assets.map(asset => (
                    <div key={asset.id} className="p-3 bg-bg-dark border border-border-dim rounded-sm flex items-center justify-between">
                      <div>
                        <span className="font-bold text-text-primary block">{asset.name}</span>
                        <span className="text-[9px] text-text-dim uppercase">{asset.category.replace('_', ' ')}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[9px]">
                        {(['pending', 'received', 'verified'] as ClientAsset['status'][]).map(st => (
                          <button
                            key={st}
                            onClick={() => handleUpdateAssetStatus(asset.id, st)}
                            className={`px-1.5 py-0.5 rounded-xs font-bold uppercase cursor-pointer ${
                              asset.status === st 
                                ? (st === 'verified' ? 'bg-positive/20 text-positive border border-positive/30' : st === 'received' ? 'bg-brand/20 text-brand border border-brand/30' : 'bg-bg-base text-text-dim')
                                : 'text-text-dim hover:text-text-primary'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-text-dim font-mono text-xs border border-dashed border-border-dim rounded-sm">
              Select a project from the left panel to inspect delivery milestones.
            </div>
          )}
        </div>

      </div>

      {/* NEW PROJECT ONBOARDING MODAL */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-raised border border-border-dim rounded-sm max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-dim/60 pb-3">
              <h3 className="text-sm font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand" />
                <span>Onboard New Client Project</span>
              </h3>
              <button onClick={() => setShowNewProjectModal(false)} className="text-text-dim hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 font-mono text-xs">
              {leads.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase font-bold">Select Existing Lead (Optional)</label>
                  <select
                    value={newProjectLeadId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setNewProjectLeadId(id);
                      const matched = leads.find(l => l.id === id);
                      if (matched) {
                        setNewProjectBusinessName(matched.businessName);
                        setNewProjectClientName(matched.ownerName || '');
                        setNewProjectCity(matched.city);
                        setNewProjectServiceType(matched.serviceType || '');
                      }
                    }}
                    className="w-full bg-bg-dark border border-border-dim rounded-sm p-2 text-text-primary outline-none focus:border-brand"
                  >
                    <option value="">-- Manual Entry / No Linked Lead --</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.businessName} ({l.city} - {l.serviceType})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-text-secondary uppercase font-bold">Business Name *</label>
                <input
                  type="text"
                  required
                  value={newProjectBusinessName}
                  onChange={(e) => setNewProjectBusinessName(e.target.value)}
                  placeholder="Enter the client business name"
                  className="w-full bg-bg-dark border border-border-dim rounded-sm p-2 text-text-primary outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase font-bold">Client Principal</label>
                  <input
                    type="text"
                    value={newProjectClientName}
                    onChange={(e) => setNewProjectClientName(e.target.value)}
                    placeholder="Enter client contact (optional)"
                    className="w-full bg-bg-dark border border-border-dim rounded-sm p-2 text-text-primary outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase font-bold">City / Market</label>
                  <input
                    type="text"
                    required
                    value={newProjectCity}
                    onChange={(e) => setNewProjectCity(e.target.value)}
                    placeholder="Enter client city"
                    className="w-full bg-bg-dark border border-border-dim rounded-sm p-2 text-text-primary outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase font-bold">Package Tier</label>
                  <select
                    value={newProjectPackage}
                    onChange={(e: any) => {
                      const tier = e.target.value;
                      setNewProjectPackage(tier);
                      setNewProjectRetainer(tier === 'Enterprise' ? 4500 : tier === 'Dominance' ? 2400 : 1200);
                    }}
                    className="w-full bg-bg-dark border border-border-dim rounded-sm p-2 text-text-primary outline-none focus:border-brand"
                  >
                    <option value="Growth">Growth ($1,200/mo)</option>
                    <option value="Dominance">Dominance ($2,400/mo)</option>
                    <option value="Enterprise">Enterprise ($4,500/mo)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase font-bold">Monthly Retainer ($ USD)</label>
                  <input
                    type="number"
                    value={newProjectRetainer}
                    onChange={(e) => setNewProjectRetainer(Number(e.target.value))}
                    className="w-full bg-bg-dark border border-border-dim rounded-sm p-2 text-text-primary outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border-dim/60">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-1.5 bg-bg-dark border border-border-dim text-text-secondary hover:text-text-primary rounded-sm font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand text-black hover:bg-brand-dim rounded-sm font-bold uppercase cursor-pointer"
                >
                  Initialize Delivery Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
