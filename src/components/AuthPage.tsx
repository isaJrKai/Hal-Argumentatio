import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { googleSignIn } from '../services/googleAuth';

async function parseApiResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  const body = await res.text();

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      res.ok
        ? 'The server returned an unexpected response. Please refresh and try again.'
        : `The server could not complete the request (HTTP ${res.status}). Please try again later.`
    );
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error('The server returned an invalid response. Please try again later.');
  }
}

interface AuthPageProps {
  onAuthSuccess: (token: string, contractor: any) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem('halbiz_last_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await parseApiResponse(res);
      if (!res.ok) throw new Error(data.error || 'Buyer demo sign-in is unavailable.');
      if (typeof data.token !== 'string' || !data.token || !data.contractor || typeof data.contractor.id !== 'string') {
        throw new Error('The server did not return a valid demo session.');
      }
      onAuthSuccess(data.token, data.contractor);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Buyer demo sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const payload = isLogin ? { email: normalizedEmail, password } : { email: normalizedEmail, password, name: normalizedName };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await parseApiResponse(res);
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (typeof data.token !== 'string' || !data.token || !data.contractor || typeof data.contractor !== 'object' || typeof data.contractor.id !== 'string') {
        throw new Error('The server did not return a valid authenticated session. Please try again.');
      }
      try {
        localStorage.setItem('halbiz_last_email', normalizedEmail);
      } catch {
        // Email convenience storage is optional; it must not block a successful sign-in.
      }
      onAuthSuccess(data.token, data.contractor);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
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
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await parseApiResponse(res);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request reset token');
      }

      setSuccess(data.message || 'If the account exists, password-reset instructions will be provided.');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Password reset request could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const authResult = await googleSignIn();
      if (!authResult?.user) {
        throw new Error('Google sign-in could not be completed.');
      }

      const googleEmail = authResult.user.email;
      const googleName = authResult.user.displayName;
      if (!googleEmail) {
        throw new Error('Google did not return an email address for this account.');
      }

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail,
          name: googleName,
          idToken: authResult.idToken
        })
      });

      const data = await parseApiResponse(res);
      if (!res.ok) {
        throw new Error(data.error || 'Google sign-in failed.');
      }

      if (!data.token || !data.contractor) {
        throw new Error('Invalid authenticated session returned.');
      }

      try {
        localStorage.setItem('halbiz_last_email', googleEmail);
      } catch {}

      onAuthSuccess(data.token, data.contractor);
    } catch (err: any) {
      console.error('[Google Auth Error]', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup closed before completion. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Google Workspace sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-height-screen min-h-screen bg-bg-dark flex items-center justify-center p-6 font-sans selection:bg-brand selection:text-black relative">

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
            HALBIZ
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-text-secondary mt-2">
            Business workspace
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
          <form onSubmit={handleForgotPassword} className="space-y-4">
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
                className="w-full bg-card-inner border border-border-dark rounded-sm py-2 px-3 text-sm text-text-primary placeholder-text-dim focus:outline-none focus:border-brand transition-colors font-sans"
              />
            </div>



            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-black hover:bg-brand-dim font-bold text-xs py-2.5 px-4 rounded-sm flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50 mt-2 uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Send password reset instructions'
              )}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                disabled={loading}
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
                  placeholder="Your full name"
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
                    disabled={loading}
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
                  minLength={isLogin ? undefined : 12}
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

            {!isLogin && (
              <p className="text-[10px] text-text-dim font-mono">Registration passwords must be at least 12 characters.</p>
            )}

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

            <div className="flex items-center my-3.5">
              <div className="flex-1 border-t border-border-dark" />
              <span className="px-3 text-[10px] font-mono text-text-dim uppercase tracking-widest">or</span>
              <div className="flex-1 border-t border-border-dark" />
            </div>

            {isLogin && (
              <button
                type="button"
                disabled={loading}
                onClick={handleDemoLogin}
                className="w-full border border-brand/40 bg-brand/10 hover:bg-brand/15 text-brand font-semibold text-xs py-2.5 px-4 rounded-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Explore buyer demo'}
              </button>
            )}

            {/* Google account sign-in */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-xs py-2.5 px-4 rounded-sm flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Sign in with Google Workspace</span>
            </button>

            <div className="text-center mt-5">
              <button
                type="button"
                disabled={loading}
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
          Secure, isolated workspace access with Google Workspace or registered credentials. Free authentication with zero monthly subscription fees.
        </p>
      </motion.div>
    </div>
  );
}
