import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ExternalLink, 
  X, 
  Eye, 
  EyeOff, 
  RefreshCw,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface GitHubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

interface GitStatus {
  isRepo: boolean;
  branch: string;
  changesCount: number;
  commitCount: number;
  latestCommit: string;
}

export const GitHubDeployModal: React.FC<GitHubDeployModalProps> = ({ isOpen, onClose, token }) => {
  const { showToast } = useToast();
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [repoUrl, setRepoUrl] = useState(() => localStorage.getItem('hal_github_repo_url') || '');
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('hal_github_pat') || '');
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('Release: HAL Operating Intelligence System v1.0');
  const [showToken, setShowToken] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ commitHash?: string; message?: string; repoUrl?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/git/status', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setGitStatus(data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setErrorMsg(null);
      setPushResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setErrorMsg('GitHub repository URL is required.');
      return;
    }

    setIsPushing(true);
    setErrorMsg(null);
    setPushResult(null);

    // Save preferences locally
    localStorage.setItem('hal_github_repo_url', repoUrl.trim());
    if (githubToken.trim()) {
      localStorage.setItem('hal_github_pat', githubToken.trim());
    }

    try {
      const res = await fetch('/api/admin/git/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          token: githubToken.trim() || undefined,
          branch: branch.trim() || 'main',
          commitMessage: commitMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Git push operation failed.');
      }

      setPushResult(data);
      showToast({
        title: 'Pushed to GitHub Successfully',
        message: `Branch ${data.branch} updated (${data.commitHash})`,
        type: 'success'
      });
      fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Push failed. Please check repository permissions or token.');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <UploadCloud className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Deploy Codebase to GitHub</h3>
              <p className="text-xs text-slate-400">Push full production workspace, architecture, and engines to remote repository</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handlePush} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Status Metric Strip */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Branch</span>
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>{gitStatus?.branch || 'main'}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Changes</span>
              <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block tabular-nums">
                {gitStatus?.changesCount ?? 0} files ready
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Total Commits</span>
              <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block tabular-nums">
                {gitStatus?.commitCount ?? 0}
              </span>
            </div>
          </div>

          {/* Repo URL Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              GitHub Repository HTTPS URL *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. https://github.com/organization/hal-os.git"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Personal Access Token */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Personal Access Token (PAT)</span>
              </label>
              <span className="text-[10px] text-slate-400">Needs 'repo' or fine-grained write scope</span>
            </div>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="ghp_••••••••••••••••••••••••••••••••"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-amber-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] text-emerald-400/90 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Token is used only in HTTPS push memory and immediately scrubbed from local git configs.</span>
            </div>
          </div>

          {/* Branch & Commit Message */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Release Commit Message</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Error Feedback */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <strong className="block text-red-200 font-semibold mb-0.5">Push Failed:</strong>
                <span className="font-mono text-[11px] leading-relaxed break-all">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Success Feedback */}
          {pushResult && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pushed & Synchronized!</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Commit <span className="font-mono text-emerald-300 font-bold">{pushResult.commitHash}</span> successfully pushed to {branch}.
              </p>
              {pushResult.repoUrl && (
                <a
                  href={pushResult.repoUrl.replace(/\.git$/, '')}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-bold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Repository on GitHub</span>
                </a>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPushing}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isPushing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Staging & Pushing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Push to GitHub</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
