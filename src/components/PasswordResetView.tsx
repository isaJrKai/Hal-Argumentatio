import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, EyeOff, Loader2, CheckCircle2, Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface PasswordResetViewProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PasswordResetView({ token, onSuccess, onCancel }: PasswordResetViewProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const isMinLength = password.length >= 12;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = isMinLength && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMinLength) {
      setError('Password must be at least 12 characters long for security compliance.');
      return;
    }
    if (!passwordsMatch) {
      setError('The passwords you entered do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password. The link may have expired or already been used.');
      }

      setIsSuccess(true);
      // Wait a moment so the user sees the confirmation, then proceed into dashboard
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while resetting your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6 font-sans selection:bg-brand selection:text-black relative">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[480px] bg-card-dark/95 backdrop-blur-md border border-border-dark rounded-xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3 h-3" />
            Verified Security Handover
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Set New Password
          </h1>
          <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
            Enter and confirm your new administrator password to restore full workspace credentials.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-red-950/40 border border-red-500/30 text-red-300 text-xs rounded-lg mb-5 font-mono flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </motion.div>
        )}

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-4"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Password Updated!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Your password has been securely salted and saved. Logging you directly into your workspace...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-brand">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to Operating Console...</span>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-text-secondary mb-1.5 font-semibold">
                New Password (Minimum 12 Characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  minLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password..."
                  className="w-full bg-card-inner border border-border-dark rounded-lg py-2.5 pl-3.5 pr-10 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-brand transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-text-secondary mb-1.5 font-semibold">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={12}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password..."
                className="w-full bg-card-inner border border-border-dark rounded-lg py-2.5 px-3.5 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-brand transition-colors font-mono"
              />
            </div>

            {/* Password Validation Checklist */}
            <div className="bg-card-inner/60 border border-border-dark/60 rounded-lg p-3 space-y-1.5 text-xs font-mono">
              <div className={`flex items-center gap-2 ${isMinLength ? 'text-emerald-400' : 'text-zinc-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>At least 12 characters ({password.length}/12)</span>
              </div>
              <div className={`flex items-center gap-2 ${hasLetter && hasNumber ? 'text-emerald-400' : 'text-zinc-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Mix of letters and numbers</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-emerald-400' : 'text-zinc-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full bg-brand text-black hover:bg-brand-dim font-bold text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider shadow-lg hover:shadow-brand/20 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SECURING CREDENTIALS...</span>
                </>
              ) : (
                <>
                  <span>UPDATE PASSWORD & ENTER WORKSPACE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-text-secondary hover:text-white transition-colors underline font-mono cursor-pointer"
              >
                ← CANCEL & RETURN TO WORKSPACE
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
