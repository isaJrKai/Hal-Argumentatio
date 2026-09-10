import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Printer, 
  CreditCard, 
  Check, 
  X,
  Share2,
  Edit3
} from 'lucide-react';
import { Lead } from '../types';
import { useBusinessContext } from '../context/BusinessContext';
import { ShareToEmailModal } from './ShareToEmailModal';

interface ContractModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContractModal({ lead, isOpen, onClose }: ContractModalProps) {
  const { workspaceConfig } = useBusinessContext();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditingScope, setIsEditingScope] = useState(false);
  const [servicePackage, setServicePackage] = useState<'speed_seo' | 'growth_retainer' | 'custom'>('speed_seo');
  const [setupFee, setSetupFee] = useState(1500);
  const [monthlyRetainer, setMonthlyRetainer] = useState(500);
  const [scopeNotes, setScopeNotes] = useState('Core Web Vitals acceleration, HTTPS/SSL hardening, Mobile 1-Tap calling, and Google Local Map Pack optimization.');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lead) return null;

  const paymentLink = workspaceConfig.stripePaymentUrl || 'https://buy.stripe.com/demo_retainer';

  const handleCopyPayment = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-bg-raised border border-border-dim w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none">
        
        {/* HEADER BAR */}
        <div className="bg-bg-raised border-b border-border-dim px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-positive" />
            <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
              Statement of Work & Retainer Agreement
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-xs font-mono font-bold rounded-sm flex items-center gap-1.5 hover:bg-cyan-500/20 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>SHARE TO EMAIL</span>
            </button>
            <button
              onClick={handleCopyPayment}
              className="px-2.5 py-1 bg-brand/10 border border-brand/40 text-brand text-xs font-mono font-bold rounded-sm flex items-center gap-1.5 hover:bg-brand/20 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-positive" /> : <CreditCard className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'LINK COPIED' : 'PAYMENT LINK'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 bg-bg-subtle border border-border-dim hover:border-brand/40 text-text-primary text-xs font-mono font-bold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-text-secondary" />
              <span>PRINT / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bg-subtle text-text-dim hover:text-text-primary rounded-sm transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PACKAGE SELECTOR (HIDDEN IN PRINT) */}
        <div className="bg-bg-subtle border-b border-border-dim p-3 print:hidden grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          <button
            onClick={() => {
              setServicePackage('speed_seo');
              setSetupFee(1500);
              setMonthlyRetainer(500);
              setScopeNotes('Core Web Vitals acceleration, Mobile 1-Tap calling, and Local Search Optimization.');
            }}
            className={`p-2 rounded-sm border text-left transition-all cursor-pointer ${
              servicePackage === 'speed_seo'
                ? 'bg-brand/15 border-brand text-text-primary'
                : 'bg-bg-base border-border-dim text-text-secondary hover:text-text-primary'
            }`}
          >
            <div className="font-bold">Speed & Search Sprint</div>
            <div className="text-[10px] text-brand font-bold">$1,500 setup + $500/mo</div>
          </button>

          <button
            onClick={() => {
              setServicePackage('growth_retainer');
              setSetupFee(2500);
              setMonthlyRetainer(1200);
              setScopeNotes('Full mobile redesign, speed acceleration, 2-step quote funnels, review automation & monthly local rankings.');
            }}
            className={`p-2 rounded-sm border text-left transition-all cursor-pointer ${
              servicePackage === 'growth_retainer'
                ? 'bg-brand/15 border-brand text-text-primary'
                : 'bg-bg-base border-border-dim text-text-secondary hover:text-text-primary'
            }`}
          >
            <div className="font-bold">Full Growth Retainer</div>
            <div className="text-[10px] text-positive font-bold">$2,500 setup + $1,200/mo</div>
          </button>

          <button
            onClick={() => {
              setServicePackage('custom');
            }}
            className={`p-2 rounded-sm border text-left transition-all cursor-pointer ${
              servicePackage === 'custom'
                ? 'bg-brand/15 border-brand text-text-primary'
                : 'bg-bg-base border-border-dim text-text-secondary hover:text-text-primary'
            }`}
          >
            <div className="font-bold">Custom Scope</div>
            <div className="text-[10px] text-accent font-bold">Editable pricing & terms</div>
          </button>
        </div>

        {/* PRINTABLE AGREEMENT BODY */}
        <div className="p-6 sm:p-8 space-y-6 font-mono text-text-primary text-xs bg-bg-base print:bg-white print:text-black">
          
          {/* HEADER BRANDING */}
          <div className="flex justify-between items-start border-b border-border-dim pb-4 print:border-black">
            <div>
              <h2 className="text-base font-bold tracking-tight uppercase">{workspaceConfig.agencyName}</h2>
              <p className="text-[11px] text-text-secondary print:text-gray-600">{workspaceConfig.tagline}</p>
              <p className="text-[10px] text-text-dim print:text-gray-500">{workspaceConfig.contactEmail} • {workspaceConfig.contactPhone}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-text-dim print:text-gray-500 uppercase block">Document</span>
              <span className="text-xs font-bold text-brand print:text-black">SOW-{lead.id.slice(0, 8).toUpperCase()}</span>
              <span className="text-[10px] text-text-secondary print:text-gray-600 block">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* PARTIES */}
          <div className="grid grid-cols-2 gap-4 bg-bg-raised p-3 rounded-sm border border-border-dim print:bg-gray-100 print:border-black">
            <div>
              <span className="text-[10px] text-text-secondary print:text-gray-500 uppercase font-bold block">Service Provider</span>
              <p className="font-bold">{workspaceConfig.agencyName}</p>
              <p className="text-[11px] text-text-secondary print:text-gray-600">Lead Consultant: {workspaceConfig.operatorName}</p>
            </div>
            <div>
              <span className="text-[10px] text-text-secondary print:text-gray-500 uppercase font-bold block">Client / Business</span>
              <p className="font-bold">{lead.businessName}</p>
              <p className="text-[11px] text-text-secondary print:text-gray-600">Location: {lead.city} • {lead.serviceType}</p>
            </div>
          </div>

          {/* SCOPE OF WORK */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary print:text-gray-700 block">
                1. Scope of Deliverables
              </span>
              <button
                type="button"
                onClick={() => setIsEditingScope(!isEditingScope)}
                className="print:hidden text-[10px] text-brand hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingScope ? 'Save Scope' : 'Edit Scope Manually'}</span>
              </button>
            </div>
            {isEditingScope ? (
              <textarea
                value={scopeNotes}
                onChange={(e) => setScopeNotes(e.target.value)}
                rows={4}
                className="w-full p-3 bg-bg-subtle border border-brand/40 rounded-sm text-[11px] leading-relaxed text-text-primary outline-hidden resize-y font-mono"
                placeholder="Enter customized scope of work..."
              />
            ) : (
              <div 
                onClick={() => setIsEditingScope(true)}
                className="p-3 bg-bg-subtle border border-border-dim rounded-sm text-[11px] leading-relaxed print:bg-white print:border-gray-400 cursor-pointer hover:border-brand/40 transition-colors"
                title="Click to edit deliverables"
              >
                {scopeNotes}
              </div>
            )}
          </div>

          {/* PRICING & FINANCIAL SCHEDULE */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary print:text-gray-700 block">
              2. Commercial Terms & Retainer
            </span>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 bg-bg-subtle border border-border-dim rounded-sm print:bg-gray-50 print:border-gray-400">
                <span className="text-[10px] text-text-secondary print:text-gray-500 uppercase block">Implementation & Setup Fee</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-base font-bold text-brand print:text-black">$</span>
                  <input
                    type="number"
                    value={setupFee}
                    onChange={(e) => setSetupFee(Number(e.target.value))}
                    className="text-base font-bold text-brand bg-transparent outline-hidden w-24 print:text-black"
                  />
                  <span className="text-xs text-text-dim print:hidden">USD</span>
                </div>
                <span className="text-[10px] text-text-dim print:text-gray-500 block mt-1">Due upon commencement of technical sprint.</span>
              </div>
              <div className="p-3 bg-bg-subtle border border-border-dim rounded-sm print:bg-gray-50 print:border-gray-400">
                <span className="text-[10px] text-text-secondary print:text-gray-500 uppercase block">Ongoing Optimization Retainer</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-base font-bold text-positive print:text-black">$</span>
                  <input
                    type="number"
                    value={monthlyRetainer}
                    onChange={(e) => setMonthlyRetainer(Number(e.target.value))}
                    className="text-base font-bold text-positive bg-transparent outline-hidden w-24 print:text-black"
                  />
                  <span className="text-xs text-text-dim print:hidden">/ mo</span>
                </div>
                <span className="text-[10px] text-text-dim print:text-gray-500 block mt-1">Monthly maintenance, ranking monitoring, and speed caching.</span>
              </div>
            </div>
          </div>

          {/* SIGNATURE BLOCKS */}
          <div className="pt-6 border-t border-border-dim grid grid-cols-2 gap-8 print:border-black">
            <div className="space-y-4">
              <div className="h-10 border-b border-border-dim print:border-black flex items-end pb-1">
                <span className="text-[10px] font-mono text-text-dim print:text-gray-500">{workspaceConfig.operatorName}</span>
              </div>
              <span className="text-[10px] text-text-secondary print:text-gray-600 block">Authorized Provider Signature & Date</span>
            </div>
            <div className="space-y-4">
              <div className="h-10 border-b border-border-dim print:border-black"></div>
              <span className="text-[10px] text-text-secondary print:text-gray-600 block">Client Acceptance Signature ({lead.businessName}) & Date</span>
            </div>
          </div>

        </div>

        <ShareToEmailModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={`Statement of Work - ${lead.businessName}`}
          itemType="contract"
          shareUrl={`${window.location.origin}/contracts/${lead.id}`}
          businessName={lead.businessName}
        />

      </div>
    </div>
  );
}
