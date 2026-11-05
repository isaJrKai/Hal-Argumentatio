import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Zap, 
  HardDrive, 
  RotateCw, 
  Terminal,
  Heart,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  Server
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useToast } from '../context/ToastContext';

interface AuditLog {
  id: string;
  contractorId?: string;
  action: string;
  ipAddress?: string;
  details?: string;
  createdAt: string;
}

interface HealthCheck {
  name: string;
  category: 'core' | 'ai' | 'database' | 'security' | 'background';
  status: 'healthy' | 'warning' | 'critical';
  details: string;
  metric?: string;
}

interface SystemHealthPanelProps {
  token?: string | null;
}

export default function SystemHealthPanel({ token }: SystemHealthPanelProps) {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [healthScore, setHealthScore] = useState(0);
  const [lastCheck, setLastCheck] = useState('Never');
  const [uptime, setUptime] = useState('Loading...');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [aiEngineLabel, setAiEngineLabel] = useState('Not yet verified');
  const [aiEngineDetail, setAiEngineDetail] = useState('Waiting for a live configuration check.');
  const [cryptoLabel, setCryptoLabel] = useState('Not yet verified');
  const [cryptoDetail, setCryptoDetail] = useState('Waiting for an encryption round-trip test.');
  
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Application database readiness', category: 'database', status: 'warning', details: 'Not yet checked.', metric: 'PENDING' },
    { name: 'Live AI provider inference', category: 'ai', status: 'warning', details: 'Not yet checked.', metric: 'PENDING' },
    { name: 'Hermes provider configuration', category: 'ai', status: 'warning', details: 'Not yet checked.', metric: 'PENDING' },
    { name: 'Google Maps connector', category: 'core', status: 'warning', details: 'Not yet checked.', metric: 'PENDING' },
    { name: 'AES-256-GCM round-trip', category: 'security', status: 'warning', details: 'Not yet checked.', metric: 'PENDING' },
    { name: 'Scheduler activity', category: 'background', status: 'warning', details: 'Not yet checked.', metric: 'PENDING' }
  ]);

  // Fetch real audit logs from the API with resilient token resolution
  const fetchAuditLogs = async (retry = 1) => {
    try {
      const activeToken = token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '';
      const res = await fetch('/api/system/audit-logs', {
        headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = data.sort((a: AuditLog, b: AuditLog) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setLogs(sorted);
        }
      } else if (retry > 0) {
        setTimeout(() => fetchAuditLogs(retry - 1), 600);
      }
    } catch (err) {
      if (retry > 0) {
        setTimeout(() => fetchAuditLogs(retry - 1), 600);
      } else {
        console.warn('System audit trail temporarily unavailable:', err);
      }
    }
  };

  // Live diagnostics: only mark a subsystem healthy when a real probe proves it.
  const runDiagnostics = async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
      toast({
        variant: 'info',
        title: 'Diagnosing HAL Services',
        description: 'Checking database readiness, live AI provider inference, encryption and scheduler records...'
      });
    }

    const activeToken = token || localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token') || '';
    const headers = activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
    const requestJson = async (url: string, authenticated = true, method: 'GET' | 'POST' = 'GET') => {
      const requestHeaders = authenticated
        ? { ...headers, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) }
        : {};
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        ...(method === 'POST' ? { body: '{}' } : {})
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || `${url} returned HTTP ${response.status}`);
      return payload;
    };

    const dbStarted = performance.now();
    const readinessProbe = requestJson('/api/ready', false).then(
      result => { setDbLatency(Math.round(performance.now() - dbStarted)); return result; },
      error => { setDbLatency(Math.round(performance.now() - dbStarted)); throw error; }
    );
    const providerProbe = silent
      ? Promise.resolve(null)
      : requestJson('/api/system/diagnostics/ai-providers', true, 'POST');
    const [readyResult, aiResult, providerProbeResult, hermesResult, connectorResult, cryptoResult, schedulerResult, leadsResult, healthResult] = await Promise.allSettled([
      readinessProbe,
      requestJson('/api/ai/engine-status'),
      providerProbe,
      requestJson('/api/hermes/status'),
      requestJson('/api/connectors/health'),
      requestJson('/api/system/diagnostics/crypto'),
      requestJson('/api/scheduler/jobs'),
      requestJson('/api/leads'),
      requestJson('/api/health', false)
    ]);

    const value = (result: PromiseSettledResult<any>) => result.status === 'fulfilled' ? result.value : null;
    const failure = (result: PromiseSettledResult<any>) => result.status === 'rejected'
      ? (result.reason instanceof Error ? result.reason.message : 'Probe failed.')
      : '';
    const ready = value(readyResult);
    const ai = value(aiResult);
    const providerProbeData = value(providerProbeResult);
    const hermes = value(hermesResult);
    const connectorData = value(connectorResult);
    const cryptoData = value(cryptoResult);
    const schedulerJobs = value(schedulerResult);
    const leadsData = value(leadsResult);
    const health = value(healthResult);

    const dbReady = ready?.status === 'ready';
    const missingTables = Array.isArray(ready?.missingTables) ? ready.missingTables : [];
    const dbDetails = dbReady
      ? `Application PostgreSQL pool is reachable; ${Array.isArray(ready.checkedTables) ? ready.checkedTables.length : 0} required tables verified.`
      : ready?.database === 'connected'
        ? `Database responds, but required tables are missing: ${missingTables.join(', ') || 'schema check incomplete'}.`
        : failure(readyResult) || 'Application database is not ready.';
    
    const activeEngine = typeof ai?.activeEngine === 'string' ? ai.activeEngine : 'unavailable';
    const configuredProviders = ['gemini', 'nemotron'].filter(key => ai?.engines?.[key]?.configured);
    const verifiedProviders = ['gemini', 'nemotron'].filter(key => providerProbeData?.providers?.[key]?.status === 'verified');
    const failedProviders = ['gemini', 'nemotron'].filter(key => providerProbeData?.providers?.[key]?.status === 'failed');
    const liveProbeUnavailable = !silent && providerProbeResult.status === 'rejected';
    const aiVerified = configuredProviders.length > 0 && verifiedProviders.length === configuredProviders.length;
    const aiDetails = configuredProviders.length
      ? silent
        ? `Configured: ${configuredProviders.join(', ')}. Live inference has not been tested during this background refresh.`
        : liveProbeUnavailable
          ? failure(providerProbeResult) || 'Live provider diagnostics could not run.'
          : `Live inference verified: ${verifiedProviders.join(', ') || 'none'}.${failedProviders.length ? ` Failed: ${failedProviders.join(', ')}.` : ''}`
      : failure(aiResult) || 'No AI provider is configured.';
    setAiEngineLabel(activeEngine === 'unavailable' ? 'Unavailable' : activeEngine);
    setAiEngineDetail(aiVerified ? 'Live inference verified' : configuredProviders.length ? 'Configured · inference unverified' : 'No configured provider');

    const hermesProvider = typeof hermes?.provider === 'string' ? hermes.provider : 'unknown';
    const hermesDetails = hermesProvider === 'fallback'
      ? 'Hermes is using its deterministic fallback. No live model provider is configured.'
      : `Provider ${hermesProvider} is configured; this status endpoint does not prove a successful model request.`;

    const mapsConnector = Array.isArray(connectorData?.connectors)
      ? connectorData.connectors.find((item: any) => item.id === 'googleMaps')
      : null;
    const mapsConfigured = Boolean(mapsConnector?.configured);
    const mapsDetails = mapsConfigured
      ? 'Google Maps credential is saved. A successful live Maps request has not been verified by this scan.'
      : failure(connectorResult) || 'Google Maps connector is not configured in the saved connector credentials.';

    const cryptoVerified = cryptoData?.status === 'verified' && cryptoData?.roundTrip === true;
    setCryptoLabel(cryptoVerified ? 'AES-256-GCM verified' : 'Verification failed');
    setCryptoDetail(cryptoVerified ? 'Live encrypt/decrypt round-trip succeeded.' : failure(cryptoResult) || cryptoData?.error || 'Encryption round-trip did not pass.');

    const jobs = Array.isArray(schedulerJobs) ? schedulerJobs : [];
    const failedJobs = jobs.filter((job: any) => job.status === 'failed').length;
    const schedulerDetails = failure(schedulerResult)
      || (failedJobs ? `${failedJobs} of ${jobs.length} persisted scheduler jobs are marked failed.`
        : jobs.length ? `${jobs.length} scheduler records found. A record does not prove an external cron trigger is running.`
        : 'No persisted scheduler jobs were found; scheduled execution is not verified.');

    const leadsCount = Array.isArray(leadsData) ? leadsData.length : null;
    const updatedChecks: HealthCheck[] = [
      {
        name: 'Application database readiness',
        category: 'database',
        status: dbReady ? 'healthy' : 'critical',
        details: dbDetails,
        metric: dbReady ? 'READY' : 'NOT READY'
      },
      {
        name: 'AI provider configuration',
        category: 'ai',
        status: !configuredProviders.length ? 'critical' : aiVerified ? 'healthy' : 'warning',
        details: aiDetails,
        metric: !configuredProviders.length ? 'UNAVAILABLE' : aiVerified ? 'VERIFIED' : 'UNVERIFIED'
      },
      {
        name: 'Hermes provider configuration',
        category: 'ai',
        status: hermesResult.status === 'fulfilled' ? 'warning' : 'critical',
        details: hermesResult.status === 'fulfilled' ? hermesDetails : failure(hermesResult),
        metric: hermesResult.status === 'fulfilled' ? hermesProvider.toUpperCase() : 'ERROR'
      },
      {
        name: 'Google Maps connector',
        category: 'core',
        status: mapsConfigured ? 'warning' : 'critical',
        details: mapsDetails,
        metric: mapsConfigured ? 'CONFIGURED' : 'MISSING'
      },
      {
        name: 'AES-256-GCM round-trip',
        category: 'security',
        status: cryptoVerified ? 'healthy' : 'critical',
        details: cryptoVerified ? 'The server encrypted and decrypted a one-time in-memory probe successfully.' : failure(cryptoResult) || cryptoData?.error || 'Cryptographic self-test failed.',
        metric: cryptoVerified ? 'VERIFIED' : 'FAILED'
      },
      {
        name: 'Scheduler activity',
        category: 'background',
        status: failedJobs ? 'critical' : 'warning',
        details: schedulerDetails,
        metric: jobs.length ? `${jobs.length} RECORDS` : 'UNVERIFIED'
      }
    ];

    setChecks(updatedChecks);
    setLastCheck(new Date().toLocaleTimeString());

    if (health?.uptimeSeconds != null) {
      const total = Math.max(0, Number(health.uptimeSeconds));
      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const mins = Math.floor((total % 3600) / 60);
      setUptime(`${days}d ${hours}h ${mins}m`);
    }
    if (leadsResult.status === 'fulfilled' && leadsCount !== null) {
      // Endpoint reachability is recorded separately from database readiness.
      console.info(`[HAL diagnostics] Lead API returned ${leadsCount} tenant records.`);
    }

    const criticalCount = updatedChecks.filter(check => check.status === 'critical').length;
    const warningCount = updatedChecks.filter(check => check.status === 'warning').length;
    const score = Math.max(0, 100 - criticalCount * 15 - warningCount * 5);
    setHealthScore(score);
    await fetchAuditLogs();

    if (!silent) {
      setRefreshing(false);
      toast({
        variant: criticalCount ? 'warning' : warningCount ? 'info' : 'success',
        title: criticalCount ? 'Diagnostics Found Critical Issues' : warningCount ? 'Diagnostics Complete — Some Services Unverified' : 'Diagnostics Passed',
        description: `${criticalCount} critical, ${warningCount} unverified/warning checks. Configured credentials are not treated as proof of live provider execution.`,
        whatNext: `System integrity score: ${score}%.`
      });
    }
  };

  // Run on mount
  useEffect(() => {
    if (token) {
      runDiagnostics(true);
      fetchAuditLogs();
      
      // Diagnostics are low-frequency and paused while the tab is hidden.
      const poll = setInterval(() => {
        if (!document.hidden) runDiagnostics(true);
      }, 30000);
      const handleVisibility = () => {
        if (!document.hidden) runDiagnostics(true);
      };
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        clearInterval(poll);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }
  }, [token]);

  return (
    <div className="space-y-6 animate-fade-in text-text-primary" id="system_health_panel">
      
      {/* TITLE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dim pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-accent uppercase">
            HAL EXECUTIVE DIAGNOSTICS
          </span>
          <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent animate-pulse" />
            System Heartbeat
          </h1>
          <p className="text-xs text-text-secondary">
            Live monitoring of HAL's full-stack core engine processes, database transactions, cryptographic encryption status, and background scheduling systems.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          isLoading={refreshing}
          onClick={() => runDiagnostics(false)}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
          Run Diagnostics Scan
        </Button>
      </div>

      {/* SCORE CARDS BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* OVERALL HEALTH */}
        <div className="bg-bg-raised border border-border-dim rounded-xl p-4.5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-text-secondary uppercase">HAL Integrity Score</span>
            <Heart className={`w-4 h-4 ${healthScore > 90 ? 'text-positive animate-pulse fill-positive/25' : 'text-amber-500 animate-bounce'}`} />
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-bold text-text-primary font-mono tracking-tight">{healthScore}%</span>
            <div className={`text-[10px] font-mono mt-0.5 font-bold uppercase tracking-wider ${healthScore > 90 ? 'text-positive' : 'text-amber-500'}`}>
              ● {healthScore > 90 ? 'OPERATIONAL' : 'DEGRADED'}
            </div>
          </div>
        </div>

        {/* AI ENGINE STATUS */}
        <div className="bg-bg-raised border border-border-dim rounded-xl p-4.5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-text-secondary uppercase">AI Orchestrator</span>
            <Cpu className="w-4 h-4 text-accent" />
          </div>
          <div className="mt-2.5">
            <span className="text-sm font-bold text-text-primary uppercase font-sans">{aiEngineLabel}</span>
            <div className="text-[10px] text-accent font-mono mt-0.5 uppercase tracking-wide">{aiEngineDetail}</div>
          </div>
        </div>

        {/* CRYPTO ENGINE SECURITY */}
        <div className="bg-bg-raised border border-border-dim rounded-xl p-4.5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-text-secondary uppercase">PII Guard & Encryption</span>
            <ShieldCheck className="w-4 h-4 text-positive" />
          </div>
          <div className="mt-2.5">
            <span className="text-sm font-bold text-text-primary uppercase font-mono">{cryptoLabel}</span>
            <div className="text-[10px] text-text-secondary font-mono mt-0.5 uppercase tracking-wide">{cryptoDetail}</div>
          </div>
        </div>

        {/* DATABASE LATENCY */}
        <div className="bg-bg-raised border border-border-dim rounded-xl p-4.5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-text-secondary uppercase">Database IO Engine</span>
            <Database className="w-4 h-4 text-text-primary" />
          </div>
          <div className="mt-2.5">
            <span className="text-sm font-bold text-text-primary uppercase font-mono">
              {dbLatency !== null ? `${dbLatency} ms` : 'Evaluating...'}
            </span>
            <div className="text-[10px] text-text-secondary font-mono mt-0.5 uppercase tracking-wide">
              Uptime: {uptime.split(' ')[0]}
            </div>
          </div>
        </div>

      </div>

      {/* CORE LOGS & DETAILED STATUS GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DIAGNOSTIC CHECKLIST (LEFT COLUMN) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-bg-raised border border-border-dim p-4.5 rounded-xl">
            <div className="flex items-center gap-2 mb-3 border-b border-border-dim pb-2.5 justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">Subsystem Diagnostics Check</h3>
              </div>
              <span className="text-[9px] font-mono text-text-tertiary">LAST SCAN: {lastCheck}</span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {checks.map((chk, idx) => {
                const isHealthy = chk.status === 'healthy';
                const isWarning = chk.status === 'warning';
                
                return (
                  <div 
                    key={idx} 
                    className="p-3 bg-bg-base border border-border-dim rounded-lg flex items-start justify-between gap-3.5 text-xs transition-colors hover:border-border-default"
                  >
                    <div className="flex items-start gap-2.5">
                      {isHealthy ? (
                        <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-negative shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-text-primary block uppercase tracking-wide text-[10.5px] font-mono">
                          {chk.name}
                        </span>
                        <p className="text-[10.5px] text-text-secondary mt-0.5 leading-normal">{chk.details}</p>
                      </div>
                    </div>
                    
                    {chk.metric && (
                      <span className={`text-[9px] font-mono border px-2 py-0.5 rounded uppercase tracking-wider shrink-0 select-none ${
                        isHealthy ? 'text-positive bg-positive/5 border-positive/10' :
                        isWarning ? 'text-amber-500 bg-amber-500/5 border-amber-500/10' :
                        'text-negative bg-negative/5 border-negative/10'
                      }`}>
                        {chk.metric}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TECHNICAL METRICS & TERMINAL (RIGHT COLUMN) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* SYSTEM HARDWARE & METADATA CARD */}
          <div className="bg-bg-raised border border-border-dim p-4.5 rounded-xl">
            <div className="flex items-center gap-2 mb-3 border-b border-border-dim pb-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                System Telemetry Status
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono text-[10.5px]">
              <div className="border-b border-border-dim/40 py-1 flex flex-col">
                <span className="text-text-tertiary uppercase text-[8px] tracking-wider">Uptime Counter</span>
                <span className="text-text-primary font-bold">{uptime}</span>
              </div>
              <div className="border-b border-border-dim/40 py-1 flex flex-col">
                <span className="text-text-tertiary uppercase text-[8px] tracking-wider">Database Node</span>
                <span className="text-text-primary font-bold">PostgreSQL (Neon)</span>
              </div>
              <div className="border-b border-border-dim/40 py-1 flex flex-col">
                <span className="text-text-tertiary uppercase text-[8px] tracking-wider">Port Ingress Binding</span>
                <span className="text-indigo-400 font-bold">PORT 3000 (0.0.0.0)</span>
              </div>
              <div className="border-b border-border-dim/40 py-1 flex flex-col">
                <span className="text-text-tertiary uppercase text-[8px] tracking-wider">Security Vector</span>
                <span className="text-positive font-bold">{cryptoLabel}</span>
              </div>
            </div>
          </div>

          {/* REAL OPERATIONAL AUDIT CONSOLE */}
          <div className="bg-bg-raised border border-border-dim p-4.5 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-border-dim pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-positive" />
                <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">Audit Trail Snapshot</span>
              </div>
              <span className="text-[8px] text-positive font-mono uppercase bg-positive/10 border border-positive/25 px-1.5 py-0.5 rounded">
                Latest Records
              </span>
            </div>

            <div className="bg-bg-base border border-border-dim rounded-lg p-3 font-mono text-[9.5px] leading-relaxed text-text-secondary h-[180px] overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <div className="text-text-tertiary italic text-center py-8">Awaiting system events...</div>
              ) : (
                logs.map((log) => {
                  let badgeColor = 'text-text-primary';
                  if (log.action.includes('FAIL') || log.action.includes('ERROR')) badgeColor = 'text-negative';
                  else if (log.action.includes('SUCCESS') || log.action.includes('REGISTER') || log.action.includes('LOGIN')) badgeColor = 'text-positive';
                  else if (log.action.includes('DECRYPT') || log.action.includes('ENCRYPT') || log.action.includes('LEAD')) badgeColor = 'text-accent';

                  return (
                    <div key={log.id} className="hover:bg-bg-subtle/50 py-0.5 px-1 rounded transition-all flex items-start gap-1">
                      <span className="text-text-tertiary select-none shrink-0">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                      <span className={`font-bold shrink-0 uppercase ${badgeColor}`}>[{log.action}]</span>
                      <span className="text-text-secondary truncate block max-w-md" title={log.details}>
                        {log.details || 'Operational execution.'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
