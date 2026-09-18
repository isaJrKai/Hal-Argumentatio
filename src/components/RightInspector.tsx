import React, { useState } from 'react';
import { useInspector } from '../context/InspectorContext';
import { useBusinessContext } from '../context/BusinessContext';
import { 
  X, 
  Sliders, 
  Sparkles, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  ExternalLink,
  ChevronDown,
  Copy,
  Check,
  Send,
  Wrench,
  ShieldAlert,
  Zap,
  Phone,
  Mail,
  Building,
  DollarSign,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export const RightInspector: React.FC = () => {
  const { inspectorState, closeInspector, setInspectorTab, updateInspectorData } = useInspector();
  const { regionalProfile, activeCity, activeNiche, formatCurrency } = useBusinessContext();
  const [hermesPrompt, setHermesPrompt] = useState('');
  const [isHermesLoading, setIsHermesLoading] = useState(false);
  const [hermesSuccessMessage, setHermesSuccessMessage] = useState<string | null>(null);

  if (!inspectorState.isOpen) {
    return null;
  }

  const { type, title, data, activeTab } = inspectorState;

  // Hermes AI Assistant inside the Inspector
  const handleHermesEnhance = async (instruction: string) => {
    setIsHermesLoading(true);
    setHermesSuccessMessage(null);
    try {
      // Simulate or call real Hermes endpoint
      await new Promise(r => setTimeout(r, 600));
      if (type === 'email_block') {
        let enhancedText = data?.text || '';
        if (instruction === 'polish') {
          enhancedText = `Special Urgent Notice: ${enhancedText.replace('Hi', 'Hello valued homeowner,')}`;
        } else if (instruction === 'weather') {
          enhancedText = `${enhancedText} (Updated for recent ${regionalProfile.city} seasonal weather advisories).`;
        }
        updateInspectorData({ ...data, text: enhancedText });
        setHermesSuccessMessage('Copy enhanced with regional intent!');
      } else if (type === 'lead') {
        setHermesSuccessMessage(`Hermes generated a custom pitch angle for ${data.businessName || 'this prospect'}.`);
      }
    } finally {
      setIsHermesLoading(false);
      setTimeout(() => setHermesSuccessMessage(null), 3500);
    }
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      <div 
        onClick={closeInspector}
        className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
      />

      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-88 xl:relative xl:w-80 shrink-0 border-l border-border-dim bg-bg-raised flex flex-col h-full select-none text-text-primary transition-all shadow-2xl xl:shadow-none">
      
      {/* Header Bar */}
      <div className="h-12 px-4 border-b border-border-dim/60 flex items-center justify-between shrink-0 bg-bg-overlay/40">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-text-primary truncate">
            {title || 'Inspector'}
          </span>
          {type && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-accent/15 text-accent uppercase shrink-0">
              {type.replace('_', ' ')}
            </span>
          )}
        </div>
        <button
          onClick={closeInspector}
          className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs - only displayed when inspecting rich multi-tab blocks */}
      {type === 'email_block' && (
        <div className="flex items-center border-b border-border-dim/60 px-2 shrink-0 bg-bg-base/50">
          <button
            onClick={() => setInspectorTab('content')}
            className={`flex-1 py-2 text-xs font-medium text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'content'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setInspectorTab('style')}
            className={`flex-1 py-2 text-xs font-medium text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'style'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Style
          </button>
          <button
            onClick={() => setInspectorTab('settings')}
            className={`flex-1 py-2 text-xs font-medium text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Settings
          </button>
        </div>
      )}

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        
        {/* CASE 1: EMAIL / VISUAL BLOCK */}
        {type === 'email_block' && (
          <>
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Text Content</label>
                  <textarea
                    value={data?.text || ''}
                    onChange={(e) => updateInspectorData({ ...data, text: e.target.value })}
                    rows={4}
                    className="w-full bg-bg-base border border-border-dim focus:border-accent rounded-lg p-2 text-xs font-sans text-text-primary outline-hidden resize-none"
                    placeholder="Enter block text..."
                  />
                </div>

                {data?.targetBlock === 'image' || data?.type === 'image' ? (
                  <div className="space-y-2.5 p-3 bg-bg-subtle rounded-lg border border-border-dim">
                    <label className="block text-[11px] font-mono text-text-secondary font-bold uppercase">
                      Image Source
                    </label>
                    {data?.link && (
                      <div className="rounded-md overflow-hidden border border-border-dim h-28 bg-black/20 relative">
                        <img src={data.link} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div>
                      <label className="w-full py-2 px-3 rounded-lg border border-dashed border-accent/50 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const res = ev.target?.result as string;
                              if (res) updateInspectorData({ ...data, link: res });
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary font-mono block mb-1">Or image URL:</span>
                      <input
                        type="text"
                        value={data?.link || ''}
                        onChange={(e) => updateInspectorData({ ...data, link: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-bg-base border border-border-dim focus:border-accent rounded-lg px-2.5 py-1.5 text-xs font-mono text-text-primary outline-hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Link URL</label>
                    <input
                      type="text"
                      value={data?.link || ''}
                      onChange={(e) => updateInspectorData({ ...data, link: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full bg-bg-base border border-border-dim focus:border-accent rounded-lg px-2.5 py-1.5 text-xs font-mono text-text-primary outline-hidden"
                    />
                  </div>
                )}

                {/* Ambient Hermes Copywriter */}
                <div className="p-3 rounded-lg border border-accent/30 bg-accent/5 space-y-2">
                  <div className="flex items-center gap-1.5 text-accent font-bold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Hermes Co-Pilot</span>
                  </div>
                  <p className="text-[10.5px] text-text-secondary leading-relaxed">
                    Optimize wording for high conversion and regional relevance in {regionalProfile.city}.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleHermesEnhance('polish')}
                      disabled={isHermesLoading}
                      className="px-2 py-1 rounded bg-bg-base border border-accent/40 text-accent hover:bg-accent hover:text-white font-mono text-[10px] transition-all cursor-pointer"
                    >
                      {isHermesLoading ? 'Thinking...' : '✦ Urgency Polish'}
                    </button>
                    <button
                      onClick={() => handleHermesEnhance('weather')}
                      disabled={isHermesLoading}
                      className="px-2 py-1 rounded bg-bg-base border border-accent/40 text-accent hover:bg-accent hover:text-white font-mono text-[10px] transition-all cursor-pointer"
                    >
                      ✦ Weather Hook
                    </button>
                  </div>
                  {hermesSuccessMessage && (
                    <p className="text-[10px] text-positive font-mono mt-1">{hermesSuccessMessage}</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'style' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Font Family</label>
                  <select
                    value={data?.font || 'Inter'}
                    onChange={(e) => updateInspectorData({ ...data, font: e.target.value })}
                    className="w-full bg-bg-base border border-border-dim focus:border-accent rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-hidden cursor-pointer"
                  >
                    <option value="Inter">Inter (Sans)</option>
                    <option value="Newsreader">Newsreader (Serif)</option>
                    <option value="Instrument Sans">Instrument Sans</option>
                    <option value="Geist">Geist</option>
                    <option value="monospace">JetBrains Mono</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Font Size</label>
                    <select
                      value={data?.size || '16px'}
                      onChange={(e) => updateInspectorData({ ...data, size: e.target.value })}
                      className="w-full bg-bg-base border border-border-dim focus:border-accent rounded-lg px-2 py-1.5 text-xs text-text-primary outline-hidden cursor-pointer"
                    >
                      <option value="12px">12px</option>
                      <option value="14px">14px</option>
                      <option value="16px">16px</option>
                      <option value="18px">18px</option>
                      <option value="24px">24px</option>
                      <option value="32px">32px</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Weight</label>
                    <select
                      value={data?.weight || 'Regular'}
                      onChange={(e) => updateInspectorData({ ...data, weight: e.target.value })}
                      className="w-full bg-bg-base border border-border-dim focus:border-accent rounded-lg px-2 py-1.5 text-xs text-text-primary outline-hidden cursor-pointer"
                    >
                      <option value="Regular">Regular (400)</option>
                      <option value="Medium">Medium (500)</option>
                      <option value="SemiBold">SemiBold (600)</option>
                      <option value="Bold">Bold (700)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={data?.color || '#2563EB'}
                      onChange={(e) => updateInspectorData({ ...data, color: e.target.value })}
                      className="w-8 h-8 rounded border border-border-dim bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={data?.color || '#2563EB'}
                      onChange={(e) => updateInspectorData({ ...data, color: e.target.value })}
                      className="flex-1 bg-bg-base border border-border-dim focus:border-accent rounded-lg px-2.5 py-1.5 text-xs font-mono text-text-primary outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Text Alignment</label>
                  <div className="grid grid-cols-4 gap-1 p-1 bg-bg-base border border-border-dim rounded-lg">
                    {(['left', 'center', 'right', 'justify'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => updateInspectorData({ ...data, align })}
                        className={`p-1.5 rounded flex items-center justify-center transition-all cursor-pointer ${
                          (data?.align || 'left') === align
                            ? 'bg-accent text-white font-bold'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                        }`}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                        {align === 'justify' && <AlignJustify className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Padding (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    value={data?.padding || 16}
                    onChange={(e) => updateInspectorData({ ...data, padding: Number(e.target.value) })}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-tertiary mt-1">
                    <span>0px</span>
                    <span className="text-text-primary font-bold">{data?.padding || 16}px</span>
                    <span>48px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Border Radius (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={data?.borderRadius || 8}
                    onChange={(e) => updateInspectorData({ ...data, borderRadius: Number(e.target.value) })}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-tertiary mt-1">
                    <span>0px</span>
                    <span className="text-text-primary font-bold">{data?.borderRadius || 8}px</span>
                    <span>24px</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-dim">
                  <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data?.hideOnMobile || false}
                      onChange={(e) => updateInspectorData({ ...data, hideOnMobile: e.target.checked })}
                      className="rounded accent-accent"
                    />
                    <span>Hide block on mobile viewports</span>
                  </label>
                </div>
              </div>
            )}
          </>
        )}

        {/* CASE 2: PROSPECT / LEAD RECORD */}
        {type === 'lead' && (
          <div className="space-y-4">
            <div className="p-3 bg-bg-base border border-border-dim rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-accent">{data?.businessType || activeNiche}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-subtle text-text-secondary capitalize">{data?.status || 'new'}</span>
              </div>
              <h3 className="text-sm font-bold text-text-primary leading-tight">{data?.businessName || 'Selected Prospect'}</h3>
              <p className="text-xs text-text-secondary flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <span>{data?.city || activeCity}, {data?.territoryCode || regionalProfile.countryCode}</span>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-border-dim/40 font-mono text-[11px]">
                <span className="text-text-tertiary">Predicted LTV</span>
                <span className="text-positive font-bold">{formatCurrency(data?.predictedLtvUsd || 4500)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-dim/40 font-mono text-[11px]">
                <span className="text-text-tertiary">Speed Audit Score</span>
                <span className="text-amber-400 font-bold">{data?.performanceScore ?? 42}/100</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-dim/40 font-mono text-[11px]">
                <span className="text-text-tertiary">SEO Health</span>
                <span className="text-accent font-bold">{data?.seoScore ?? 68}/100</span>
              </div>
            </div>

            {/* Hermes 1-Click Actions */}
            <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hermes Diagnostic Actions</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => handleHermesEnhance('lead_pitch')}
                  className="w-full text-left px-2.5 py-1.5 rounded bg-bg-base border border-border-dim hover:border-indigo-500/60 text-text-primary hover:text-indigo-400 text-xs font-mono flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>✦ Draft Cold Pitch (Outreach)</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => handleHermesEnhance('lead_landing')}
                  className="w-full text-left px-2.5 py-1.5 rounded bg-bg-base border border-border-dim hover:border-indigo-500/60 text-text-primary hover:text-indigo-400 text-xs font-mono flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>✦ Generate High-Speed Lander</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              {hermesSuccessMessage && (
                <p className="text-[10px] text-positive font-mono mt-1">{hermesSuccessMessage}</p>
              )}
            </div>
          </div>
        )}

        {/* CASE 3: LANDING PAGE SECTION */}
        {type === 'landing_section' && (
          <div className="space-y-4">
            <div className="p-3 bg-bg-base border border-border-dim rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-accent">
                  {data?.sectionKey?.replace('_', ' ') || 'Landing Section'}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-mono">
                  <input
                    type="checkbox"
                    checked={data?.sectionData?.active ?? true}
                    onChange={(e) => {
                      const updated = {
                        ...data,
                        sectionData: {
                          ...data.sectionData,
                          active: e.target.checked
                        }
                      };
                      updateInspectorData(updated);
                    }}
                    className="accent-accent w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span className={data?.sectionData?.active !== false ? 'text-positive font-bold' : 'text-text-tertiary'}>
                    {data?.sectionData?.active !== false ? 'Active' : 'Disabled'}
                  </span>
                </label>
              </div>
              <div className="text-xs text-text-secondary font-mono">
                Live property inspector connected to Landing Page Studio.
              </div>
            </div>

            {/* Headline / Title */}
            {(data?.sectionData?.headline !== undefined || data?.sectionData?.title !== undefined) && (
              <div>
                <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">
                  {data?.sectionData?.headline !== undefined ? 'Headline' : 'Title'}
                </label>
                <input
                  type="text"
                  value={data?.sectionData?.headline ?? data?.sectionData?.title ?? ''}
                  onChange={(e) => {
                    const field = data?.sectionData?.headline !== undefined ? 'headline' : 'title';
                    const updated = {
                      ...data,
                      sectionData: {
                        ...data.sectionData,
                        [field]: e.target.value
                      }
                    };
                    updateInspectorData(updated);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim focus:border-accent text-text-primary text-xs outline-hidden"
                />
              </div>
            )}

            {/* Subheadline / Text */}
            {(data?.sectionData?.subheadline !== undefined || data?.sectionData?.text !== undefined) && (
              <div>
                <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">
                  {data?.sectionData?.subheadline !== undefined ? 'Subheadline' : 'Content Text'}
                </label>
                <textarea
                  rows={3}
                  value={data?.sectionData?.subheadline ?? data?.sectionData?.text ?? ''}
                  onChange={(e) => {
                    const field = data?.sectionData?.subheadline !== undefined ? 'subheadline' : 'text';
                    const updated = {
                      ...data,
                      sectionData: {
                        ...data.sectionData,
                        [field]: e.target.value
                      }
                    };
                    updateInspectorData(updated);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim focus:border-accent text-text-primary text-xs outline-hidden resize-none"
                />
              </div>
            )}

            {/* Description / Subtitle */}
            {(data?.sectionData?.description !== undefined || data?.sectionData?.subtitle !== undefined) && (
              <div>
                <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">
                  {data?.sectionData?.description !== undefined ? 'Description' : 'Subtitle'}
                </label>
                <textarea
                  rows={2}
                  value={data?.sectionData?.description ?? data?.sectionData?.subtitle ?? ''}
                  onChange={(e) => {
                    const field = data?.sectionData?.description !== undefined ? 'description' : 'subtitle';
                    const updated = {
                      ...data,
                      sectionData: {
                        ...data.sectionData,
                        [field]: e.target.value
                      }
                    };
                    updateInspectorData(updated);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim focus:border-accent text-text-primary text-xs outline-hidden resize-none"
                />
              </div>
            )}

            {/* CTA / Button Text */}
            {(data?.sectionData?.primaryCtaText !== undefined || data?.sectionData?.ctaText !== undefined || data?.sectionData?.buttonText !== undefined) && (
              <div>
                <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">
                  CTA / Button Text
                </label>
                <input
                  type="text"
                  value={data.sectionData.primaryCtaText ?? data.sectionData.ctaText ?? data.sectionData.buttonText ?? ''}
                  onChange={(e) => {
                    const field = data.sectionData.primaryCtaText !== undefined 
                      ? 'primaryCtaText' 
                      : data.sectionData.ctaText !== undefined 
                        ? 'ctaText' 
                        : 'buttonText';
                    const updated = {
                      ...data,
                      sectionData: {
                        ...data.sectionData,
                        [field]: e.target.value
                      }
                    };
                    updateInspectorData(updated);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim focus:border-accent text-text-primary text-xs outline-hidden"
                />
              </div>
            )}

            {/* Badge / Urgency Tag */}
            {(data?.sectionData?.urgencyBadge !== undefined || data?.sectionData?.badgeText !== undefined || data?.sectionData?.tag !== undefined) && (
              <div>
                <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">
                  Badge / Callout Text
                </label>
                <input
                  type="text"
                  value={data.sectionData.urgencyBadge ?? data.sectionData.badgeText ?? data.sectionData.tag ?? ''}
                  onChange={(e) => {
                    const field = data.sectionData.urgencyBadge !== undefined 
                      ? 'urgencyBadge' 
                      : data.sectionData.badgeText !== undefined 
                        ? 'badgeText' 
                        : 'tag';
                    const updated = {
                      ...data,
                      sectionData: {
                        ...data.sectionData,
                        [field]: e.target.value
                      }
                    };
                    updateInspectorData(updated);
                  }}
                  className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim focus:border-accent text-text-primary text-xs outline-hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* CASE 4: LANDING PAGE CONFIG */}
        {type === 'landing_config' && (
          <div className="space-y-4">
            <div className="p-3 bg-bg-base border border-border-dim rounded-lg space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-accent">Global Lander Identity</span>
              <div className="text-xs text-text-secondary font-mono">
                Updates branding and metadata across all rendered sections.
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Business / Trade Name</label>
              <input
                type="text"
                value={data?.businessName || ''}
                onChange={(e) => updateInspectorData({ ...data, businessName: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim focus:border-accent text-text-primary text-xs outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Primary City Territory</label>
              <input
                type="text"
                value={data?.city || ''}
                onChange={(e) => updateInspectorData({ ...data, city: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim focus:border-accent text-text-primary text-xs outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Click-to-Call Phone</label>
              <input
                type="text"
                value={data?.phone || ''}
                onChange={(e) => updateInspectorData({ ...data, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim focus:border-accent text-text-primary text-xs outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-text-secondary mb-1 uppercase font-bold">Theme / Color Preset</label>
              <select
                value={data?.branding?.colorPreset || 'paper_ink'}
                onChange={(e) => {
                  const preset = e.target.value;
                  let primary = '#18181b';
                  let secondary = '#f7f5f0';
                  let accent = '#9a3412';
                  if (preset === 'emergency_amber') { primary = '#0284c7'; secondary = '#0f172a'; accent = '#f59e0b'; }
                  else if (preset === 'trust_navy') { primary = '#2563eb'; secondary = '#0f172a'; accent = '#38bdf8'; }
                  else if (preset === 'eco_green') { primary = '#059669'; secondary = '#064e3b'; accent = '#10b981'; }
                  
                  updateInspectorData({
                    ...data,
                    branding: {
                      ...data.branding,
                      colorPreset: preset,
                      primaryColor: primary,
                      secondaryColor: secondary,
                      accentColor: accent
                    }
                  });
                }}
                className="w-full px-2.5 py-1.5 rounded bg-bg-base border border-border-dim focus:border-accent text-text-primary text-xs outline-hidden"
              >
                <option value="paper_ink">Paper & Ink (Warm Archival)</option>
                <option value="emergency_amber">Emergency Amber</option>
                <option value="trust_navy">Trust Navy & Cyan</option>
                <option value="modern_slate">Modern Slate</option>
                <option value="eco_green">Eco Emerald</option>
                <option value="electric_gold">Electric Gold</option>
              </select>
            </div>
          </div>
        )}

        {/* DEFAULT: WORKSPACE OVERVIEW / TELEMETRY */}
        {(!type || type === 'metric') && (
          <div className="space-y-4">
            <div className="p-3 bg-bg-base border border-border-dim rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-text-tertiary uppercase">Active Territory</span>
                <span className="text-sm">{regionalProfile.flag}</span>
              </div>
              <div className="text-sm font-bold text-text-primary">{regionalProfile.city}, {regionalProfile.countryCode}</div>
              <div className="text-[11px] font-mono text-text-secondary">Trade: <span className="text-accent font-bold capitalize">{activeNiche}</span></div>
            </div>

            <div className="p-3 bg-bg-base border border-border-dim rounded-lg space-y-2">
              <span className="text-[10px] font-mono uppercase text-text-tertiary">Quick Directives</span>
              <ul className="space-y-1.5 text-[11px] text-text-secondary">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-positive shrink-0" />
                  <span>Click any lead or campaign to inspect details</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span>Use Tools ➔ Email Designer for visual campaign drafts</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Hermes Co-Pilot runs ambiently across all modules</span>
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </aside>
  </>
  );
};
