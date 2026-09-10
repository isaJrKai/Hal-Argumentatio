import React, { useState } from 'react';
import { Mail, Send, Copy, Check, X, ExternalLink } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ShareToEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  itemType: 'report' | 'contract' | 'landing_page' | 'audit';
  defaultRecipientEmail?: string;
  shareUrl: string;
  businessName?: string;
}

export const ShareToEmailModal: React.FC<ShareToEmailModalProps> = ({
  isOpen,
  onClose,
  title,
  itemType,
  defaultRecipientEmail = '',
  shareUrl,
  businessName = 'Valued Client'
}) => {
  const { showToast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [emailSubject, setEmailSubject] = useState(() => {
    if (itemType === 'contract') return `Statement of Work & Retainer Agreement - ${businessName}`;
    if (itemType === 'landing_page') return `High-Speed Mobile Dispatch Page Preview - ${businessName}`;
    return `Confidential Performance & Speed Diagnostic - ${businessName}`;
  });

  const [emailBody, setEmailBody] = useState(() => {
    return `Hi ${businessName},\n\nPlease review the attached ${itemType.replace('_', ' ')} prepared specifically for your business.\n\nDirect access link:\n${shareUrl}\n\nPlease let us know if you have any questions.\n\nBest regards,\nOperations Team`;
  });

  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    showToast({ title: 'Link Copied', message: 'Shareable link copied to clipboard.', type: 'success' });
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleOpenMailClient = () => {
    if (!recipientEmail.trim()) {
      showToast({ title: 'Email Required', message: 'Please enter a recipient email address.', type: 'error' });
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    showToast({ title: 'Mail Client Opened', message: 'Ready to send from your email app.', type: 'info' });
    onClose();
  };

  const handleSendViaDispatch = async () => {
    if (!recipientEmail.trim()) {
      showToast({ title: 'Email Required', message: 'Please enter a recipient email address.', type: 'error' });
      return;
    }
    setIsSending(true);
    try {
      const res = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject,
          body: emailBody
        })
      });

      if (res.ok) {
        showToast({ title: 'Email Dispatched', message: `Successfully sent to ${recipientEmail}`, type: 'success' });
        onClose();
      } else {
        // If SMTP isn't set up yet, fallback smoothly to mail client
        handleOpenMailClient();
      }
    } catch (e) {
      handleOpenMailClient();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-bg-raised border border-border-dim w-full max-w-lg rounded-xl shadow-2xl overflow-hidden font-sans text-text-primary">
        
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-border-dim flex items-center justify-between bg-bg-base/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary leading-tight">Share to Email</h3>
              <p className="text-[11px] text-text-secondary">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-mono text-text-secondary mb-1 font-bold uppercase">
              Recipient Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. owner@contractor.com"
              className="w-full bg-bg-base border border-border-dim focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-text-primary outline-hidden shadow-inner"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-secondary mb-1 font-bold uppercase">
              Subject Line
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full bg-bg-base border border-border-dim focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-text-primary outline-hidden shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-text-secondary mb-1 font-bold uppercase">
              Message Content
            </label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={5}
              className="w-full bg-bg-base border border-border-dim focus:border-blue-500 rounded-lg p-3 text-xs text-text-primary outline-hidden resize-none shadow-inner leading-relaxed"
            />
          </div>

          {/* SHARE LINK CHIP */}
          <div className="p-2.5 rounded-lg bg-bg-base border border-border-dim flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-text-secondary truncate">{shareUrl}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1 rounded bg-bg-subtle hover:bg-bg-raised border border-border-dim text-[11px] font-mono text-cyan-400 flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 py-3 border-t border-border-dim bg-bg-base flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleOpenMailClient}
            className="px-3 py-2 rounded-lg border border-border-dim bg-bg-subtle hover:bg-bg-raised text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Mail Client</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg border border-border-dim hover:bg-bg-subtle text-text-secondary hover:text-text-primary text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendViaDispatch}
              disabled={isSending}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send to Email'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
