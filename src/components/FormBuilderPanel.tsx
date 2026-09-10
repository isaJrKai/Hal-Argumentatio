import React, { useState } from 'react';
import { 
  FileCheck, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Code, 
  Eye,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { useInspector } from '../context/InspectorContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'tel' | 'email' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export const FormBuilderPanel: React.FC = () => {
  const { openInspector } = useInspector();
  const { workspaceConfig, activeNiche, regionalProfile } = useBusinessContext();
  const { showToast } = useToast();

  const brandColor = workspaceConfig.brandColor || '#2563EB';
  const companyName = workspaceConfig.agencyName || workspaceConfig.operatorName || 'Rapid Response Pros';

  const [formTitle, setFormTitle] = useState(`Request 24/7 Priority ${activeNiche.toUpperCase()} Dispatch — ${companyName}`);
  const [buttonText, setButtonText] = useState('Dispatch Certified Technician Now');
  const [buttonColor, setButtonColor] = useState(brandColor);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'embed'>('preview');
  const [showFieldsDrawer, setShowFieldsDrawer] = useState(false);

  const [fields, setFields] = useState<FormField[]>([
    { id: '1', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. John Doe' },
    { id: '2', label: 'Phone Number', type: 'tel', required: true, placeholder: workspaceConfig.contactPhone || '(204) 555-0199' },
    { id: '3', label: 'Service Address / Neighborhood', type: 'text', required: true, placeholder: `${regionalProfile.city} Street & Postal Code` },
    { id: '4', label: 'Emergency Urgency', type: 'select', required: true, options: ['Critical Emergency (Within 1 Hour)', 'Same Day Priority', 'Preventive Inspection'] },
    { id: '5', label: 'Describe the Issue', type: 'textarea', required: false, placeholder: `Briefly describe the ${activeNiche} repair needed...` }
  ]);

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      label: 'New Question',
      type: 'text',
      required: false,
      placeholder: 'Enter details...'
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const embedCode = `<!-- HAL Emergency Intake Widget -->
<iframe 
  src="${window.location.origin}/api/public/form/dispatch" 
  width="100%" 
  height="480" 
  frameborder="0" 
  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"
></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    showToast({
      title: 'Embed Code Copied',
      message: 'Paste into Webflow, WordPress, or custom HTML.',
      type: 'success'
    });
    setTimeout(() => setCopiedEmbed(false), 3000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base text-text-primary select-none overflow-hidden">
      {/* HEADER */}
      <div className="px-5 py-3 border-b border-border-dim bg-bg-raised flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary leading-tight font-display">Form Builder Studio</h2>
            <p className="text-[11px] text-text-secondary">Lead capture intake forms with instant SMS alerts and lead attribution</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-0.5 bg-bg-subtle border border-border-dim rounded-lg">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-xs font-mono rounded transition-all cursor-pointer ${
                viewMode === 'preview' ? 'bg-emerald-500/20 text-emerald-500 font-bold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('embed')}
              className={`px-3 py-1 text-xs font-mono rounded transition-all cursor-pointer ${
                viewMode === 'embed' ? 'bg-emerald-500/20 text-emerald-500 font-bold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Code className="w-3.5 h-3.5 inline mr-1" />
              Embed Code
            </button>
          </div>

          {/* Mobile Questions Toggle */}
          <button
            onClick={() => setShowFieldsDrawer(!showFieldsDrawer)}
            className="md:hidden px-2.5 py-1.5 rounded-lg border border-border-dim bg-bg-subtle text-xs font-mono text-emerald-500 flex items-center gap-1 cursor-pointer"
          >
            <span>{showFieldsDrawer ? 'Hide Questions' : `Questions (${fields.length})`}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showFieldsDrawer ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={handleCopyEmbed}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedEmbed ? 'Copied' : 'Get Snippet'}</span>
          </button>
        </div>
      </div>

      {/* BODY SPLIT: FIELD CONTROLS + LIVE PREVIEW */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* FIELD LIST / STRUCTURE (RESPONSIVE) */}
        <div className={`${showFieldsDrawer ? 'block' : 'hidden'} md:block w-full md:w-80 shrink-0 border-r border-border-dim bg-bg-raised/70 p-4 max-h-72 md:max-h-none overflow-y-auto space-y-4 select-none z-10`}>
          <div>
            <label className="block text-[11px] font-mono text-text-secondary uppercase font-bold mb-1">Form Heading</label>
            <input 
              type="text" 
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full bg-bg-base border border-border-dim rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border-dim">
            <span className="text-[11px] font-mono text-text-secondary font-bold uppercase">Form Questions</span>
            <button
              onClick={addField}
              className="px-2 py-1 bg-bg-subtle border border-border-dim hover:border-emerald-500 rounded text-[10.5px] font-mono text-emerald-500 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Field
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div key={f.id} className="p-2.5 rounded-lg border border-border-dim bg-bg-base space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-text-tertiary">#{idx + 1}</span>
                  <button onClick={() => removeField(f.id)} className="text-text-tertiary hover:text-rose-400 cursor-pointer">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <input 
                  type="text" 
                  value={f.label} 
                  onChange={(e) => {
                    const next = [...fields];
                    next[idx].label = e.target.value;
                    setFields(next);
                  }}
                  className="w-full bg-bg-subtle border border-border-dim rounded px-2 py-1 text-xs text-text-primary outline-hidden"
                />
              </div>
            ))}
          </div>
        </div>

        {/* CENTER FORM PREVIEW */}
        <div className="flex-1 bg-bg-subtle/50 p-6 overflow-y-auto flex items-center justify-center">
          {viewMode === 'preview' ? (
            <div className="w-full max-w-md bg-bg-raised border border-border-dim rounded-xl p-6 shadow-2xl space-y-4">
              <div className="border-b border-border-dim pb-3">
                <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase">Emergency Intake</span>
                <h3 className="text-base font-bold text-text-primary mt-0.5">{formTitle}</h3>
              </div>

              <div className="space-y-3">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-semibold text-text-secondary">
                      {field.label} {field.required && <span className="text-rose-400">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select className="w-full bg-bg-base border border-border-dim rounded-lg px-3 py-2 text-xs text-text-primary outline-hidden">
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea 
                        placeholder={field.placeholder} 
                        rows={3} 
                        className="w-full bg-bg-base border border-border-dim rounded-lg p-2.5 text-xs text-text-primary outline-hidden resize-none" 
                      />
                    ) : (
                      <input 
                        type={field.type} 
                        placeholder={field.placeholder} 
                        className="w-full bg-bg-base border border-border-dim rounded-lg px-3 py-2 text-xs text-text-primary outline-hidden" 
                      />
                    )}
                  </div>
                ))}
              </div>

              <button 
                style={{ backgroundColor: buttonColor }}
                className="w-full py-3 rounded-lg text-white font-bold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer mt-2"
              >
                {buttonText}
              </button>
            </div>
          ) : (
            <div className="w-full max-w-2xl bg-bg-base border border-border-dim rounded-xl p-6 font-mono text-xs text-emerald-500 space-y-3">
              <span className="text-text-secondary text-[11px] block">Copy and paste this snippet directly into your landing page or client site:</span>
              <pre className="bg-bg-subtle p-4 rounded-lg border border-border-dim overflow-x-auto text-text-primary">{embedCode}</pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
