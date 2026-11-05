import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

export function CommunicationsSetupPanel() {
  const { toast } = useToast();
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [leadId, setLeadId] = useState('');
  const [consentStatus, setConsentStatus] = useState<'opted_in' | 'opted_out'>('opted_in');
  const [consentSource, setConsentSource] = useState<'written' | 'verbal' | 'web_form'>('written');
  const [consentEvidence, setConsentEvidence] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const post = async (path: string, payload: Record<string, string>) => {
    const token = localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token') || '';
    if (!token) throw new Error('Sign in again before configuring communications.');
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
    return result;
  };

  const run = async (key: string, path: string, payload: Record<string, string>, success: string) => {
    setBusy(key);
    try {
      await post(path, payload);
      toast({ variant: 'success', title: success, description: 'The workspace configuration was saved and verified by the provider.' });
    } catch (error: any) {
      toast({ variant: 'danger', title: 'Configuration not completed', description: error?.message || 'Please try again.' });
    } finally {
      setBusy(null);
    }
  };

  const fieldClass = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100';
  const buttonClass = 'rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-2 text-sm font-semibold text-white dark:text-zinc-900 disabled:opacity-50';

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Workspace channel setup</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Provider tokens must first be saved in this workspace's encrypted connector settings. This panel never asks you to paste secrets here.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <form className="space-y-2" onSubmit={event => { event.preventDefault(); void run('meta', '/api/outreach/whatsapp/connect-number', { phoneNumberId: metaPhoneNumberId.trim() }, 'WhatsApp number verified'); }}>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Meta WhatsApp phone-number ID</label>
          <input className={fieldClass} value={metaPhoneNumberId} onChange={event => setMetaPhoneNumberId(event.target.value)} placeholder="Numeric Meta phone-number ID" required />
          <button className={buttonClass} disabled={busy !== null || !metaPhoneNumberId.trim()} type="submit">{busy === 'meta' ? 'Verifying…' : 'Verify WhatsApp number'}</button>
          <p className="text-[11px] text-zinc-500">Meta verifies the ID using this workspace's saved access token before tenant routing is enabled.</p>
        </form>

        <form className="space-y-2" onSubmit={event => { event.preventDefault(); void run('twilio', '/api/outreach/sms/connect-number', { phoneNumber: twilioPhoneNumber.trim() }, 'Twilio sender verified'); }}>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Twilio sender number (E.164)</label>
          <input className={fieldClass} value={twilioPhoneNumber} onChange={event => setTwilioPhoneNumber(event.target.value)} placeholder="+15551234567" required />
          <button className={buttonClass} disabled={busy !== null || !twilioPhoneNumber.trim()} type="submit">{busy === 'twilio' ? 'Verifying…' : 'Verify Twilio sender'}</button>
          <p className="text-[11px] text-zinc-500">Twilio checks that the sender number belongs to this workspace's saved account.</p>
        </form>
      </div>

      <div className="mt-5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
        <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">SMS consent record</h4>
        <p className="mt-1 mb-3 text-[11px] text-zinc-500">Record opt-in only after the recipient has actually consented. The evidence note is encrypted; this is an operator attestation, not independent proof.</p>
        <form className="grid gap-2 md:grid-cols-2" onSubmit={event => { event.preventDefault(); void run('consent', '/api/outreach/sms/consent', { leadId: leadId.trim(), status: consentStatus, source: consentSource, evidence: consentEvidence.trim() }, 'SMS consent recorded'); }}>
          <input className={fieldClass} value={leadId} onChange={event => setLeadId(event.target.value)} placeholder="Saved lead ID" required />
          <select className={fieldClass} value={consentStatus} onChange={event => setConsentStatus(event.target.value as 'opted_in' | 'opted_out')}>
            <option value="opted_in">Recipient opted in</option>
            <option value="opted_out">Recipient opted out</option>
          </select>
          <select className={fieldClass} value={consentSource} onChange={event => setConsentSource(event.target.value as 'written' | 'verbal' | 'web_form')}>
            <option value="written">Written consent</option>
            <option value="verbal">Verbal consent</option>
            <option value="web_form">Web form consent</option>
          </select>
          <input className={fieldClass} value={consentEvidence} onChange={event => setConsentEvidence(event.target.value)} placeholder="Evidence note (min. 8 characters)" minLength={8} maxLength={2000} required />
          <button className={buttonClass} disabled={busy !== null || !leadId.trim() || consentEvidence.trim().length < 8} type="submit">{busy === 'consent' ? 'Saving…' : 'Save consent record'}</button>
        </form>
      </div>
    </Card>
  );
}
