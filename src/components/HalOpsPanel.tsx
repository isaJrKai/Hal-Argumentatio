import { useState } from 'react';
import { SchedulerJob, Recommendation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Loader2, 
  ShieldAlert, 
  RefreshCw,
  Check,
  X,
  Crosshair,
  TrendingUp,
  Brain,
  Activity,
  Zap,
  Target
} from 'lucide-react';

interface HalOpsPanelProps {
  jobs: SchedulerJob[];
  recommendations: Recommendation[];
  token: string;
  onRefresh: () => void;
}

export default function HalOpsPanel({ 
  jobs, 
  recommendations, 
  token, 
  onRefresh
}: HalOpsPanelProps) {
  
  const [activeTab, setActiveTab] = useState<'scheduler' | 'simulator'>('simulator');
  const [runningJob, setRunningJob] = useState<string | null>(null);

  // Simulator State
  const [simNiche, setSimNiche] = useState('plumbers');
  const [simOffer, setSimOffer] = useState('Free Audit');
  const [simChannel, setSimChannel] = useState('cold_email');
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState<{
    confidence: number;
    predictedCpl: number;
    volume: number;
    rationale: string;
  } | null>(null);

  const handleRunJob = async (jobName: string) => {
    setRunningJob(jobName);
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job: jobName })
      });
      await res.json();
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setRunningJob(null);
    }
  };

  const handleRecommendationAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/recommendations/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runSimulation = async () => {
    setSimRunning(true);
    try {
      const res = await fetch('/api/ai/simulate-outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          niche: simNiche,
          channel: simChannel,
          offer: simOffer
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setSimResult(data.result);
      } else {
        throw new Error(data.error || "Simulation failed");
      }
    } catch (e) {
      console.error(e);
      setSimResult({
        confidence: 0,
        predictedCpl: 0,
        volume: 0,
        rationale: "Simulation engine offline or encountered an error."
      });
    } finally {
      setSimRunning(false);
    }
  };

  const pendingRecs = recommendations.filter(r => r.status === 'pending');
  const pastRecs = recommendations.filter(r => r.status !== 'pending');

  const operations = [
    {
      id: 'evaluate_forecasts',
      name: '3.5 Forecast Evaluator',
      desc: 'Checks expired predictions against actual performance, records deviations, and triggers Gemini feedback insights to refine downstream strategy models.'
    },
    {
      id: 'auto_forecaster',
      name: '3.6 Auto-Forecaster',
      desc: 'Fits linear and average regression algorithms over 90 days performance timelines to generate fresh 7-day trend forecasts.'
    },
    {
      id: 'ltv_correction',
      name: '3.8 LTV Calibration',
      desc: 'Analyzes closed conversion contract values against predicted customer values to calibrate target service-type multipliers.'
    },
    {
      id: 'weekly_summary',
      name: '5.7 Weekly Sync Summary',
      desc: 'Compiles general account balance reports and synchronizes structural operational metrics with campaign targets.'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Navigation Toggle */}
      <div className="flex gap-2 border-b border-border-dark pb-4">
        <button 
          onClick={() => setActiveTab('simulator')}
          className={`px-6 py-2.5 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'simulator' ? 'bg-brand text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-card-dark text-text-dim hover:text-text-secondary border border-border-dark'
          }`}
        >
          <Crosshair className="w-4 h-4" /> Outreach Simulator
        </button>
        <button 
          onClick={() => setActiveTab('scheduler')}
          className={`px-6 py-2.5 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === 'scheduler' ? 'bg-brand text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-card-dark text-text-dim hover:text-text-secondary border border-border-dark'
          }`}
        >
          <Zap className="w-4 h-4" /> Core Scheduler
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'simulator' && (
          <motion.div 
            key="simulator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Left: Input Configuration */}
            <div className="bg-card-dark border border-border-dark rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-transparent" />
              <div className="flex items-center gap-2 mb-6">
                <Brain className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-mono font-bold text-text-primary uppercase tracking-wider">Strategy Vector Parameters</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-mono text-text-dim font-bold uppercase tracking-wider mb-2">Target Niche</label>
                  <select 
                    value={simNiche} onChange={e => setSimNiche(e.target.value)}
                    className="w-full bg-bg-base border border-border-dark rounded-lg p-3 text-sm text-text-primary focus:border-brand outline-none transition-all"
                  >
                    <option value="plumbers">Plumbing & HVAC</option>
                    <option value="roofers">Roofing Contractors</option>
                    <option value="lawyers">Legal / Law Firms</option>
                    <option value="saas">B2B SaaS</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-mono text-text-dim font-bold uppercase tracking-wider mb-2">Outreach Channel</label>
                  <select 
                    value={simChannel} onChange={e => setSimChannel(e.target.value)}
                    className="w-full bg-bg-base border border-border-dark rounded-lg p-3 text-sm text-text-primary focus:border-brand outline-none transition-all"
                  >
                    <option value="cold_email">Cold Email</option>
                    <option value="linkedin">LinkedIn Direct</option>
                    <option value="cold_call">Cold Calling</option>
                    <option value="sms">SMS Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-text-dim font-bold uppercase tracking-wider mb-2">Core Offer / Value Prop</label>
                  <select 
                    value={simOffer} onChange={e => setSimOffer(e.target.value)}
                    className="w-full bg-bg-base border border-border-dark rounded-lg p-3 text-sm text-text-primary focus:border-brand outline-none transition-all"
                  >
                    <option value="Free Audit">Free Technical Audit / Video</option>
                    <option value="Guaranteed Leads">Performance Guarantee (Leads)</option>
                    <option value="Discount">Initial Discount Setup</option>
                    <option value="Software Trial">Free Portal Trial</option>
                  </select>
                </div>

                <button 
                  onClick={runSimulation}
                  disabled={simRunning}
                  className="w-full mt-4 bg-brand hover:bg-brand-dim text-black font-mono font-bold text-xs uppercase tracking-wider py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] disabled:opacity-50"
                >
                  {simRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  {simRunning ? 'SIMULATING OUTCOMES...' : 'RUN NEURAL SIMULATION'}
                </button>
              </div>
            </div>

            {/* Right: Simulation Output */}
            <div className="bg-bg-base border border-border-dark rounded-xl p-6 shadow-inner relative flex flex-col justify-center">
               {!simResult && !simRunning && (
                 <div className="text-center opacity-40">
                   <Target className="w-12 h-12 mx-auto mb-3 text-text-dim" />
                   <p className="text-xs font-mono uppercase tracking-wider text-text-dim">Awaiting strategy vectors to predict outcomes...</p>
                 </div>
               )}

               {simRunning && (
                 <div className="text-center animate-pulse">
                   <Activity className="w-12 h-12 mx-auto mb-3 text-brand" />
                   <p className="text-xs font-mono uppercase tracking-wider text-brand">Querying historical synaptic weights...</p>
                 </div>
               )}

               {simResult && !simRunning && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="space-y-6"
                 >
                   <div className="flex items-center gap-3 mb-6 border-b border-border-dark pb-4">
                     <TrendingUp className="w-6 h-6 text-brand" />
                     <h3 className="text-lg font-bold text-text-primary tracking-tight">Predicted Strategy Outcome</h3>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-card-dark border border-border-dark rounded-lg p-4">
                       <span className="block text-[10px] font-mono text-text-dim font-bold uppercase tracking-wider mb-1">Conversion Confidence</span>
                       <div className="flex items-baseline gap-1">
                         <span className={`text-2xl font-bold font-mono ${simResult.confidence >= 70 ? 'text-emerald-400' : simResult.confidence >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                           {simResult.confidence}%
                         </span>
                       </div>
                     </div>
                     <div className="bg-card-dark border border-border-dark rounded-lg p-4">
                       <span className="block text-[10px] font-mono text-text-dim font-bold uppercase tracking-wider mb-1">Est. Cost Per Lead</span>
                       <div className="flex items-baseline gap-1">
                         <span className="text-2xl font-bold font-mono text-text-primary">${simResult.predictedCpl}</span>
                       </div>
                     </div>
                   </div>

                   <div className="bg-brand/5 border border-brand/20 rounded-lg p-4">
                     <span className="block text-[10px] font-mono text-brand font-bold uppercase tracking-wider mb-2">Neural Rationale</span>
                     <p className="text-sm text-text-secondary leading-relaxed font-sans">{simResult.rationale}</p>
                   </div>
                 </motion.div>
               )}
            </div>
          </motion.div>
        )}

        {activeTab === 'scheduler' && (
          <motion.div 
            key="scheduler"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Columns: Tasks & Jobs list */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Core Task Trigger board */}
              <div className="bg-card-dark border border-border-dark rounded-sm p-5">
                <div className="flex justify-between items-center border-b border-border-dark pb-3 mb-5">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold">HAL Scheduler Operations</span>
                  <span className="text-[10px] font-mono text-text-dim uppercase font-bold">Core Algorithms</span>
                </div>
                <div className="space-y-4">
                  {operations.map(op => {
                    const isCurrent = runningJob === op.id;
                    return (
                      <div key={op.id} className="bg-card-inner border border-border-dark/60 rounded-sm p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1 max-w-xl">
                          <h4 className="text-sm font-bold text-text-primary leading-normal font-sans">{op.name}</h4>
                          <p className="text-xs text-text-secondary leading-relaxed font-sans">{op.desc}</p>
                        </div>
                        <button
                          onClick={() => handleRunJob(op.id)}
                          disabled={runningJob !== null}
                          className="bg-brand text-black hover:bg-brand-dim disabled:opacity-40 py-2 px-4 rounded-sm font-mono text-xs font-bold uppercase shrink-0 flex items-center gap-1.5 transition-colors tracking-wider"
                        >
                          {isCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          EXECUTE
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit Jobs log history */}
              <div className="bg-card-dark border border-border-dark rounded-sm p-5">
                <div className="flex justify-between items-center border-b border-border-dark pb-3 mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold">Scheduler Job Execution Log</span>
                  <button onClick={onRefresh} className="text-text-dim hover:text-text-primary transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                {jobs.length === 0 ? (
                  <p className="text-xs font-mono text-text-dim text-center py-6 uppercase tracking-wider">No historical operational logs recorded.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border-dark font-mono text-text-dim uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-2.5">Job Class</th>
                          <th className="py-2.5">Triggered At</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5">Log Output</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dark/40 text-text-secondary font-mono">
                        {jobs.slice().reverse().map(j => (
                          <tr key={j.id} className="hover:bg-card-inner/60">
                            <td className="py-3 font-bold text-text-primary uppercase text-[11px]">{j.job.replace('_', ' ')}</td>
                            <td className="py-3 text-text-dim">{j.startedAt ? new Date(j.startedAt).toLocaleTimeString() : 'N/A'}</td>
                            <td className="py-3">
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider ${
                                j.status === 'completed' ? 'bg-brand-glow text-brand border border-brand/30' :
                                j.status === 'failed' ? 'bg-red-950/30 text-red-400 border border-red-500/20' :
                                'bg-brand-glow text-brand border border-brand/20 animate-pulse'
                              }`}>
                                {j.status}
                              </span>
                            </td>
                            <td className="py-3 text-[11px] text-text-secondary font-sans max-w-xs truncate" title={j.result || j.error || ''}>
                              {j.result || j.error || 'Running core calculations...'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recommendations Approver Board */}
            <div className="bg-card-dark border border-border-dark rounded-sm p-5 h-fit space-y-6">
              <div className="flex items-center gap-2 border-b border-border-dark pb-3">
                <ShieldAlert className="w-4 h-4 text-brand" />
                <span className="text-xs font-mono uppercase tracking-wider text-text-primary font-bold">Decision Approver Board</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-sans">
                HAL generates autonomous recommendations based on trend confidence levels. Review and approve budget shifts or active bid updates.
              </p>

              {/* Pending recommendations */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block font-bold">Pending Decisions</span>
                {pendingRecs.length === 0 ? (
                  <p className="text-xs font-mono text-text-dim uppercase tracking-wider">No decisions require urgent attention.</p>
                ) : (
                  pendingRecs.map(r => (
                    <div key={r.id} className="bg-card-inner border border-border-dark rounded-sm p-4 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-1.5 w-16 bg-brand" />
                      
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-text-dim font-bold">
                          <span>CONFIDENCE: {Math.round(r.confidence * 100)}%</span>
                        </div>
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-sans">{r.action}</h4>
                      </div>
                      <p className="text-xs text-text-secondary font-sans leading-relaxed">{r.rationale}</p>
                      
                      <div className="flex gap-2 pt-2 border-t border-border-dark/40">
                        <button
                          onClick={() => handleRecommendationAction(r.id, 'approve')}
                          className="flex-1 bg-brand text-black hover:bg-brand-dim py-1 rounded-sm text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-0.5 tracking-wider transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" /> APPROVE
                        </button>
                        <button
                          onClick={() => handleRecommendationAction(r.id, 'reject')}
                          className="flex-1 bg-card-dark hover:bg-card-highlight text-text-secondary hover:text-text-primary py-1 rounded-sm text-[10px] font-mono uppercase flex items-center justify-center gap-0.5 border border-border-dark tracking-wider transition-colors"
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" /> DISMISS
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Historical Decisions */}
              <div className="space-y-3 pt-3 border-t border-border-dark/60">
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block font-bold">Decision History Logs</span>
                {pastRecs.length === 0 ? (
                  <p className="text-[10px] font-mono text-text-dim uppercase tracking-wider">No past decisions archived.</p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {pastRecs.map(r => (
                      <div key={r.id} className="text-xs bg-card-inner p-2.5 rounded-sm border border-border-dark/40 space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-text-secondary font-bold truncate max-w-[120px] uppercase">{r.action}</span>
                          <span className={`px-1.5 py-0.5 rounded-sm font-mono font-bold text-[9px] uppercase tracking-wider ${
                            r.status === 'approved' ? 'text-brand bg-brand-glow border border-brand/20' : 'text-text-dim bg-card-dark border border-border-dark'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary font-sans leading-normal">{r.rationale}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
