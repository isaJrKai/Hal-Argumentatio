import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Globe, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Star, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Phone, 
  Mail, 
  ArrowRight, 
  Sparkles,
  Calculator,
  Send,
  Check,
  Award,
  ChevronRight,
  ExternalLink,
  Lock
} from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';

interface PublicAuditPageProps {
  auditId: string;
  onNavigateToLogin?: () => void;
}

interface AuditData {
  id: string;
  businessName: string;
  city: string;
  serviceType: string;
  websiteUrl?: string;
  seoScore: number;
  performanceScore: number;
  sslStatus: 'secured' | 'missing';
  googleRating: number;
  reviewCount: number;
  sentimentScore: number;
  notes: string;
  outreachStrategy: string;
  urgencyScore: number;
  predictedLtvUsd: number;
  createdAt: string;
}

export default function PublicAuditPage({ auditId, onNavigateToLogin }: PublicAuditPageProps) {
  const { workspaceConfig, activeIndustry } = useBusinessContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AuditData | null>(null);

  // Interactive Opportunity / Revenue Calculator
  const [monthlyVisitors, setMonthlyVisitors] = useState<number>(1200);
  const [avgTicketValue, setAvgTicketValue] = useState<number>(2500);

  // Direct Booking Modal / Form
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingTime, setBookingTime] = useState('Tomorrow Morning (9:00 AM - 12:00 PM)');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    async function loadAudit() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/public/audit/${auditId}`);
        if (!res.ok) {
          throw new Error('Audit report not found or the link has expired.');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load audit analysis');
      } finally {
        setLoading(false);
      }
    }

    if (auditId) {
      loadAudit();
    }
  }, [auditId]);

  // Derived calculations:
  // Google benchmarks show mobile bounce increases by 32% as page load goes from 1s to 3s, and 90% if >5s.
  const perfScore = data?.performanceScore ?? 50;
  const bouncePenaltyPct = perfScore < 50 ? 0.38 : perfScore < 75 ? 0.22 : 0.08;
  const currentConversionRate = 0.025; // 2.5% standard
  const estimatedLostLeadsPerMonth = Math.round(monthlyVisitors * bouncePenaltyPct * currentConversionRate);
  const estimatedAnnualLostRevenue = Math.round(estimatedLostLeadsPerMonth * avgTicketValue * 12);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    setBookingSubmitting(true);
    try {
      const res = await fetch(`/api/public/audit/${data.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: bookingName,
          contactEmail: bookingEmail,
          contactPhone: bookingPhone,
          preferredTime: bookingTime,
          message: bookingMessage
        })
      });

      if (!res.ok) throw new Error('Failed to submit booking request');

      setBookingSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Error scheduling review. Please contact directly.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const bookingUrl = workspaceConfig.bookingUrl || 'https://cal.com/hal-strategy';
  const brandColor = workspaceConfig.brandColor || '#3b82f6';

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-mono text-text-secondary uppercase tracking-widest">Loading Technical Performance Audit...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-bg-raised border border-border-dim rounded-xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">Audit Link Expired or Unavailable</h2>
          <p className="text-xs text-text-secondary leading-relaxed">{error || 'This report may have been archived.'}</p>
          {onNavigateToLogin && (
            <button
              onClick={onNavigateToLogin}
              className="px-4 py-2 bg-bg-subtle hover:bg-bg-raised text-xs font-mono text-text-secondary hover:text-text-primary border border-border-dim rounded-md transition-colors"
            >
              Go to Workspace Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans selection:bg-indigo-500/30 selection:text-white pb-20">
      
      {/* TOP AGENCY BRAND HEADER */}
      <header className="border-b border-border-dim bg-bg-raised/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-3.5 h-3.5 rounded-sm shrink-0" 
            style={{ backgroundColor: brandColor }}
          />
          <div>
            <span className="text-xs font-mono font-bold tracking-tight text-text-primary uppercase block">
              {workspaceConfig.agencyName}
            </span>
            <span className="text-[10px] font-mono text-text-secondary hidden sm:block">
              {workspaceConfig.tagline}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {workspaceConfig.contactPhone && (
            <a 
              href={`tel:${workspaceConfig.contactPhone.replace(/[^0-9]/g, '')}`}
              className="text-xs font-mono text-text-secondary hover:text-text-primary flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-subtle border border-border-dim transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">{workspaceConfig.contactPhone}</span>
              <span className="md:hidden">Call</span>
            </a>
          )}
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 rounded-md text-xs font-mono font-bold text-white shadow-lg transition-transform hover:scale-[1.02] flex items-center gap-1.5"
            style={{ backgroundColor: brandColor }}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book 15-Min Call</span>
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 space-y-10">
        
        {/* REPORT BADGE & TITLE */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[11px] font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Digital & Speed Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary uppercase font-mono">
            {data.businessName}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-xl mx-auto font-mono">
            Prepared exclusively for <strong className="text-text-primary">{data.businessName}</strong> in <strong className="text-text-primary">{data.city}</strong>.
            {data.websiteUrl && ` Evaluated on site URL: ${data.websiteUrl}`}
          </p>
        </div>

        {/* 4 CORE SCORECARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Mobile Speed Score */}
          <div className="bg-bg-raised border border-border-dim rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">Mobile Speed</span>
              <Zap className={`w-4 h-4 ${data.performanceScore >= 70 ? 'text-emerald-400' : data.performanceScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono ${data.performanceScore >= 70 ? 'text-emerald-400' : data.performanceScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {data.performanceScore}
              </span>
              <span className="text-xs text-text-tertiary font-mono">/ 100</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">
              {data.performanceScore < 60 ? 'High mobile bounce risk. Heavy friction on smartphones.' : 'Acceptable mobile load speed benchmark.'}
            </p>
          </div>

          {/* Technical SEO Score */}
          <div className="bg-bg-raised border border-border-dim rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">Search Visibility</span>
              <Globe className={`w-4 h-4 ${data.seoScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono ${data.seoScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.seoScore}
              </span>
              <span className="text-xs text-text-tertiary font-mono">/ 100</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">
              Local indexing and search keyword ranking strength in {data.city}.
            </p>
          </div>

          {/* SSL Trust */}
          <div className="bg-bg-raised border border-border-dim rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">Security Lock</span>
              {data.sslStatus === 'secured' ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-bold font-mono uppercase ${data.sslStatus === 'secured' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.sslStatus}
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">
              {data.sslStatus === 'secured' ? 'Verified HTTPS SSL encryption lock active.' : 'Browser security warning flag active.'}
            </p>
          </div>

          {/* Reputation & Google Reviews */}
          <div className="bg-bg-raised border border-border-dim rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-bold">Google Rating</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-text-primary">
                {data.googleRating}
              </span>
              <span className="text-xs text-text-tertiary font-mono">({data.reviewCount} reviews)</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-snug">
              Verified public customer feedback & reputation index.
            </p>
          </div>

        </div>

        {/* INTERACTIVE LOST REVENUE OPPORTUNITY CALCULATOR */}
        <div className="bg-bg-raised border border-indigo-500/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-dim pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-mono font-bold text-text-primary uppercase">Interactive Revenue Leakage Calculator</h2>
                <p className="text-xs text-text-secondary font-mono">Adjust values below to simulate estimated lost clients due to website latency</p>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono">
              <span className="text-[10px] text-text-secondary uppercase block">Estimated Leaking Revenue</span>
              <span className="text-2xl font-black text-rose-400 tracking-tight">
                -${estimatedAnnualLostRevenue.toLocaleString()} / year
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Input 1: Monthly Website Traffic */}
            <div className="space-y-3 bg-bg-base border border-border-dim p-4 rounded-xl">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-text-primary font-semibold">Estimated Monthly Site Visitors:</span>
                <span className="text-indigo-400 font-bold">{monthlyVisitors.toLocaleString()} visits</span>
              </div>
              <input 
                type="range" 
                min={200} 
                max={10000} 
                step={100}
                value={monthlyVisitors}
                onChange={(e) => setMonthlyVisitors(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
                <span>200</span>
                <span>5,000</span>
                <span>10,000+</span>
              </div>
            </div>

            {/* Input 2: Average Project / Contract Value */}
            <div className="space-y-3 bg-bg-base border border-border-dim p-4 rounded-xl">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-text-primary font-semibold">Average Job / Project Ticket Size:</span>
                <span className="text-emerald-400 font-bold">${avgTicketValue.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min={500} 
                max={25000} 
                step={250}
                value={avgTicketValue}
                onChange={(e) => setAvgTicketValue(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
                <span>$500</span>
                <span>$10,000</span>
                <span>$25,000+</span>
              </div>
            </div>

          </div>

          {/* Outcome highlight banner */}
          <div className="bg-bg-base border border-border-dim p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-text-primary">
                At your current performance score ({data.performanceScore}/100), approximately <strong className="text-rose-400">{Math.round(bouncePenaltyPct * 100)}% of mobile visitors</strong> bounce before seeing your contact phone or quote form.
              </p>
              <p className="text-[11px] text-text-secondary">
                Recovering just <strong className="text-emerald-400">{estimatedLostLeadsPerMonth} missed contracts/month</strong> yields <strong className="text-emerald-400">+${(estimatedLostLeadsPerMonth * avgTicketValue).toLocaleString()}</strong> in gross revenue.
              </p>
            </div>

            <button
              onClick={() => setShowBookingModal(true)}
              className="px-5 py-2.5 rounded-lg font-mono font-bold text-white text-xs whitespace-nowrap shadow-lg hover:brightness-110 transition-all cursor-pointer shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              Fix Speed & Capture Lost Leads
            </button>
          </div>
        </div>

        {/* STRATEGIC VALUE & RECOMMENDATION */}
        <div className="bg-bg-raised border border-border-dim rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-border-dim pb-4">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-mono font-bold text-text-primary uppercase tracking-tight">
              Recommended Optimization Strategy for {data.city}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 bg-bg-base border border-border-dim rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>1. Core Web Vitals & Mobile Speed Fix</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Compress hero imagery, defer blocking scripts, and load page styles within 1.2 seconds to satisfy Google's mobile ranking algorithm.
              </p>
            </div>

            <div className="p-4 bg-bg-base border border-border-dim rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>2. Instant Click-to-Call & Quote Friction</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Add persistent 1-tap emergency calling and high-converting 2-step estimate forms for local homeowners searching on mobile.
              </p>
            </div>

            <div className="p-4 bg-bg-base border border-border-dim rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>3. Local Map Pack & Reputation Sync</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Optimize Google My Business category tags, local schema markup, and showcase recent 5-star customer reviews directly in search previews.
              </p>
            </div>

            <div className="p-4 bg-bg-base border border-border-dim rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>4. Automated Lead Notification Router</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Send incoming quote inquiries directly to your team's mobile via instant SMS dispatch to close jobs before competitors respond.
              </p>
            </div>
          </div>
        </div>

        {/* BOOKING / ACTION CTA BOX */}
        <div className="bg-bg-raised border-2 border-indigo-500/40 rounded-2xl p-8 text-center space-y-5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold block">
            Next Action Step
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold font-mono text-text-primary uppercase">
            Schedule a 15-Minute Technical Review Call
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-lg mx-auto font-mono leading-relaxed">
            We will walk through your live site architecture, show the exact scripts causing mobile lag, and outline a simple fix plan.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-mono font-bold text-white text-xs shadow-xl transition-transform hover:scale-105 flex items-center justify-center gap-2"
              style={{ backgroundColor: brandColor }}
            >
              <Calendar className="w-4 h-4" />
              <span>Choose Time on Calendar</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-mono font-bold text-text-primary bg-bg-subtle hover:bg-bg-base border border-border-dim text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Request Callback / Written Fix Plan</span>
            </button>
          </div>

          <p className="text-[10px] font-mono text-text-tertiary">
            No long-term contracts. Transparent performance-driven execution.
          </p>
        </div>

        {/* FOOTER */}
        <footer className="pt-8 border-t border-border-dim text-center font-mono text-xs text-text-tertiary space-y-2">
          <p>© {new Date().getFullYear()} {workspaceConfig.agencyName}. All Rights Reserved.</p>
          <p className="text-[10px]">Confidential Business Performance Audit prepared by {workspaceConfig.operatorName}.</p>
          {onNavigateToLogin && (
            <div className="pt-3">
              <button
                onClick={onNavigateToLogin}
                className="text-[10px] text-text-tertiary hover:text-text-secondary transition-colors underline"
              >
                Operator Workspace Login
              </button>
            </div>
          )}
        </footer>

      </main>

      {/* QUICK PROSPECT REQUEST / BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-bg-raised border border-border-dim rounded-2xl p-6 space-y-5 shadow-2xl relative text-text-primary">
            
            <div className="flex justify-between items-center border-b border-border-dim pb-3">
              <div>
                <h3 className="text-sm font-mono font-bold text-text-primary uppercase">Request Strategy Session</h3>
                <p className="text-[10px] font-mono text-text-secondary">For {data.businessName}</p>
              </div>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-text-secondary hover:text-text-primary font-mono text-xs"
              >
                [CLOSE]
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3 font-mono">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-sm font-bold text-text-primary">Request Received!</h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Our technical advisor will reach out to confirm your session and send the complete speed audit brief.
                </p>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 bg-bg-subtle hover:bg-bg-base text-xs text-text-primary border border-border-dim rounded-lg transition-colors mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase font-bold">Your Name / Title</label>
                  <input
                    type="text"
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="e.g. John Doe, Owner"
                    className="w-full bg-bg-base border border-border-dim rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase font-bold">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      placeholder="(204) 555-0199"
                      className="w-full bg-bg-base border border-border-dim rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase font-bold">Work Email</label>
                    <input
                      type="email"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      placeholder="owner@company.com"
                      className="w-full bg-bg-base border border-border-dim rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase font-bold">Preferred Time Window</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-bg-base border border-border-dim rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="Tomorrow Morning (9:00 AM - 12:00 PM)">Tomorrow Morning (9:00 AM - 12:00 PM)</option>
                    <option value="Tomorrow Afternoon (1:00 PM - 5:00 PM)">Tomorrow Afternoon (1:00 PM - 5:00 PM)</option>
                    <option value="This Week (Flexible)">This Week (Flexible)</option>
                    <option value="Urgent / Today if possible">Urgent / Today if possible</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary uppercase font-bold">Specific Website Questions (Optional)</label>
                  <textarea
                    rows={2}
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    placeholder="e.g. Would like to fix mobile load time and get more quotes from homeowners in Winnipeg."
                    className="w-full bg-bg-base border border-border-dim rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="w-full py-3 rounded-lg font-mono font-bold text-white text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: brandColor }}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{bookingSubmitting ? 'Submitting Request...' : 'Confirm Review Request'}</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
