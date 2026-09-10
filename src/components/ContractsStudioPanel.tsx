import React, { useState } from 'react';
import { 
  FileCheck2, 
  Printer, 
  CreditCard, 
  Check, 
  Send, 
  Copy, 
  Download, 
  DollarSign, 
  ShieldCheck, 
  Sparkles,
  Building,
  User,
  Calendar,
  ChevronDown,
  Share2,
  Edit3
} from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';
import { useToast } from '../context/ToastContext';
import { ShareToEmailModal } from './ShareToEmailModal';

export const ContractsStudioPanel: React.FC<{ token: string | null }> = () => {
  const { workspaceConfig, regionalProfile, activeNiche, formatCurrency } = useBusinessContext();
  const { showToast } = useToast();

  const [clientName, setClientName] = useState('Apex Plumbing Solutions');
  const [ownerName, setOwnerName] = useState('Mark Henderson');
  const [servicePackage, setServicePackage] = useState<'growth_retainer' | 'speed_seo' | 'custom'>('growth_retainer');
  const [setupFee, setSetupFee] = useState(1500);
  const [monthlyRetainer, setMonthlyRetainer] = useState(750);
  const [guaranteedLeads, setGuaranteedLeads] = useState(15);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLeversDrawer, setShowLeversDrawer] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isManualScope, setIsManualScope] = useState(false);
  const [manualScopeText, setManualScopeText] = useState(
    `• Deployment of high-speed, 1-tap emergency dispatch landing pages optimized for mobile users.\n• Exclusive local Map Pack & Google Local Ads acquisition targeting ${regionalProfile.city} homeowners.\n• Real-time CRM lead attribution, SMS dispatch routing, and monthly campaign debrief reports.\n• Guaranteed pacing toward 15 qualified ${activeNiche} inquiries per calendar month.`
  );

  const agencyDisplayName = workspaceConfig.agencyName || workspaceConfig.operatorName || 'HAL Business Operating Intelligence';
  const paymentLink = workspaceConfig.stripePaymentUrl || 'https://buy.stripe.com/demo_retainer';

  const handleCopyPayment = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopiedLink(true);
    showToast({
      title: 'Payment Link Copied',
      message: 'Stripe onboarding checkout link ready to send.',
      type: 'success'
    });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base text-text-primary select-none overflow-hidden">
      
      {/* HEADER */}
      <div className="px-5 py-3 border-b border-border-dim bg-bg-raised flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-dim border border-accent/30 flex items-center justify-center text-accent">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary leading-tight font-display">Contract & Retainer Studio</h2>
            <p className="text-[11px] text-text-secondary">Generate, customize, print, and dispatch legally binding client agreements</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Levers Toggle */}
          <button
            onClick={() => setShowLeversDrawer(!showLeversDrawer)}
            className="md:hidden px-2.5 py-1.5 rounded-lg border border-border-dim bg-bg-subtle text-xs font-mono text-accent flex items-center gap-1 cursor-pointer"
          >
            <span>{showLeversDrawer ? 'Hide Levers' : 'Contract Levers'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showLeversDrawer ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 rounded-lg border border-border-dim bg-bg-subtle hover:bg-bg-raised text-xs font-mono text-cyan-400 transition-all cursor-pointer flex items-center gap-1.5"
            title="Share Agreement to Client via Email"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share to Email</span>
          </button>

          <button
            onClick={handleCopyPayment}
            className="px-3 py-1.5 rounded-lg border border-border-dim bg-bg-subtle hover:bg-bg-raised text-xs font-mono text-text-primary transition-all cursor-pointer flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-positive" /> : <CreditCard className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Copy Stripe Link'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-contrast font-semibold text-xs font-sans transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* BODY SPLIT: LEVERS + DOCUMENT CANVAS */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* LEFT CONFIG LEVERS (RESPONSIVE) */}
        <div className={`${showLeversDrawer ? 'block' : 'hidden'} md:block w-full md:w-80 shrink-0 border-r border-border-dim bg-bg-raised/70 p-4 max-h-72 md:max-h-none overflow-y-auto space-y-4 print:hidden z-10`}>
          <span className="text-[11px] font-mono text-text-tertiary uppercase font-bold block">Contract Levers</span>
          
          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">Contractor / Client Business</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-bg-base border border-border-dim rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-accent outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">Principal Contact Name</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full bg-bg-base border border-border-dim rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-accent outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">Package Scope</label>
            <select
              value={servicePackage}
              onChange={(e: any) => setServicePackage(e.target.value)}
              className="w-full bg-bg-base border border-border-dim rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-accent outline-hidden cursor-pointer"
            >
              <option value="growth_retainer">Full Territory Growth Retainer (Ads + Landers)</option>
              <option value="speed_seo">Core Web Vitals & SEO Hardening</option>
              <option value="custom">Custom Milestone Agreement</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-text-secondary font-semibold mb-1">Setup Fee ($)</label>
              <input
                type="number"
                value={setupFee}
                onChange={(e) => setSetupFee(Number(e.target.value))}
                className="w-full bg-bg-base border border-border-dim rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-accent outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary font-semibold mb-1">Monthly ($)</label>
              <input
                type="number"
                value={monthlyRetainer}
                onChange={(e) => setMonthlyRetainer(Number(e.target.value))}
                className="w-full bg-bg-base border border-border-dim rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-accent outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary font-semibold mb-1">Monthly Qualified Leads Target</label>
            <input
              type="number"
              value={guaranteedLeads}
              onChange={(e) => setGuaranteedLeads(Number(e.target.value))}
              className="w-full bg-bg-base border border-border-dim rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-accent outline-hidden"
            />
          </div>

          {/* SCOPE EDITING MODE */}
          <div className="pt-2 border-t border-border-dim space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-text-secondary font-semibold">Scope & Deliverables</label>
              <button
                type="button"
                onClick={() => setIsManualScope(!isManualScope)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  isManualScope 
                    ? 'bg-accent/20 border-accent text-accent font-bold' 
                    : 'bg-bg-subtle border-border-dim text-text-tertiary hover:text-text-primary'
                }`}
              >
                {isManualScope ? 'Manual Edit Active' : 'Enable Manual Edit'}
              </button>
            </div>

            {isManualScope ? (
              <textarea
                value={manualScopeText}
                onChange={(e) => setManualScopeText(e.target.value)}
                rows={5}
                className="w-full bg-bg-base border border-border-dim rounded-lg p-2 text-xs text-text-primary focus:border-accent outline-hidden leading-relaxed resize-none"
                placeholder="Enter custom deliverables, SLA terms, milestones, or notes..."
              />
            ) : (
              <p className="text-[11px] text-text-secondary italic">
                Using auto-generated high-conversion {servicePackage === 'growth_retainer' ? 'Full Growth' : servicePackage === 'speed_seo' ? 'Core Web Vitals' : 'Custom'} deliverables.
              </p>
            )}
          </div>
        </div>

        {/* CENTER DOCUMENT CANVAS (THE OFFICE WORKBENCH) */}
        <div className="flex-1 bg-bg-subtle/50 p-6 overflow-y-auto flex items-center justify-center print:p-0 print:bg-white">
          <div className="w-full max-w-3xl bg-bg-raised text-text-primary rounded-xl shadow-xl p-8 sm:p-12 border border-border-dim font-sans space-y-6 print:border-none print:shadow-none print:bg-white print:text-black">
            
            {/* DOC HEADER */}
            <div className="flex justify-between items-start border-b border-border-dim pb-6 print:border-black">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-accent print:text-black">
                  CONFIDENTIAL CLIENT AGREEMENT
                </span>
                <h1 className="text-2xl font-black tracking-tight text-text-primary mt-1 font-display print:text-black">
                  STATEMENT OF WORK & RETAINER
                </h1>
                <p className="text-xs text-text-secondary mt-1 print:text-gray-600">
                  Prepared by {agencyDisplayName} for {clientName}
                </p>
              </div>

              <div className="text-right font-mono text-xs text-text-secondary print:text-gray-600">
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>Territory: {regionalProfile.city}, {regionalProfile.countryCode}</p>
              </div>
            </div>

            {/* PARTIES */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-bg-subtle border border-border-dim rounded-lg text-xs print:bg-gray-50 print:border-gray-300">
              <div>
                <span className="font-bold text-text-tertiary block uppercase text-[10px] print:text-gray-500">SERVICE PROVIDER</span>
                <p className="font-bold text-text-primary text-sm mt-0.5 print:text-black">{agencyDisplayName}</p>
                <p className="text-text-secondary print:text-gray-600">{regionalProfile.city}, {regionalProfile.countryCode}</p>
              </div>
              <div>
                <span className="font-bold text-text-tertiary block uppercase text-[10px] print:text-gray-500">CLIENT CONTRACTOR</span>
                <p className="font-bold text-text-primary text-sm mt-0.5 print:text-black">{clientName}</p>
                <p className="text-text-secondary print:text-gray-600">Attn: {ownerName}</p>
              </div>
            </div>

            {/* SCOPE */}
            <div className="space-y-2 text-xs text-text-secondary leading-relaxed print:text-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide print:text-black">1. Scope of Work & Deliverables</h3>
                <button
                  type="button"
                  onClick={() => setIsManualScope(!isManualScope)}
                  className="print:hidden text-[10px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isManualScope ? 'Save Manual Scope' : 'Edit Scope Manually'}</span>
                </button>
              </div>

              {isManualScope ? (
                <textarea
                  value={manualScopeText}
                  onChange={(e) => setManualScopeText(e.target.value)}
                  rows={5}
                  className="w-full bg-bg-subtle border border-accent/40 rounded-lg p-3 text-xs text-text-primary font-sans leading-relaxed outline-hidden focus:border-accent print:border-none print:p-0 print:bg-transparent resize-y"
                  placeholder="Enter manual scope and deliverables..."
                />
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  <li>Deployment of high-speed, 1-tap emergency dispatch landing pages optimized for mobile users.</li>
                  <li>Exclusive local Map Pack & Google Local Ads acquisition targeting {regionalProfile.city} homeowners.</li>
                  <li>Real-time CRM lead attribution, SMS dispatch routing, and monthly campaign debrief reports.</li>
                  <li>Guaranteed pacing toward {guaranteedLeads} qualified {activeNiche} inquiries per calendar month.</li>
                </ul>
              )}
            </div>

            {/* FINANCIAL TERMS */}
            <div className="space-y-2 text-xs text-text-secondary">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide print:text-black">2. Investment & Payment Terms</h3>
              <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                <div className="p-3 bg-bg-subtle border border-border-dim rounded-lg print:bg-gray-50 print:border-gray-300">
                  <span className="text-[10px] text-text-tertiary uppercase block print:text-gray-500">INITIAL INFRASTRUCTURE SETUP</span>
                  <span className="text-base font-bold text-text-primary print:text-black">{formatCurrency(setupFee)}</span>
                </div>
                <div className="p-3 bg-bg-subtle border border-border-dim rounded-lg print:bg-gray-50 print:border-gray-300">
                  <span className="text-[10px] text-text-tertiary uppercase block print:text-gray-500">MONTHLY OPERATING RETAINER</span>
                  <span className="text-base font-bold text-text-primary print:text-black">{formatCurrency(monthlyRetainer)} / mo</span>
                </div>
              </div>
            </div>

            {/* SIGNATURES */}
            <div className="pt-8 border-t border-border-dim grid grid-cols-2 gap-8 text-xs print:border-black">
              <div className="space-y-4">
                <p className="font-bold text-text-primary print:text-black">For {workspaceConfig.businessName || 'Kaiso Operating Group'}:</p>
                <div className="h-12 border-b border-border-default print:border-black" />
                <p className="text-text-tertiary font-mono text-[10px] print:text-gray-500">Authorized Signature / Date</p>
              </div>
              <div className="space-y-4">
                <p className="font-bold text-text-primary print:text-black">For {clientName}:</p>
                <div className="h-12 border-b border-border-default print:border-black" />
                <p className="text-text-tertiary font-mono text-[10px] print:text-gray-500">Authorized Signature / Date</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      <ShareToEmailModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Statement of Work & Retainer Agreement"
        itemType="contract"
        shareUrl={`${window.location.origin}/contracts/view`}
        businessName={clientName}
      />

    </div>
  );
};
