import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { readApiResponse } from '../lib/apiResponse';

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  description: string;
  currency: string;
  amountDueMinor: number;
  amountPaidMinor: number;
  balanceDueMinor: number;
  status: 'issued' | 'partially_paid' | 'paid' | 'void';
  dueAt?: string | null;
  createdAt: string;
}

interface InvoiceLedgerPanelProps {
  token: string;
  projectId: string;
  leadId?: string;
  businessName: string;
}

export default function InvoiceLedgerPanel({ token, projectId, leadId, businessName }: InvoiceLedgerPanelProps) {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [description, setDescription] = useState('Monthly service retainer');
  const [amountUsd, setAmountUsd] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const money = useCallback((minor: number, currency = 'USD') => new Intl.NumberFormat(undefined, {
    style: 'currency', currency, maximumFractionDigits: 2
  }).format(minor / 100), []);

  const loadInvoices = useCallback(async () => {
    const response = await fetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } });
    const payload = await readApiResponse<unknown>(response, 'Invoice ledger');
    if (!response.ok) throw new Error((payload as any)?.error || `Invoice list failed (HTTP ${response.status}).`);
    if (!Array.isArray(payload)) throw new Error('Invoice ledger response was not a valid list.');
    setInvoices(payload.filter((invoice: any) => invoice.projectId === projectId));
  }, [projectId, token]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadInvoices().catch(err => {
      if (!cancelled) setError(err instanceof Error ? err.message : 'Invoices could not be loaded.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loadInvoices]);

  const totalOutstanding = useMemo(() => invoices
    .filter(invoice => invoice.status !== 'void')
    .reduce((sum, invoice) => sum + invoice.balanceDueMinor, 0), [invoices]);

  const handleCreateInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amountUsd);
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount * 100 > 2147483647) {
      setError('Enter an invoice description and a positive amount in USD.');
      return;
    }
    setBusyId('create'); setError(null); setNotice(null);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          projectId,
          leadId: leadId || undefined,
          description: description.trim(),
          amountMinor: Math.round(parsedAmount * 100),
          currency: 'USD',
          dueAt: dueAt || undefined
        })
      });
      const payload = await readApiResponse<any>(response, 'Create invoice');
      if (!response.ok) throw new Error(payload.error || `Invoice creation failed (HTTP ${response.status}).`);
      await loadInvoices();
      setAmountUsd('');
      setNotice(`Invoice ${payload.invoiceNumber} saved to the ledger.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invoice could not be created.');
    } finally { setBusyId(null); }
  };

  const handleRecordPayment = async (invoice: InvoiceRecord) => {
    const amount = Number(paymentAmounts[invoice.id] || (invoice.balanceDueMinor / 100));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a positive receipt amount.');
      return;
    }
    setBusyId(invoice.id); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amountMinor: Math.round(amount * 100),
          method: paymentMethods[invoice.id] || 'bank_transfer'
        })
      });
      const payload = await readApiResponse<any>(response, 'Record invoice receipt');
      if (!response.ok) throw new Error(payload.error || `Receipt could not be recorded (HTTP ${response.status}).`);
      await loadInvoices();
      setNotice(`Receipt recorded. Remaining balance: ${money(payload.balanceDueMinor, invoice.currency)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Receipt could not be recorded.');
    } finally { setBusyId(null); }
  };

  const handleVoidInvoice = async (invoice: InvoiceRecord) => {
    setBusyId(invoice.id); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/void`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await readApiResponse<any>(response, 'Void invoice');
      if (!response.ok) throw new Error(payload.error || `Invoice could not be voided (HTTP ${response.status}).`);
      await loadInvoices();
      setNotice(`Invoice ${invoice.invoiceNumber} voided.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invoice could not be voided.');
    } finally { setBusyId(null); }
  };

  return (
    <section className="bg-bg-raised border border-border-dim rounded-sm p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Invoices & receipts</h3>
          <p className="text-[11px] text-text-secondary">{businessName} · Manual accounting ledger · Receipts do not imply provider settlement</p>
        </div>
        <div className="text-xs font-mono text-text-secondary">Outstanding: <strong className="text-text-primary">{money(totalOutstanding)}</strong></div>
      </div>

      {error && <div role="alert" className="rounded border border-warning/30 bg-warning/5 p-2 text-xs text-text-primary">{error}</div>}
      {notice && <div role="status" className="rounded border border-positive/30 bg-positive/5 p-2 text-xs text-text-primary">{notice}</div>}

      <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <label className="text-[11px] text-text-secondary md:col-span-2">Invoice description
          <input value={description} onChange={event => setDescription(event.target.value)} maxLength={500} required className="mt-1 w-full rounded-sm border border-border-dim bg-bg-base p-2 text-xs text-text-primary" />
        </label>
        <label className="text-[11px] text-text-secondary">Amount (USD)
          <input type="number" min="0.01" step="0.01" value={amountUsd} onChange={event => setAmountUsd(event.target.value)} required className="mt-1 w-full rounded-sm border border-border-dim bg-bg-base p-2 text-xs text-text-primary" />
        </label>
        <label className="text-[11px] text-text-secondary">Due date
          <input type="date" value={dueAt} onChange={event => setDueAt(event.target.value)} className="mt-1 w-full rounded-sm border border-border-dim bg-bg-base p-2 text-xs text-text-primary" />
        </label>
        <button type="submit" disabled={busyId === 'create'} className="md:col-span-4 justify-self-start rounded-sm bg-brand px-3 py-2 text-xs font-bold text-black disabled:opacity-50">
          {busyId === 'create' ? 'Saving invoice…' : 'Issue invoice'}
        </button>
      </form>

      <div className="space-y-2">
        {loading ? <p className="text-xs text-text-secondary">Loading invoices…</p> : invoices.length === 0 ? (
          <p className="rounded border border-border-dim p-4 text-xs text-text-secondary">No invoices are recorded for this project yet.</p>
        ) : invoices.map(invoice => (
          <div key={invoice.id} className="rounded border border-border-dim bg-bg-base p-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-text-primary">{invoice.invoiceNumber} · {invoice.description}</div>
                <div className="mt-1 text-[10px] text-text-secondary">Issued {new Date(invoice.createdAt).toLocaleDateString()}{invoice.dueAt ? ` · Due ${new Date(invoice.dueAt).toLocaleDateString()}` : ''}</div>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-text-secondary">{invoice.status.replace('_', ' ')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div><span className="text-text-secondary block">Invoiced</span><strong className="text-text-primary">{money(invoice.amountDueMinor, invoice.currency)}</strong></div>
              <div><span className="text-text-secondary block">Received</span><strong className="text-text-primary">{money(invoice.amountPaidMinor || 0, invoice.currency)}</strong></div>
              <div><span className="text-text-secondary block">Balance</span><strong className="text-text-primary">{money(invoice.balanceDueMinor, invoice.currency)}</strong></div>
            </div>
            {invoice.status !== 'paid' && invoice.status !== 'void' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="number" min="0.01" step="0.01" placeholder={String(invoice.balanceDueMinor / 100)} value={paymentAmounts[invoice.id] ?? ''} onChange={event => setPaymentAmounts(current => ({ ...current, [invoice.id]: event.target.value }))} className="rounded-sm border border-border-dim bg-bg-raised p-2 text-xs text-text-primary" aria-label="Receipt amount in USD" />
                <select value={paymentMethods[invoice.id] || 'bank_transfer'} onChange={event => setPaymentMethods(current => ({ ...current, [invoice.id]: event.target.value }))} className="rounded-sm border border-border-dim bg-bg-raised p-2 text-xs text-text-primary" aria-label="Receipt method">
                  <option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="card_terminal">Card terminal</option><option value="cheque">Cheque</option><option value="other">Other</option>
                </select>
                <button type="button" disabled={busyId === invoice.id} onClick={() => handleRecordPayment(invoice)} className="rounded-sm border border-border-dim px-3 py-2 text-xs text-text-primary disabled:opacity-50">Record receipt</button>
                {invoice.status === 'issued' && invoice.amountPaidMinor === 0 && <button type="button" disabled={busyId === invoice.id} onClick={() => handleVoidInvoice(invoice)} className="rounded-sm border border-warning/30 px-3 py-2 text-xs text-text-secondary disabled:opacity-50">Void</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
