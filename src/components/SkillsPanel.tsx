import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Play, 
  Cpu, 
  Globe, 
  Mail, 
  CloudRain, 
  Search, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  HelpCircle,
  Clock,
  Map as MapIcon,
  Plus,
  Trash2,
  X,
  PlusCircle,
  Settings,
  ShieldAlert,
  Database,
  Zap,
  DollarSign
} from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import LeadMap from './LeadMap';
import { Button } from './ui/Button';

interface SkillInput {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  options?: string[];
  defaultValue: any;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'website' | 'outreach' | 'seo' | 'research' | 'geo' | 'forecast' | 'general';
  icon: string;
  inputs: SkillInput[];
}

interface SkillsPanelProps {
  token: string;
}

const ICON_MAP: Record<string, any> = {
  Globe: Globe,
  Mail: Mail,
  CloudRain: CloudRain,
  Search: Search,
  TrendingUp: TrendingUp,
  Map: MapIcon,
  Cpu: Cpu,
  Database: Database,
  Zap: Zap,
  DollarSign: DollarSign,
};

const CORE_SKILL_IDS = [
  'website_audit', 
  'outreach_draft', 
  'geo_sweep', 
  'research_deep', 
  'seo_analyzer', 
  'geo_map',
  'ad_spend_optimizer',
  'seo_schema_generator',
  'review_booster',
  'security_auditor',
  'competitor_analyzer',
  'talent_arbitrage_bridge',
  'verified_lead_lists',
  'automation_ops_product',
  'pricing_margin_calculator',
  'ad_spend_breakeven',
  'list_subscription_pricing'
];

