import React, { useState, useRef } from 'react';
import { 
  Mail, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Minus, 
  MoveVertical, 
  Share2, 
  Code, 
  Video, 
  Heart, 
  Menu as MenuIcon, 
  FileText, 
  UserMinus,
  Save,
  Eye,
  Send,
  Sparkles,
  ChevronDown,
  Phone,
  ShieldCheck,
  Award,
  Clock,
  Layers,
  Check,
  Plus,
  Trash2,
  Upload
} from 'lucide-react';
import { useInspector } from '../context/InspectorContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';

interface EmailBlockItem {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'trust_badges' | 'footer';
  text?: string;
  subtext?: string;
  link?: string;
  imageUrl?: string;
  buttonText?: string;
  font?: string;
  size?: string;
  weight?: string;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  padding?: number;
  borderRadius?: number;
}

export const EmailDesignerPanel: React.FC = () => {
  const { openInspector, updateInspectorData, registerDataChangeCallback } = useInspector();
  const { workspaceConfig, updateWorkspaceConfig, regionalProfile, activeNiche } = useBusinessContext();
  const { showToast } = useToast();

  const [activePaletteTab, setActivePaletteTab] = useState<'blocks' | 'content'>('blocks');
  const [showMacroMenu, setShowMacroMenu] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateTag, setNewTemplateTag] = useState('Custom');
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('headline');

  const deviceImageInputRef = useRef<HTMLInputElement>(null);
  const deviceLogoInputRef = useRef<HTMLInputElement>(null);

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) {
        setEmailData(prev => ({ ...prev, techImageUrl: res }));
        showToast({
          title: 'Image Uploaded from Device',
          message: `${file.name} is now loaded in your email hero banner.`,
          type: 'success'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeviceLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) {
        setEmailData(prev => ({ ...prev, logoUrl: res }));
        showToast({
          title: 'Logo Uploaded from Device',
          message: `${file.name} set as business logo.`,
          type: 'success'
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Business profile personalization
  const companyName = workspaceConfig.agencyName || workspaceConfig.operatorName || 'Rapid Response Pros';
  const companyPhone = workspaceConfig.contactPhone || '(204) 555-0199';
  const companyLogo = workspaceConfig.agencyLogoUrl || '';
  const brandColor = workspaceConfig.brandColor || '#2563EB';

  const [subject, setSubject] = useState(`Special Service Priority for {{first_name}} in ${regionalProfile.city}`);

  // Dynamic Editable Email Blocks
  const [emailData, setEmailData] = useState({
    businessName: companyName,
    phone: companyPhone,
    logoUrl: companyLogo,
    headline: `Special Service Priority for ${regionalProfile.city} Homeowners`,
    subtext: `Get 15% OFF your next certified ${activeNiche || 'priority'} inspection in ${regionalProfile.city}. Use code LOCAL15.`,
    ctaText: 'Claim Your Priority Slot',
    ctaLink: workspaceConfig.bookingUrl || 'https://cal.com/hal-strategy',
    ctaBgColor: brandColor,
    ctaTextColor: '#FFFFFF',
    font: 'Inter',
    textColor: '#18181b',
    techImageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    address: `123 Main St, ${regionalProfile.city}, ${regionalProfile.countryCode}`
  });

  // Pre-configured Personalized Templates
  const systemTemplates = [
    {
      id: 'freeze-alert',
      name: 'Weather & Emergency Advisory',
      tag: 'Urgent',
      subject: `⚠ Urgent Weather Advisory for Homeowners in ${regionalProfile.city}`,
      headline: `Urgent Weather Advisory: Protect Your Property in ${regionalProfile.city}`,
      subtext: `Rapid temperature drops are triggering sudden plumbing, heating, and structural emergencies across ${regionalProfile.city}. Claim your free 15-point diagnostic check before severe conditions hit.`,
      ctaText: `Book Emergency Inspection in ${regionalProfile.city}`,
      ctaColor: '#dc2626'
    },
    {
      id: 'review-request',
      name: 'Post-Job 5-Star Review Request',
      tag: 'Reputation',
      subject: `Thank you from ${companyName} — how was our service?`,
      headline: `Thank You for Choosing ${companyName}!`,
      subtext: `Our certified technicians strive for 100% customer satisfaction. If we solved your problem quickly and cleanly, please take 30 seconds to share your review on Google.`,
      ctaText: `Leave a 5-Star Review`,
      ctaColor: '#10b981'
    },
    {
      id: 'vip-reactivation',
      name: 'Customer Re-activation & Loyalty',
      tag: 'Retention',
      subject: `Exclusive $75 VIP Voucher for ${companyName} Past Clients`,
      headline: `Exclusive $75 Customer Courtesy Voucher`,
      subtext: `As a valued past client in ${regionalProfile.city}, your property qualifies for a $75 credit toward any upcoming repair, tune-up, or installation this month.`,
      ctaText: `Redeem My $75 Credit`,
      ctaColor: brandColor
    },
    {
      id: 'seasonal-tuneup',
      name: 'Annual System Tune-Up Special',
      tag: 'Preventive',
      subject: `Annual Safety & Efficiency Inspection: ${regionalProfile.city}`,
      headline: `Complete 21-Point System Inspection & Tune-Up`,
      subtext: `Prevent costly emergency breakdowns before peak season. Our certified journeymen ensure complete safety, lower energy bills, and peace of mind.`,
      ctaText: `Schedule Comprehensive Tune-Up`,
      ctaColor: '#2563eb'
    },
    {
      id: 'lost-leads-speed',
      name: 'Website Speed & Lost Leads Audit Alert',
      tag: 'Outreach',
      subject: `Quick heads-up about {{company_name}}'s mobile load speed in ${regionalProfile.city}`,
      headline: `We Benchmarked ${regionalProfile.city} Contractors: Here's Where You're Losing Leads`,
      subtext: `During our quarterly local audit, your site showed a 4.2s mobile load delay. High-intent homeowners bounce after 2.5s and call the next contractor. We generated a free 1-click speed patch for your team.`,
      ctaText: `Review Free Speed & Lead Audit`,
      ctaColor: '#f59e0b'
    },
    {
      id: 'missed-call-recovery',
      name: 'Missed Call Rapid Text-Back & Email',
      tag: 'Recovery',
      subject: `Sorry we missed your call! Priority Dispatch for {{first_name}}`,
      headline: `We Just Received Your Inquiry at ${companyName}`,
      subtext: `All lines were temporarily assisting emergency calls in ${regionalProfile.city}. Our on-duty field manager was notified and can call or text you immediately.`,
      ctaText: `Confirm Callback Window`,
      ctaColor: '#06b6d4'
    }
  ];

  // Merge system templates with operator custom templates
  const customTemplates = workspaceConfig.customEmailTemplates || [];
  const allTemplates = [...customTemplates, ...systemTemplates];

  const handleApplyTemplate = (tpl: any) => {
    setSubject(tpl.subject);
    setEmailData(prev => ({
      ...prev,
      headline: tpl.headline,
      subtext: tpl.subtext,
      ctaText: tpl.ctaText,
      ctaBgColor: tpl.ctaColor || brandColor
    }));
    setShowTemplateModal(false);
    showToast({
      title: 'Template Applied',
      message: `Personalized for ${companyName} in ${regionalProfile.city}.`,
      type: 'success'
    });
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!newTemplateName.trim()) {
      showToast({
        title: 'Template Name Required',
        message: 'Please provide a name for this custom template.',
        type: 'warning'
      });
      return;
    }

    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      tag: newTemplateTag.trim() || 'Custom',
      subject,
      headline: emailData.headline,
      subtext: emailData.subtext,
      ctaText: emailData.ctaText,
      ctaColor: emailData.ctaBgColor || brandColor,
      createdAt: new Date().toISOString()
    };

    const updated = [newTemplate, ...customTemplates];
    updateWorkspaceConfig({ customEmailTemplates: updated });
    setNewTemplateName('');
    setShowSaveTemplateModal(false);
    showToast({
      title: 'Custom Template Saved',
      message: `"${newTemplate.name}" is now stored in your library.`,
      type: 'success'
    });
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTemplates.filter(t => t.id !== id);
    updateWorkspaceConfig({ customEmailTemplates: updated });
    showToast({
      title: 'Template Removed',
      message: 'Custom template deleted from library.',
      type: 'info'
    });
  };

  // Listen for real-time inspector updates
  const handleInspectorChange = React.useCallback((newData: any) => {
    if (!newData) return;
    if (newData?.targetBlock === 'headline') {
      setEmailData(prev => ({ 
        ...prev, 
        headline: newData.text || prev.headline,
        font: newData.font || prev.font,
        textColor: newData.color || prev.textColor
      }));
    } else if (newData?.targetBlock === 'cta') {
      setEmailData(prev => ({
        ...prev,
        ctaText: newData.text || prev.ctaText,
        ctaLink: newData.link || prev.ctaLink,
        ctaBgColor: newData.color || prev.ctaBgColor
      }));
    } else if (newData?.targetBlock === 'subtext') {
      setEmailData(prev => ({
        ...prev,
        subtext: newData.text || prev.subtext
      }));
    }
  }, []);

  React.useEffect(() => {
    registerDataChangeCallback(handleInspectorChange);
  }, [registerDataChangeCallback, handleInspectorChange]);

  const handleSelectBlock = (blockType: string, title: string, data: any) => {
    setSelectedBlockId(data.targetBlock);
    openInspector('email_block', title, data);
  };

  const handleInsertMacro = (macro: string) => {
    setSubject(prev => `${prev} ${macro}`);
    setShowMacroMenu(false);
  };

  const handleSendTest = () => {
    showToast({
      title: 'Test Email Dispatched',
      message: `Delivered preview email to ${workspaceConfig.businessEmail || 'operator@hal.biz'}`,
      type: 'success'
    });
  };

  const handleSaveDraft = () => {
    showToast({
      title: 'Campaign Draft Saved',
      message: 'Email campaign saved to outreach repository.',
      type: 'success'
    });
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base text-text-primary select-none overflow-hidden">
      
      {/* ─── HEADER TOOLBAR ─── */}
      <div className="px-5 py-3 border-b border-border-dim bg-bg-raised flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary leading-tight font-display">Email Designer</h2>
            <p className="text-[11px] text-text-secondary">Create, customize, and personalize email campaigns</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Blocks Toggle */}
          <button
            onClick={() => setShowMobilePalette(!showMobilePalette)}
            className="md:hidden px-2.5 py-1.5 rounded-lg border border-border-dim bg-bg-subtle text-xs font-mono text-cyan-400 flex items-center gap-1 cursor-pointer"
          >
            <span>{showMobilePalette ? 'Hide Palette' : 'Blocks'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showMobilePalette ? 'rotate-180' : ''}`} />
          </button>

          <button 
            onClick={() => setShowTemplateModal(true)}
            className="px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-mono text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Templates</span>
          </button>
          
          <button 
            onClick={handleSaveDraft}
            className="px-3 py-1.5 rounded-lg border border-border-dim bg-bg-subtle hover:bg-bg-raised text-xs font-mono text-text-secondary hover:text-text-primary transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save Draft</span>
          </button>

          <button 
            onClick={handleSendTest}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-sans transition-all cursor-pointer shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test</span>
          </button>
        </div>
      </div>

      {/* ─── TEMPLATES SELECTION MODAL ─── */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-raised border border-border-dim rounded-xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-text-primary">
            <div className="flex items-center justify-between border-b border-border-dim pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">Outreach & Retainer Template Library</h3>
                <p className="text-xs text-text-secondary">Pre-tailored to {companyName} in {regionalProfile.city} ({allTemplates.length} available)</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setShowSaveTemplateModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Save Current Design</span>
                </button>
                <button 
                  onClick={() => setShowTemplateModal(false)}
                  className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-subtle cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allTemplates.map(tpl => {
                const isCustom = tpl.id.startsWith('custom-');
                return (
                  <div 
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="p-4 rounded-lg bg-bg-base border border-border-dim hover:border-cyan-500/50 hover:bg-bg-subtle cursor-pointer transition-all space-y-2 group relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
                        isCustom 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      }`}>
                        {tpl.tag}
                      </span>
                      <div className="flex items-center gap-2">
                        {isCustom && (
                          <button
                            onClick={(e) => handleDeleteCustomTemplate(tpl.id, e)}
                            className="p-1 rounded hover:bg-rose-500/20 text-text-tertiary hover:text-rose-400 transition-colors"
                            title="Delete template"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        <span className="text-xs text-text-tertiary group-hover:text-cyan-400 font-mono">Use ➔</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary group-hover:text-cyan-400 transition-colors">
                      {tpl.name}
                    </h4>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {tpl.headline}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── SAVE AS CUSTOM TEMPLATE MODAL ─── */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-bg-raised border border-border-dim rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 text-text-primary">
            <div className="flex items-center justify-between border-b border-border-dim pb-2.5">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Save className="w-4 h-4 text-cyan-400" />
                <span>Save Design as Custom Template</span>
              </h3>
              <button 
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-text-secondary hover:text-text-primary text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-text-secondary mb-1 font-mono uppercase text-[10px]">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Winnipeg Emergency Frozen Pipe Outreach"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-dim text-text-primary font-sans focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-text-secondary mb-1 font-mono uppercase text-[10px]">Category Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Cold Pitch, Retention, Reactivation, Local Special"
                  value={newTemplateTag}
                  onChange={(e) => setNewTemplateTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-dim text-text-primary font-sans focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-bg-base border border-border-dim text-text-secondary text-[11px] font-mono">
                <span className="text-cyan-400 font-bold block mb-0.5">Captures:</span>
                Subject, Headline, Offer Subtext, and CTA Button colors for instant 1-click re-use.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-dim">
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-3 py-1.5 rounded-lg border border-border-dim text-text-secondary hover:text-text-primary text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrentAsTemplate}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-sans font-bold transition-all cursor-pointer shadow-md"
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUBJECT LINE & MACRO BAR ─── */}
      <div className="px-5 py-2.5 bg-bg-raised/60 border-b border-border-dim flex items-center gap-3 shrink-0">
        <span className="text-xs font-mono text-text-secondary font-semibold uppercase shrink-0">Subject:</span>
        <input 
          type="text" 
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="flex-1 bg-bg-base border border-border-dim focus:border-cyan-500 rounded-lg px-3 py-1 text-xs text-text-primary font-sans outline-hidden min-w-0"
          placeholder="Enter email subject line..."
        />
        
        {/* Macro Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMacroMenu(!showMacroMenu)}
            className="px-3 py-1 rounded-lg border border-border-dim bg-bg-subtle hover:bg-bg-raised text-xs font-mono text-cyan-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Insert Macro</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showMacroMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-bg-raised border border-border-dim rounded-lg shadow-xl py-1 z-40 text-xs font-mono">
              {[
                { label: 'First Name', code: '{{first_name}}' },
                { label: 'Business Name', code: '{{business_name}}' },
                { label: 'City', code: '{{city}}' },
                { label: 'Expiry Date', code: '{{expiry_date}}' },
                { label: 'Phone', code: '{{phone}}' },
              ].map(m => (
                <button
                  key={m.code}
                  onClick={() => handleInsertMacro(m.code)}
                  className="w-full text-left px-3 py-1.5 hover:bg-cyan-500/10 hover:text-cyan-400 text-text-secondary transition-colors flex justify-between items-center"
                >
                  <span>{m.label}</span>
                  <span className="text-[10px] text-text-tertiary">{m.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── WORKSPACE SPLIT: BLOCK PALETTE + CENTER EMAIL CANVAS ─── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* LEFT PALETTE: BLOCKS & CONTENT (RESPONSIVE) */}
        <div className={`${showMobilePalette ? 'flex' : 'hidden'} md:flex w-full md:w-56 shrink-0 border-r border-border-dim bg-bg-raised/70 flex-col max-h-60 md:max-h-none overflow-y-auto select-none z-10`}>
          {/* Palette Tabs */}
          <div className="flex border-b border-border-dim shrink-0">
            <button
              onClick={() => setActivePaletteTab('blocks')}
              className={`flex-1 py-2 text-xs font-mono font-bold text-center border-b-2 transition-all cursor-pointer ${
                activePaletteTab === 'blocks'
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Blocks
            </button>
            <button
              onClick={() => setActivePaletteTab('content')}
              className={`flex-1 py-2 text-xs font-mono font-bold text-center border-b-2 transition-all cursor-pointer ${
                activePaletteTab === 'content'
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Content
            </button>
          </div>

          {/* Block Grid */}
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { id: 'text', label: 'Text', icon: Type },
              { id: 'image', label: 'Image', icon: ImageIcon },
              { id: 'button', label: 'Button', icon: Square },
              { id: 'divider', label: 'Divider', icon: Minus },
              { id: 'spacer', label: 'Spacer', icon: MoveVertical },
              { id: 'social', label: 'Social', icon: Share2 },
              { id: 'html', label: 'HTML', icon: Code },
              { id: 'video', label: 'Video', icon: Video },
              { id: 'icon', label: 'Icon', icon: Heart },
              { id: 'menu', label: 'Menu', icon: MenuIcon },
              { id: 'footer', label: 'Footer', icon: FileText },
              { id: 'unsubscribe', label: 'Unsubscribe', icon: UserMinus },
            ].map((block) => {
              const Icon = block.icon;
              return (
                <button
                  key={block.id}
                  onClick={() => {
                    handleSelectBlock('email_block', `${block.label} Block`, {
                      targetBlock: block.id,
                      text: `Custom ${block.label} content`,
                      color: '#2563EB',
                      font: 'Inter',
                      size: '16px',
                      weight: 'Regular',
                      align: 'left'
                    });
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-lg border border-border-dim bg-bg-base hover:bg-bg-subtle hover:border-cyan-500/50 text-text-secondary hover:text-text-primary transition-all cursor-pointer group"
                >
                  <Icon className="w-4 h-4 mb-1.5 text-text-tertiary group-hover:text-cyan-400 transition-colors" />
                  <span className="text-[11px] font-sans font-medium">{block.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Preset Footnote & Device Image Upload */}
          <div className="mt-auto p-3 border-t border-border-dim space-y-2 bg-bg-base/40">
            <button
              type="button"
              onClick={() => deviceImageInputRef.current?.click()}
              className="w-full py-2 px-2.5 rounded-lg border border-dashed border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-mono text-cyan-400 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              title="Upload photo from phone or computer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image from Device</span>
            </button>
            <p className="text-[10px] text-text-tertiary font-mono leading-tight">
              Click any block to inspect and customize typography or wording in real time.
            </p>
          </div>
        </div>

        {/* CENTER EMAIL CANVAS (THE OFFICE WORKSPACE) */}
        <div className="flex-1 bg-bg-subtle/50 p-4 md:p-8 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-xl bg-white text-[#18181b] rounded-xl shadow-2xl overflow-hidden border border-slate-200 transition-all font-sans">
            
            {/* EMAIL HEADER */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div 
                onClick={() => handleSelectBlock('email_block', 'Brand Header', {
                  targetBlock: 'brand',
                  text: emailData.businessName,
                  font: 'Inter',
                  size: '18px',
                  color: '#1e3a8a'
                })}
                className="flex items-center gap-2 cursor-pointer hover:ring-2 hover:ring-blue-400 rounded p-1 transition-all"
              >
                <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  {emailData.businessName.slice(0, 1)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black tracking-wider uppercase text-blue-900 leading-tight">
                    {emailData.businessName}
                  </span>
                  <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase leading-none">
                    {activeNiche.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-sans">Need help? Call us</span>
                <span className="text-xs font-bold text-slate-800 font-mono">{emailData.phone}</span>
              </div>
            </div>

            {/* EMAIL HERO BODY: TWO COLUMN LAYOUT */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              
              {/* Left Column: Greeting, Headline, Subtext, CTA */}
              <div className="space-y-4">
                <div 
                  onClick={() => handleSelectBlock('email_block', 'Email Greeting', {
                    targetBlock: 'headline',
                    text: emailData.headline,
                    font: emailData.font,
                    size: '24px',
                    weight: 'Bold',
                    color: emailData.textColor
                  })}
                  className={`cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-lg p-2 transition-all ${
                    selectedBlockId === 'headline' ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
                  }`}
                >
                  <p className="text-base font-bold text-blue-600 leading-snug">Hi {'{{first_name}}'},</p>
                  <h1 className="text-xl font-extrabold text-slate-900 leading-tight mt-1">
                    {emailData.headline}
                  </h1>
                </div>

                <div 
                  onClick={() => handleSelectBlock('email_block', 'Body Subtext', {
                    targetBlock: 'subtext',
                    text: emailData.subtext,
                    font: 'Inter',
                    size: '14px',
                    weight: 'Regular',
                    color: '#4b5563'
                  })}
                  className={`cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-lg p-2 transition-all ${
                    selectedBlockId === 'subtext' ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
                  }`}
                >
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {emailData.subtext}
                  </p>
                </div>

                <div 
                  onClick={() => handleSelectBlock('email_block', 'Call To Action', {
                    targetBlock: 'cta',
                    text: emailData.ctaText,
                    link: emailData.ctaLink,
                    color: emailData.ctaBgColor,
                    size: '14px',
                    weight: 'Bold'
                  })}
                  className={`cursor-pointer inline-block hover:ring-2 hover:ring-blue-400 rounded-lg transition-all ${
                    selectedBlockId === 'cta' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <button 
                    style={{ backgroundColor: emailData.ctaBgColor, color: emailData.ctaTextColor }}
                    className="px-6 py-2.5 rounded-md font-bold text-xs shadow-md hover:brightness-110 transition-all cursor-pointer"
                  >
                    {emailData.ctaText}
                  </button>
                </div>
              </div>

              {/* Right Column: Hero Image (Friendly Technician) */}
              <div 
                onClick={() => handleSelectBlock('email_block', 'Hero Image', {
                  targetBlock: 'image',
                  text: 'Technician Portrait',
                  link: emailData.techImageUrl
                })}
                className="cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-xl overflow-hidden transition-all shadow-md group relative"
              >
                <img 
                  src={emailData.techImageUrl} 
                  alt="Service Technician" 
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-white">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deviceImageInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from Device</span>
                  </button>
                  <span className="text-[9.5px] text-white/80">JPG, PNG, WebP</span>
                </div>
              </div>

            </div>

            {/* TRUST BADGES ROW */}
            <div className="px-6 py-4 bg-slate-50 border-t border-b border-slate-100 grid grid-cols-3 gap-2 text-center text-slate-700">
              <div className="flex flex-col items-center">
                <Clock className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-[11px] font-bold">Fast & Reliable</span>
                <span className="text-[9.5px] text-slate-500">24/7 Service</span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-[11px] font-bold">Licensed & Insured</span>
                <span className="text-[9.5px] text-slate-500">Peace of mind</span>
              </div>
              <div className="flex flex-col items-center">
                <Award className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-[11px] font-bold">Satisfaction Guaranteed</span>
                <span className="text-[9.5px] text-slate-500">100% Quality</span>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-6 text-center text-slate-400 text-[10.5px] space-y-2 bg-white">
              <p>You received this email because you are a valued customer of {emailData.businessName}.</p>
              <div className="flex justify-center gap-3 text-blue-600 font-medium">
                <span className="hover:underline cursor-pointer">Unsubscribe</span>
                <span>•</span>
                <span className="hover:underline cursor-pointer">Update Preferences</span>
              </div>
              <p className="text-slate-400 font-mono text-[9.5px] mt-1">{emailData.address}</p>
            </div>

          </div>
        </div>

      </div>

      <input
        type="file"
        ref={deviceImageInputRef}
        onChange={handleDeviceImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={deviceLogoInputRef}
        onChange={handleDeviceLogoUpload}
        accept="image/*"
        className="hidden"
      />

    </div>
  );
};
