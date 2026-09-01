import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Check, 
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  FolderCheck
} from 'lucide-react';
import { ClientProject } from '../types';

interface PublicPortalPageProps {
  token: string;
  onNavigateToLogin: () => void;
}

export default function PublicPortalPage({ token, onNavigateToLogin }: PublicPortalPageProps) {
  const [project, setProject] = useState<Partial<ClientProject> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const res = await fetch(`/api/portal/project/${token}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        } else {
          setError('Project delivery portal link is invalid or has expired.');
        }
      } catch (err) {
        setError('Failed to connect to client portal service.');
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Authenticating client portal session...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center font-mono">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 max-w-md space-y-2">
          <h3 className="font-bold text-sm">PORTAL ACCESS ERROR</h3>
          <p className="text-xs">{error || 'Unable to load project.'}</p>
          <button 
            onClick={onNavigateToLogin}
            className="mt-3 px-3 py-1.5 bg-white text-black font-bold rounded text-xs uppercase"
          >
            Operator Sign In
          </button>
        </div>
      </div>
    );
  }

  const completedMilestones = project.milestones?.filter(m => m.status === 'completed').length || 0;
  const totalMilestones = project.milestones?.length || 1;
  const progressPct = Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-white pb-16">
      
      {/* BRANDING HEADER */}
      <header className="border-b border-slate-800/80 bg-[#0c1017]/90 sticky top-0 z-30 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-sm">
            H
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">{project.businessName}</h1>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Live Technical Fulfillment Portal • Tier: {project.packageTier}</span>
          </div>
        </div>

        <button
          onClick={onNavigateToLogin}
          className="text-xs font-mono text-slate-400 hover:text-white uppercase transition-colors"
        >
          Agency Login
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-8">
        
        {/* EXECUTIVE PROGRESS HERO */}
        <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                Fulfillment Status • {project.status?.replace('_', ' ').toUpperCase()}
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">Infrastructure & Growth Roadmap</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Real-time transparency into your ongoing technical SEO speed optimizations, security certificates, and local lead pipeline infrastructure.
              </p>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Overall Completion</span>
              <span className="text-3xl font-extrabold text-emerald-400">{progressPct}%</span>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* PROOF METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-[#0a0d14] border border-slate-800/80 rounded">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Baseline Speed & Health</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{project.initialAuditScore}/100</div>
              <span className="text-[10px] text-slate-500 font-mono">Prior to optimization</span>
            </div>

            <div className="p-4 bg-[#0a0d14] border border-emerald-500/20 rounded">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">Current Verified Score</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{project.currentScore}/100</div>
              <span className="text-[10px] text-emerald-500 font-mono font-bold">
                +{ (project.currentScore || 0) - (project.initialAuditScore || 0) } point velocity gain
              </span>
            </div>

            <div className="p-4 bg-[#0a0d14] border border-slate-800/80 rounded">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Target Optimization Goal</span>
              <div className="text-xl font-bold text-white mt-1">{project.targetScore}/100</div>
              <span className="text-[10px] text-slate-500 font-mono">Market leader standard</span>
            </div>
          </div>
        </div>

        {/* MILESTONE DELIVERY STAGES */}
        <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Fulfillment Deliverables & Proof of Work</span>
          </h3>

          <div className="space-y-3">
            {project.milestones?.map((ms, idx) => (
              <div 
                key={ms.id}
                className={`p-4 rounded border transition-all ${
                  ms.status === 'completed' 
                    ? 'bg-emerald-500/5 border-emerald-500/30' 
                    : ms.status === 'in_progress'
                    ? 'bg-blue-500/5 border-blue-500/30'
                    : 'bg-[#0a0d14] border-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                      ms.status === 'completed' 
                        ? 'bg-emerald-500 text-black' 
                        : ms.status === 'in_progress'
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {ms.status === 'completed' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white">{ms.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ms.description}</p>
                      
                      {ms.deliverablesProof && (
                        <div className="mt-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Delivered: {ms.deliverablesProof}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                    ms.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    ms.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {ms.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ASSET INTAKE & SECURITY */}
        <div className="bg-[#0f141f] border border-slate-800 rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <FolderCheck className="w-4 h-4 text-emerald-400" />
            <span>Asset Intake & Credentials Vault Status</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            {project.assets?.map(asset => (
              <div key={asset.id} className="p-3 bg-[#0a0d14] border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">{asset.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase">{asset.category.replace('_', ' ')}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  asset.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  asset.status === 'received' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {asset.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>

      <footer className="max-w-4xl mx-auto px-6 mt-12 text-center text-slate-400 text-xs font-mono">
        Secured by HAL AI Operating Intelligence System • End-to-End Encrypted Client Hub
      </footer>

    </div>
  );
}