export default function SkillsPanel({ token }: SkillsPanelProps) {
  const { toast } = useToast();
  const { activeCity, activeNiche } = useBusinessContext();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [formInputs, setFormInputs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // Custom skill modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [customId, setCustomId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customCategory, setCustomCategory] = useState<'website' | 'outreach' | 'seo' | 'research' | 'geo' | 'forecast' | 'general'>('general');
  const [customIcon, setCustomIcon] = useState('Cpu');
  
  // Custom inputs list inside builder
  const [customInputs, setCustomInputs] = useState<Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    required: boolean;
    optionsString: string;
  }>>([
    { name: 'city', label: 'Target City', type: 'string', required: true, optionsString: '' }
  ]);

  useEffect(() => {
    fetchSkills();
  }, []);

  // Update default form inputs when selected skill or global context shifts
  useEffect(() => {
    if (selectedSkill) {
      const defaults: Record<string, any> = {};
      selectedSkill.inputs.forEach(inp => {
        if (inp.name === 'city') {
          defaults[inp.name] = activeCity;
        } else if (inp.name === 'niche' || inp.name === 'serviceType') {
          defaults[inp.name] = activeNiche;
        } else {
          defaults[inp.name] = inp.defaultValue !== undefined ? inp.defaultValue : '';
        }
      });
      setFormInputs(defaults);
      setExecutionResult(null);
      setError(null);
    }
  }, [selectedSkill, activeCity, activeNiche]);

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/skills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
        if (data.length > 0 && !selectedSkill) {
          setSelectedSkill(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setFormInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill) return;

    setLoading(true);
    setExecutionResult(null);
    setError(null);
    setTerminalLogs([
      `[SYS_INFO] Initialising executive capability: "${selectedSkill.id}"`,
      `[SYS_INFO] Allocating secure processing node...`,
      `[SYS_INFO] Loading input parameters: ${JSON.stringify(formInputs)}`,
    ]);

    const addLogWithDelay = (text: string, delay: number) => {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, text]);
      }, delay);
    };

    addLogWithDelay(`[AGENT_LOAD] Launching active subprocess...`, 400);
    addLogWithDelay(`[API_QUERY] Dispersing web request payload...`, 800);

    try {
      const res = await fetch(`/api/skills/${selectedSkill.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inputs: formInputs })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Execution pipeline aborted');
      }

      setTimeout(() => {
        setTerminalLogs(prev => [
          ...prev, 
          `[SYS_SUCCESS] Processing finalized. Decoding results...`,
          `[SYS_SUCCESS] Execution completed in 1.48s`
        ]);
        setExecutionResult(data);
        setLoading(false);
      }, 1500);

    } catch (err: any) {
      setTimeout(() => {
        setTerminalLogs(prev => [
          ...prev, 
          `[CRITICAL_ERR] Pipeline error: ${err.message}`,
          `[CRITICAL_ERR] Decryption / Connection failed`
        ]);
        setError(err.message);
        setLoading(false);
      }, 1500);
    }
  };

  const handleAddFieldInBuilder = () => {
    setCustomInputs(prev => [
      ...prev,
      { name: '', label: '', type: 'string', required: false, optionsString: '' }
    ]);
  };

  const handleRemoveFieldInBuilder = (idx: number) => {
    setCustomInputs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFieldChangeInBuilder = (idx: number, key: string, val: any) => {
    setCustomInputs(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  };

  const handleCreateCustomSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId || !customName || !customDesc) {
      toast({
        variant: 'danger',
        title: 'Validation Error',
        description: 'ID, Name, and Description are required parameters.'
      });
      return;
    }

    const cleanId = customId.toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Parse inputs
    const inputs = customInputs.map(ci => ({
      name: ci.name.trim().replace(/[^a-zA-Z0-9_]/g, ''),
      label: ci.label.trim(),
      type: ci.type,
      required: ci.required,
      options: ci.optionsString ? ci.optionsString.split(',').map(o => o.trim()) : undefined,
      defaultValue: ci.type === 'boolean' ? false : ''
    })).filter(ci => ci.name && ci.label);

    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: cleanId,
          name: customName,
          description: customDesc,
          category: customCategory,
          icon: customIcon,
          inputs
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register custom capability.');

      toast({
        variant: 'success',
        title: 'Capability Registered',
        description: `Successfully compiled and loaded custom skill "${customName}".`
      });

      setShowAddModal(false);
      
      // Reset builder inputs
      setCustomId('');
      setCustomName('');
      setCustomDesc('');
      setCustomCategory('general');
      setCustomIcon('Cpu');
      setCustomInputs([{ name: 'city', label: 'Target City', type: 'string', required: true, optionsString: '' }]);

      await fetchSkills();
    } catch (err: any) {
      toast({
        variant: 'danger',
        title: 'Registration Aborted',
        description: err.message
      });
    }
  };

  const handleDeleteSkill = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (CORE_SKILL_IDS.includes(id)) {
      toast({
        variant: 'danger',
        title: 'Access Restricted',
        description: 'Core built-in architectural skills cannot be uninstalled.'
      });
      return;
    }

    if (!confirm(`Are you sure you want to completely uninstall the custom skill "${id}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/skills/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Uninstall request aborted.');

      toast({
        variant: 'success',
        title: 'Skill Uninstalled',
        description: `Successfully cleaned registry and removed "${id}".`
      });

      if (selectedSkill?.id === id) {
        setSelectedSkill(null);
      }
      await fetchSkills();
    } catch (err: any) {
      toast({
        variant: 'danger',
        title: 'Action Failed',
        description: err.message
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative" id="skills_panel">
      
      {/* LEFT COLUMN: Skill Catalog */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Title panel & registration controls */}
        <div className="bg-bg-raised border border-border-dim p-4 rounded-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">HAL Skills Engine</h3>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="px-2 py-1 bg-accent-dim hover:bg-accent-mid border border-accent/30 text-accent text-[9px] font-mono uppercase tracking-wider font-bold rounded-sm flex items-center gap-1 transition-all"
            >
              <Plus className="w-3 h-3" /> Add Skill
            </button>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
            Modular intelligence modules executable instantly. Built-in architectural systems are locked; custom setups may be appended.
          </p>
        </div>

        {/* Skills List Catalog */}
        <div className="space-y-2 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
          {skills.map(s => {
            const IconComponent = ICON_MAP[s.icon] || Cpu;
            const isSelected = selectedSkill?.id === s.id;
            const isCore = CORE_SKILL_IDS.includes(s.id);
            return (
              <div
                key={s.id}
                onClick={() => setSelectedSkill(s)}
                className={`w-full text-left p-3.5 rounded-sm border transition-all flex items-start gap-3.5 cursor-pointer relative group ${
                  isSelected 
                    ? 'bg-accent-dim/40 border-accent/50 shadow-md shadow-accent/5' 
                    : 'bg-bg-raised border-border-dim hover:border-border-strong hover:bg-bg-subtle'
                }`}
              >
                <div className={`p-1.5 rounded border ${isSelected ? 'border-accent/40 text-accent bg-accent-dim' : 'border-border-dim text-text-secondary bg-bg-base'}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-text-primary uppercase font-sans tracking-wide block truncate">{s.name}</span>
                    <span className="text-[8px] font-mono font-bold bg-bg-base text-text-secondary border border-border-dim px-1 rounded-sm uppercase shrink-0">{s.category}</span>
                  </div>
                  <p className="text-[10px] text-text-secondary leading-normal mt-1 line-clamp-2 font-sans">{s.description}</p>
                </div>

                {/* Remove button (only show on custom skills) */}
                {!isCore && (
                  <button
                    onClick={(e) => handleDeleteSkill(s.id, e)}
                    className="absolute right-3.5 top-3.5 p-1 text-text-tertiary hover:text-negative hover:bg-negative/10 border border-transparent hover:border-negative/20 rounded-sm transition-all opacity-0 group-hover:opacity-100"
                    title="Uninstall Custom Skill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Terminal and Inputs */}
      <div className="lg:col-span-8 space-y-6">
        {selectedSkill ? (
          <div className="bg-bg-raised border border-border-dim rounded-sm overflow-hidden">
            
            {/* Tab/Skill Title Header */}
            <div className="px-5 py-4 border-b border-border-dim flex justify-between items-center bg-bg-subtle">
              <div>
                <h2 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent" />
                  Terminal: {selectedSkill.name}
                </h2>
                <p className="text-[10.5px] text-text-secondary font-sans mt-0.5">{selectedSkill.description}</p>
              </div>
              <span className="text-[9px] font-mono text-accent font-bold uppercase bg-accent-glow px-2 py-0.5 rounded-sm border border-accent/25">HAL_CORE_LOADED</span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Form Input parameters */}
              <form onSubmit={handleExecute} className="md:col-span-5 space-y-4">
                <div className="border-b border-border-dim pb-2 mb-3">
                  <span className="text-[10px] font-mono font-bold text-text-primary uppercase tracking-wider block">Input Parameters</span>
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {selectedSkill.inputs.map(inp => (
                    <div key={inp.name} className="space-y-1.5">
                      <label className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block">
                        {inp.label} {inp.required && <span className="text-accent">*</span>}
                      </label>
                      {inp.type === 'select' ? (
                        <select
                          required={inp.required}
                          value={formInputs[inp.name] || ''}
                          onChange={(e) => handleInputChange(inp.name, e.target.value)}
                          className="w-full bg-bg-base border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors font-sans"
                        >
                          {inp.options?.map(opt => (
                            <option key={opt} value={opt} className="bg-bg-raised text-text-primary">{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required={inp.required}
                          value={formInputs[inp.name] || ''}
                          onChange={(e) => handleInputChange(inp.name, e.target.value)}
                          className="w-full bg-bg-base border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors font-sans"
                          placeholder={`Enter ${inp.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-accent hover:bg-accent/80 disabled:bg-[#121622] disabled:text-text-tertiary text-black text-xs font-mono font-bold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      EXECUTING PIPELINE...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      RUN CAPABILITY
                    </>
                  )}
                </button>
              </form>

              {/* Console stdout logs */}
              <div className="md:col-span-7 flex flex-col min-h-[350px] bg-bg-base border border-border-dim rounded-sm p-4 font-mono text-[10px] leading-relaxed text-text-secondary select-text">
                <div className="flex justify-between items-center text-text-tertiary border-b border-border-dim pb-2 mb-3">
                  <span>STDOUT CONSOLE CONTEXT</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/80 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/85" />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 max-h-[350px]">
                  {terminalLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-tertiary select-none">
                      <Terminal className="w-6 h-6 stroke-[1.5] mb-2" />
                      <span>HALBiz terminal idle. Click run.</span>
                    </div>
                  ) : (
                    terminalLogs.map((log, idx) => {
                      let color = 'text-text-secondary';
                      if (log.startsWith('[CRITICAL_ERR]')) color = 'text-negative font-semibold';
                      if (log.startsWith('[SYS_SUCCESS]')) color = 'text-accent font-semibold';
                      if (log.startsWith('[API_QUERY]')) color = 'text-blue-400';
                      return (
                        <div key={idx} className={color}>
                          {log}
                        </div>
                      );
                    })
                  )}

                  {/* RESULTS DISPLAY ACCORDION */}
                  <AnimatePresence>
                    {executionResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 pt-4 border-t border-border-dim space-y-3"
                      >
                        <div className="flex items-center gap-1.5 text-accent font-bold text-[10px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          <span>PIPELINE_RESULT_DECODED (200 OK)</span>
                        </div>

                        {selectedSkill.id === 'geo_map' ? (
                          <div className="bg-bg-overlay border border-border-dim p-3.5 rounded-sm select-text w-full">
                            <LeadMap 
                              leads={executionResult.leads || []} 
                              center={executionResult.center || { lat: 49.8951, lng: -97.1384 }} 
                              city={executionResult.city || 'Winnipeg'} 
                            />
                          </div>
                        ) : executionResult.report ? (
                          <div className="bg-bg-overlay border border-border-dim p-3.5 rounded-sm font-sans text-xs text-text-secondary leading-relaxed max-h-[300px] overflow-y-auto space-y-3 whitespace-pre-wrap select-text selection:bg-accent/30 selection:text-text-primary">
                            {executionResult.report}
                          </div>
                        ) : (
                          // Sourced intelligence results
                          <div className="space-y-3">
                            {executionResult.results && executionResult.results.map((r: any, index: number) => (
                              <div key={index} className="bg-bg-overlay border border-border-dim p-3.5 rounded-sm space-y-2 select-text">
                                <div className="flex justify-between font-sans items-start border-b border-border-dim pb-1.5">
                                  <span className="font-bold text-text-primary text-[11px] uppercase tracking-wide">{r.businessName}</span>
                                  <span className="text-[10px] font-mono text-accent font-bold">★ {r.googleRating || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-text-secondary font-mono leading-relaxed">
                                  <div>WEB: <a href={r.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-400 underline">{r.websiteUrl || 'None'}</a></div>
                                  <div>PHONE: {r.phone || 'None'}</div>
                                  <div>PERFORMANCE: <span className="text-yellow-400 font-bold">{r.performanceScore || '65'}/100</span></div>
                                  <div>SSL: <span className="text-accent font-bold">{r.sslStatus === 'secured' ? 'SECURE' : 'NOT SECURE'}</span></div>
                                </div>
                                <p className="text-[10px] font-sans text-text-secondary italic leading-normal border-t border-border-dim/60 pt-1.5 mt-1.5">
                                  {r.notes || 'No notes compiled.'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <div className="flex items-center gap-1.5 text-negative font-semibold mt-4">
                      <AlertCircle className="w-3.5 h-3.5 text-negative" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="py-20 text-center text-text-tertiary font-mono uppercase bg-bg-raised border border-border-dim rounded-sm">
            Please register or select a skill from the left directory catalog.
          </div>
        )}
      </div>

      {/* CREATE CUSTOM SKILL MODAL DIALOG */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-raised border border-border-dim max-w-xl w-full rounded-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              
              {/* Header */}
              <div className="px-5 py-4 border-b border-border-dim bg-bg-subtle flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 text-accent">
                  <PlusCircle className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Register Custom Capability</span>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-text-secondary hover:text-text-primary p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateCustomSkill} className="flex-1 overflow-y-auto p-5 space-y-4 select-text">
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Skill ID */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-text-secondary uppercase tracking-widest block font-bold">Unique ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. lead_price_audit"
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                      className="w-full bg-bg-base border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent font-mono"
                    />
                  </div>

                  {/* Skill Name */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-text-secondary uppercase tracking-widest block font-bold">Skill Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Competitor Audit"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-bg-base border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent font-sans"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-text-secondary uppercase tracking-widest block font-bold">Description *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Short description of what the intelligence capability does."
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    className="w-full bg-bg-base border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-text-secondary uppercase tracking-widest block font-bold">Category *</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as any)}
                      className="w-full bg-bg-base border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent font-sans"
                    >
                      <option value="website">website</option>
                      <option value="outreach">outreach</option>
                      <option value="seo">seo</option>
                      <option value="research">research</option>
                      <option value="geo">geo</option>
                      <option value="forecast">forecast</option>
                      <option value="general">general</option>
                    </select>
                  </div>

                  {/* Icon */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-text-secondary uppercase tracking-widest block font-bold">Icon Symbol</label>
                    <select
                      value={customIcon}
                      onChange={(e) => setCustomIcon(e.target.value)}
                      className="w-full bg-bg-base border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent font-sans"
                    >
                      {Object.keys(ICON_MAP).map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* INPUT FIELDS BUILDER */}
                <div className="space-y-3.5 pt-2 border-t border-border-dim">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-mono text-text-primary uppercase tracking-wider font-bold">Input Parameter Fields</span>
                    <button
                      type="button"
                      onClick={handleAddFieldInBuilder}
                      className="text-[9px] font-mono uppercase bg-accent-glow border border-accent/20 px-2 py-0.5 rounded text-accent flex items-center gap-1 hover:bg-accent/15 transition-all"
                    >
                      <Plus className="w-2.5 h-2.5" /> Add Field
                    </button>
                  </div>

                  {customInputs.length === 0 ? (
                    <p className="text-[10px] font-mono text-text-tertiary uppercase py-2">No custom input fields. Skill will execute unconditionally.</p>
                  ) : (
                    <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                      {customInputs.map((ci, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-bg-base border border-border-dim/60 p-2.5 rounded-sm">
                          
                          <div className="flex-1 grid grid-cols-12 gap-2">
                            {/* Key */}
                            <input
                              type="text"
                              required
                              placeholder="Key Name"
                              value={ci.name}
                              onChange={(e) => handleFieldChangeInBuilder(idx, 'name', e.target.value)}
                              className="col-span-4 bg-bg-raised border border-border-dim px-2 py-1 text-[10px] text-text-primary font-mono rounded-sm"
                            />

                            {/* Label */}
                            <input
                              type="text"
                              required
                              placeholder="Label Name"
                              value={ci.label}
                              onChange={(e) => handleFieldChangeInBuilder(idx, 'label', e.target.value)}
                              className="col-span-4 bg-bg-raised border border-border-dim px-2 py-1 text-[10px] text-text-primary font-sans rounded-sm"
                            />

                            {/* Type */}
                            <select
                              value={ci.type}
                              onChange={(e) => handleFieldChangeInBuilder(idx, 'type', e.target.value)}
                              className="col-span-3 bg-bg-raised border border-border-dim px-1 py-1 text-[10px] text-text-primary font-mono rounded-sm"
                            >
                              <option value="string">string</option>
                              <option value="number">number</option>
                              <option value="boolean">boolean</option>
                              <option value="select">select</option>
                            </select>

                            {/* Required Check */}
                            <div className="col-span-1 flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={ci.required}
                                onChange={(e) => handleFieldChangeInBuilder(idx, 'required', e.target.checked)}
                                className="w-3.5 h-3.5 rounded bg-bg-raised border-border-dim text-accent focus:ring-transparent accent-accent"
                                title="Required field?"
                              />
                            </div>
                          </div>

                          {/* Delete Field */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFieldInBuilder(idx)}
                            className="p-1 text-text-tertiary hover:text-negative hover:bg-negative/5 rounded-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border-dim shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="font-mono text-[10px] uppercase tracking-wider py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="bg-accent text-black font-mono font-bold text-[10px] uppercase tracking-wider py-2"
                  >
                    Load & Compile
                  </Button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
