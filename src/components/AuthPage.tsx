import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, EyeOff, Loader2, Sparkles, Download } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (token: string, contractor: any) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('halbiz_last_email') || '';
  });
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hal_app_installed') === 'true' ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
  });

  const handleDownloadApp = () => {
    const currentUrl = window.location.origin;
    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
    const isLinux = typeof navigator !== 'undefined' && /Linux/.test(navigator.userAgent) && !/Android/.test(navigator.userAgent);
    
    let filename = 'HALBiz.url';
    let content = `[InternetShortcut]\nURL=${currentUrl}\nIconIndex=0\nIconFile=${currentUrl}/icon.jpg\n`;
    let type = 'text/plain';

    if (isMac) {
      filename = 'HALBiz.webloc';
      content = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>URL</key>\n\t<string>${currentUrl}</string>\n</dict>\n</plist>\n`;
    } else if (isLinux) {
      filename = 'HALBiz.desktop';
      content = `[Desktop Entry]\nName=HALBiz\nComment=AI Business Operating Intelligence System\nExec=xdg-open ${currentUrl}\nIcon=utilities-terminal\nTerminal=false\nType=Application\nCategories=Office;Development;\n`;
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsAppInstalled(true);
    localStorage.setItem('hal_app_installed', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('halbiz_last_email', email);
      onAuthSuccess(data.token, data.contractor);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request reset token');
      }

      setSuccess(data.message + (data.debugToken ? ` (Development Debug Token: ${data.debugToken})` : ''));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: email, password }) // email holds reset token in this sandbox form
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed');
      }

      setSuccess('Password updated successfully. You can now login with your new credentials.');
      setShowForgotPassword(false);
      setIsLogin(true);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-height-screen min-h-screen bg-bg-dark flex items-center justify-center p-6 font-sans selection:bg-brand selection:text-black relative">
      {/* Download App Button (Disappears after download) */}
      {!isAppInstalled && (
        <button
          id="auth-download-app-btn"
          onClick={handleDownloadApp}
          className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3 py-1.5 rounded bg-brand/15 hover:bg-brand/25 border border-brand/40 text-brand text-xs font-mono font-bold transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          title="Download HAL Desktop App (Disappears after download)"
        >
          <Download className="w-3.5 h-3.5 text-brand" />
          <span>DOWNLOAD APP</span>
        </button>
      )}

      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-brand/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[460px] bg-card-dark/80 backdrop-blur-md border border-border-dark rounded-sm p-8 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded bg-brand-glow border border-brand/30 flex items-center justify-center text-brand">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            HALBIZ <span className="text-[10px] font-mono bg-brand-glow text-brand border border-brand/30 px-2 py-0.5 rounded-sm font-bold">V1.2</span>
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-text-secondary mt-2">
            AI Business Operating Intelligence System
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 text-xs rounded-sm mb-6 font-mono leading-relaxed"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-brand-glow border border-brand/20 text-brand text-xs rounded-sm mb-6 font-mono leading-relaxed"
          >
            {success}
          </motion.div>
        )}

        {showForgotPassword ? (
          <form onSubmit={email.length > 20 ? handleResetPassword : handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                {email.length > 20 ? "Reset Token" : "Email Address"}
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={email.length > 20 ? "Paste token here..." : "you@company.com"}
                className="w-full bg-card-inner border border-border-dark rounded-sm py-2 px-3 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-brand transition-colors font-sans"
              />
            </div>

            {email.length > 20 && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-card-inner border border-border-dark rounded-sm py-2 px-3 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-black hover:bg-brand-dim font-bold text-xs py-2.5 px-4 rounded-sm flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50 mt-2 uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : email.length > 20 ? (
                'Reset Password'
              ) : (
                'Dispatch Reset Link'
              )}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-xs text-text-secondary hover:text-white transition-colors underline font-mono"
              >
                ← RETURN TO LOGIN
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Isaac"
                  className="w-full bg-card-inner border border-border-dark rounded-sm py-2 px-3 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-card-inner border border-border-dark rounded-sm py-2 px-3 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-secondary">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-xs text-brand hover:text-brand-dim font-mono tracking-normal"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-card-inner border border-border-dark rounded-sm py-2 px-3 pr-10 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-brand transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-black hover:bg-brand-dim font-bold text-xs py-2.5 px-4 rounded-sm flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50 mt-2 uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLogin ? (
                'Enter Workspace'
              ) : (
                'Register Workspace'
              )}
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-xs text-text-secondary hover:text-white transition-colors"
              >
                {isLogin ? (
                  <span>New to HALBiz? <strong className="text-brand">Request account registration</strong></span>
                ) : (
                  <span>Already have an account? <strong className="text-brand">Login</strong></span>
                )}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 border-t border-border-dark pt-4 text-center text-xs text-text-dim">
          Use your own account credentials. Default demo credentials are not provided.
        </p>
      </motion.div>
    </div>
  );
}
