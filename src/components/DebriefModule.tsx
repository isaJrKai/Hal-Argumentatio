import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, XCircle, Brain, RefreshCw, Send, DollarSign, Lightbulb } from 'lucide-react';
import { Lead } from '../types';

export default function DebriefModule() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [outcome, setOutcome] = useState<'won' | 'lost'>('won');
  const [closedValue, setClosedValue] = useState(0);
  const [primaryReason, setPrimaryReason] = useState('');
  const [keyLesson, setKeyLesson] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeads(data);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) return;

    setIsSubmitting(true);
    try {
      const selectedLead = leads.find(l => l.id === selectedLeadId);
      if (!selectedLead) throw new Error("Lead not found");

      const payload = {
        leadId: selectedLead.id,
        businessName: selectedLead.businessName,
        city: selectedLead.city,
        niche: selectedLead.niche,
        outcome,
        closedValueUsd: outcome === 'won' ? closedValue : 0,
        primaryReason,
        keyLesson
      };

      const res = await fetch('/api/learning/winloss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to log outcome');
      
      setNotification('Outcome successfully logged to the Neural Matrix.');
      setTimeout(() => setNotification(''), 4000);

      // Reset form
      setSelectedLeadId('');
      setPrimaryReason('');
      setKeyLesson('');
      setClosedValue(0);

    } catch (err) {
      console.error(err);
      alert("Error logging outcome");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">
      <header className="px-6 py-5 border-b border-border-dim bg-bg-raised shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Brain className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Outcome Debrief Logger</h1>
            <p className="text-sm text-text-secondary mt-1">Manually feed wins, losses, and learning insights directly into the Matrix.</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="max-w-2xl w-full">
          {notification && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center gap-3 font-mono text-sm">
              <CheckCircle className="w-5 h-5" /> {notification}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-bg-raised border border-border-dim rounded-xl p-6 shadow-xl space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider mb-2">Target Lead</label>
                <select 
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full bg-bg-base border border-border-dim rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  required
                >
                  <option value="">Select a target lead...</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.businessName} - {lead.city} ({lead.niche})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider mb-2">Mission Outcome</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setOutcome('won')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${outcome === 'won' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-bg-base border-border-dim text-text-secondary hover:border-text-tertiary'}`}
                  >
                    <CheckCircle className="w-8 h-8 mb-2" />
                    <span className="font-bold">Deal Won</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOutcome('lost')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${outcome === 'lost' ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-bg-base border-border-dim text-text-secondary hover:border-text-tertiary'}`}
                  >
                    <XCircle className="w-8 h-8 mb-2" />
                    <span className="font-bold">Deal Lost</span>
                  </button>
                </div>
              </div>

              {outcome === 'won' && (
                <div>
                  <label className="block text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider mb-2">Closed Value (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input 
                      type="number" 
                      min="0"
                      value={closedValue}
                      onChange={(e) => setClosedValue(Number(e.target.value))}
                      className="w-full bg-bg-base border border-border-dim rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-all font-mono"
                      placeholder="e.g. 1500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider mb-2">Primary Reason</label>
                <input 
                  type="text" 
                  value={primaryReason}
                  onChange={(e) => setPrimaryReason(e.target.value)}
                  className="w-full bg-bg-base border border-border-dim rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-all"
                  placeholder={outcome === 'won' ? "e.g., Superior ROI projection in proposal" : "e.g., Budget constraints"}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Key Lesson for Neural Matrix
                </label>
                <textarea 
                  value={keyLesson}
                  onChange={(e) => setKeyLesson(e.target.value)}
                  className="w-full bg-bg-base border border-border-dim rounded-lg px-4 py-3 text-sm text-text-primary focus:border-accent outline-none transition-all h-24 resize-none"
                  placeholder="What should the AI learn from this outcome? This will form a new synapse in the intelligence network."
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !selectedLeadId}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent hover:bg-accent/90 text-black font-mono font-bold text-sm rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              LOG OUTCOME & INJECT INTO MATRIX
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
