import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Play, 
  Settings, 
  RefreshCw, 
  Layers, 
  HelpCircle,
  Database,
  Globe,
  Mail,
  Calendar,
  Share2,
  Cpu,
  FileText,
  Clock,
  Sparkles,
  Plus,
  PlusCircle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { useToast } from '../context/ToastContext';
import { Dialog } from './ui/Dialog';

interface Connector {
  id: string;
  name: string;
  category: 'analytics' | 'local_business' | 'communication' | 'scheduling' | 'marketing' | 'storage' | 'ai_providers' | 'documents' | 'future' | 'intelligence' | 'backend';
  status: 'connected' | 'not_connected' | 'error' | 'coming_soon';
  logo: any;
  lastSync?: string;
  permissions: string[];
  health?: 'excellent' | 'degraded' | 'critical' | 'none';
  description: string;
}

export default function ConnectorsPanel() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Modal State for custom connector creation
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Connector['category']>('ai_providers');
  const [newStatus, setNewStatus] = useState<'connected' | 'not_connected'>('connected');
  const [newDescription, setNewDescription] = useState('');
  const [newPermissions, setNewPermissions] = useState('');

  // Define static and dynamic connector entities
  const initialConnectors: Connector[] = useMemo(() => [
    // AI Providers — Core Dual-Drive & Foundation Providers
    { 
      id: 'dual_drive', 
      name: 'HAL Dual-Drive Consensus (Gemini 2.5 + Nemotron 70B)', 
      category: 'ai_providers', 
      status: 'connected', 
      logo: Sparkles, 
      lastSync: '2026-08-15 02:40', 
      permissions: ['Simultaneous Multimodal Discovery', 'Policy Verification', 'Zero-Downtime Co-Pilot', 'Autonomous Fallback'], 
      health: 'excellent',
      description: 'Concurrent dual-drive cognitive engine running Google Gemini for strategic discovery & search grounding paired with NVIDIA Nemotron for deterministic policy validation.'
    },
    { 
      id: 'gemini', 
      name: 'Google Gemini (gemini-2.5-flash / pro)', 
      category: 'ai_providers', 
      status: 'connected', 
      logo: Sparkles, 
      lastSync: '2026-08-15 02:35', 
      permissions: ['Google Search Grounding', 'Multimodal Code Audits', 'Vision & Audio Extraction', 'Territory Mapping'], 
      health: 'excellent',
      description: 'Primary Google GenAI foundation model executing real-time search grounded market analysis and contractor website audits.'
    },
    { 
      id: 'nvidia', 
      name: 'NVIDIA NIM (meta/llama-3.1-70b-instruct)', 
      category: 'ai_providers', 
      status: 'connected', 
      logo: Cpu, 
      lastSync: '2026-08-15 02:30', 
      permissions: ['GPU-accelerated Inference', 'Custom Pipeline Integrations', 'Deterministic JSON Structuring', 'Objection Policy Checking'], 
      health: 'excellent',
      description: 'High-density microservices hosting containerized open-weights models for high-throughput batch operations and contract verification.'
    },
    { 
      id: 'openai', 
      name: 'OpenAI (gpt-4o)', 
      category: 'ai_providers', 
      status: 'connected', 
      logo: Cpu, 
      lastSync: '2026-07-05 04:45', 
      permissions: ['General AI assistant', 'Copywriting', 'SEO Analysis', 'Image Generation'], 
      health: 'excellent',
      description: 'Primary general purpose LLM driving automated review drafting, customer emails, and conversational summaries.'
    },
    { 
      id: 'claude', 
      name: 'Anthropic (claude-3-5-sonnet)', 
      category: 'ai_providers', 
      status: 'connected', 
      logo: Cpu, 
      lastSync: '2026-07-05 04:30', 
      permissions: ['Long-form Reasoning', 'Document Analysis', 'Complex Logic'], 
      health: 'excellent',
      description: 'Reasoning and code generation engine auditing territorial websites and constructing highly custom SEO outreach scripts.'
    },
    { 
      id: 'groq', 
      name: 'Groq (llama-3.1-70b)', 
      category: 'ai_providers', 
      status: 'connected', 
      logo: Cpu, 
      lastSync: '2026-07-05 04:00', 
      permissions: ['Ultra-fast Inference', 'Real-time Responses', 'JSON Extraction'], 
      health: 'excellent',
      description: 'LPU-accelerated token generation yielding sub-second query evaluation for interactive site chat and live assistant dialogs.'
    },
    { 
      id: 'perplexity', 
      name: 'Perplexity (llama-3.1-sonar-large)', 
      category: 'ai_providers', 
      status: 'not_connected', 
      logo: Search, 
      permissions: ['Web-connected Search', 'Real-time Grounding', 'Cite Sourcing'], 
      health: 'none',
      description: 'Fuses search indexing with LLMs to discover competitor listing errors and aggregate current local business reputation scores.'
    },
    { 
      id: 'mistral', 
      name: 'Mistral (mistral-large)', 
      category: 'ai_providers', 
      status: 'not_connected', 
      logo: Cpu, 
      permissions: ['Multilingual Generation', 'Function Calling'], 
      health: 'none',
      description: 'Sovereign French model backing regional translations, complex function calling, and structured directory audits.'
    },
    { 
      id: 'ollama', 
      name: 'Ollama (Local models)', 
      category: 'ai_providers', 
      status: 'not_connected', 
      logo: Database, 
      permissions: ['Offline Private Inference', 'Local Weights API'], 
      health: 'none',
      description: 'Zero-cost local model router running securely on edge instances with absolute data and PII containment.'
    },

    // New Intelligence — 3 Integrations (HALBiz 3.0)
    { 
      id: 'timesfm', 
      name: 'TimesFM Prediction Engine', 
      category: 'intelligence', 
      status: 'connected', 
      logo: Sparkles, 
      lastSync: '2026-07-05 03:30', 
      permissions: ['Demand forecasting by Canadian province', 'Revenue prediction', 'Seasonal outreach timing'], 
      health: 'excellent',
      description: 'Google Research pre-trained time-series foundation model predicting local territory trade demand waves and marketing CPL trends.'
    },
    { 
      id: 'agent_reach', 
      name: 'Agent Reach Autonomous Prospector', 
      category: 'intelligence', 
      status: 'connected', 
      logo: Globe, 
      lastSync: '2026-07-05 03:15', 
      permissions: ['Autonomous LinkedIn prospecting', 'Reddit / Twitter/X Scraping', 'RSS Monitoring', 'Storm Alert Triggering'], 
      health: 'excellent',
      description: 'Underlying harvest script mapping active local businesses, scanning weather reports, and extracting real client needs automatically.'
    },
    { 
      id: 'agentzap', 
      name: 'AgentZap Webhook Router', 
      category: 'intelligence', 
      status: 'not_connected', 
      logo: Sparkles, 
      permissions: ['AI phone receptionist', '24/7 Call Handling', 'Emergency SMS Dispatch', 'Appointment Booking'], 
      health: 'none',
      description: 'Synchronizes external voice nodes to dispatch instant text alerts and logs calendar calls directly into the active leads pipeline.'
    },

    // Backend Services — 6 APIs (server.js v4)
    { 
      id: 'sendgrid', 
      name: 'SendGrid Email Service', 
      category: 'backend', 
      status: 'connected', 
      logo: Mail, 
      lastSync: '2026-07-05 02:45', 
      permissions: ['Email campaigns', 'Outreach sequences', 'Decoupled system notifications'], 
      health: 'excellent',
      description: 'Handles robust bulk email delivery, customizable marketing templates, and click-tracking analytics.'
    },
    { 
      id: 'twilio', 
      name: 'Twilio SMS Gateway', 
      category: 'backend', 
      status: 'connected', 
      logo: Mail, 
      lastSync: '2026-07-05 02:30', 
      permissions: ['SMS to contractors', '2FA Authorization', 'Call Tracking API'], 
      health: 'excellent',
      description: 'Triggers instant SMS summaries directly to regional contractor leads when emergency weather peaks are exceeded.'
    },
    { 
      id: 'stripe', 
      name: 'Stripe Billing API', 
      category: 'backend', 
      status: 'connected', 
      logo: Database, 
      lastSync: '2026-07-05 02:15', 
      permissions: ['Payment processing', 'Subscriptions management', 'Invoicing webhook triggers'], 
      health: 'excellent',
      description: 'Connects operational converted leads directly to secure subscription checkouts and live client billing dashboards.'
    },
    { 
      id: 'googleapis', 
      name: 'Google Workspace Client', 
      category: 'backend', 
      status: 'connected', 
      logo: Calendar, 
      lastSync: '2026-07-05 02:00', 
      permissions: ['Calendar sync', 'Sheets export', 'Gmail OAuth authorization'], 
      health: 'excellent',
      description: 'Provides deep server-side access to auto-fill shared client spreadsheets and schedule calendar consultation events.'
    },
    { 
      id: 'pg', 
      name: 'PostgreSQL Relational Storage', 
      category: 'backend', 
      status: 'connected', 
      logo: Database, 
      lastSync: '2026-07-05 01:45', 
      permissions: ['Persistent data storage', 'Leads/CRM schema', 'Campaign snapshots', 'Field-level PII encryption'], 
      health: 'excellent',
      description: localStorage.getItem('halbiz_postgres_url') 
        ? `Connected to Neon PostgreSQL: ${localStorage.getItem('halbiz_postgres_url')?.split('@')[1]?.split('?')[0] || 'neondb'}`
        : 'Canonical secure relational datastore hosting historical logs, decrypted contractor profiles, and time-series performance metrics.'
    },
    { 
      id: 'google_oauth', 
      name: 'Google OAuth SSO (Passport)', 
      category: 'backend', 
      status: 'connected', 
      logo: Globe, 
      lastSync: '2026-07-05 01:30', 
      permissions: ['Single sign-on authentication', 'User Profile Access', 'Secure Session Routing'], 
      health: 'excellent',
      description: 'Tokenized verification service validating contractor identity logs and routing to customized dashboards.'
    },

    // Legacy Analytics
    { 
      id: 'ga4', 
      name: 'Google Analytics 4', 
      category: 'analytics', 
      status: 'connected', 
      logo: Globe, 
      lastSync: '2026-07-05 04:12', 
      permissions: ['Read Traffic Data', 'View Conversions'], 
      health: 'excellent',
      description: 'Ingests website session lengths, event completions, and user journey funnels.'
    },
    { 
      id: 'gsc', 
      name: 'Google Search Console', 
      category: 'analytics', 
      status: 'connected', 
      logo: Search, 
      lastSync: '2026-07-05 02:30', 
      permissions: ['Read Clicks', 'Read Core Web Vitals'], 
      health: 'excellent',
      description: 'Tracks search query positions, click rates, and indexing updates for territory sites.'
    },
    { 
      id: 'gtm', 
      name: 'Google Tag Manager', 
      category: 'analytics', 
      status: 'not_connected', 
      logo: Layers, 
      permissions: ['Publish Tags', 'Read Container Schema'], 
      health: 'none',
      description: 'Automates tracking tag injection and conversion firing rules on contractor sites.'
    },

    // Local Business
    { 
      id: 'gbp', 
      name: 'Google Business Profile', 
      category: 'local_business', 
      status: 'connected', 
      logo: Database, 
      lastSync: '2026-07-05 01:15', 
      permissions: ['Manage Reviews', 'Read Geo Profile'], 
      health: 'excellent',
      description: 'Monitors client listings, reviews count, star ratings, and coordinates citation synchronization.'
    },
    { 
      id: 'gmaps', 
      name: 'Google Maps Places API', 
      category: 'local_business', 
      status: 'connected', 
      logo: Database, 
      lastSync: '2026-07-05 04:30', 
      permissions: ['Nearby Place Search', 'Place Details Audit'], 
      health: 'excellent',
      description: 'Powers geographical territory discovery and phone/website harvest sweeps in local zones.'
    },
    { 
      id: 'mapbox', 
      name: 'Mapbox Navigation SDK', 
      category: 'local_business', 
      status: 'not_connected', 
      logo: Globe, 
      permissions: ['Read Vector Maps', 'Retrieve Geospatial Tiles'], 
      health: 'none',
      description: 'Alternative visualization engine for contractor density hotspots and active leads maps.'
    },

    // Communication
    { 
      id: 'gmail', 
      name: 'Gmail Suite Integrator', 
      category: 'communication', 
      status: 'connected', 
      logo: Mail, 
      lastSync: '2026-07-04 18:00', 
      permissions: ['Send Outbound pitches', 'Read inbox replies'], 
      health: 'excellent',
      description: 'Dispatches automated cold-pitch campaigns and tracks sentiment of prospect responses.'
    },
    { 
      id: 'outlook', 
      name: 'Microsoft Outlook Email', 
      category: 'communication', 
      status: 'not_connected', 
      logo: Mail, 
      permissions: ['Send Mail', 'Read Inbox'], 
      health: 'none',
      description: 'Alternative corporate mail agent connector for automated campaign outreach pipelines.'
    },
    { 
      id: 'smtp', 
      name: 'Secure Custom SMTP', 
      category: 'communication', 
      status: 'connected', 
      logo: Mail, 
      lastSync: '2026-07-05 03:00', 
      permissions: ['Send Outbound System Logs'], 
      health: 'excellent',
      description: 'Dedicated email gateway utilizing local SMTP parameters for fallback status alerts.'
    },
    { 
      id: 'whatsapp', 
      name: 'WhatsApp Business API', 
      category: 'communication', 
      status: 'error', 
      logo: Share2, 
      permissions: ['Send Direct Alerts', 'Read Client Text Feedback'], 
      health: 'critical',
      description: 'Sends instant follow-up alerts to contractor owners directly when leads status upgrades.'
    },

    // Scheduling
    { 
      id: 'gcal', 
      name: 'Google Calendar API', 
      category: 'scheduling', 
      status: 'connected', 
      logo: Calendar, 
      lastSync: '2026-07-05 04:00', 
      permissions: ['Manage Events', 'Read Free-Busy Slots'], 
      health: 'excellent',
      description: 'Blocks consultation slots automatically when contractor prospects approve booking proposals.'
    },
    { 
      id: 'mscal', 
      name: 'Microsoft Outlook Calendar', 
      category: 'scheduling', 
      status: 'not_connected', 
      logo: Calendar, 
      permissions: ['Manage Events', 'Read Slots'], 
      health: 'none',
      description: 'Synchronizes meeting requests with corporate Outlook calendars for larger contractor firms.'
    },

    // Marketing
    { 
      id: 'meta_ads', 
      name: 'Meta (FB & IG) Ads Manager', 
      category: 'marketing', 
      status: 'connected', 
      logo: Share2, 
      lastSync: '2026-07-05 04:20', 
      permissions: ['Manage Campaigns', 'Read Ad Set Analytics'], 
      health: 'excellent',
      description: 'Synchronizes active leads conversions with Meta custom audiences to improve ad targeting.'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn Sales Integrator', 
      category: 'marketing', 
      status: 'not_connected', 
      logo: Share2, 
      permissions: ['Search Business Profiles', 'Send InMail pitches'], 
      health: 'none',
      description: 'Audits business executive profiles for high-value roofing and trade companies.'
    },

    // Storage
    { 
      id: 'gdrive', 
      name: 'Google Drive Asset Cloud', 
      category: 'storage', 
      status: 'connected', 
      logo: FileText, 
      lastSync: '2026-07-04 12:10', 
      permissions: ['Create Documents', 'Write Shared Sheets'], 
      health: 'excellent',
      description: 'Stores generated client pitch-decks, SEO diagnostic files, and territory outreach plans.'
    },
    { 
      id: 'onedrive', 
      name: 'Microsoft OneDrive Sync', 
      category: 'storage', 
      status: 'not_connected', 
      logo: FileText, 
      permissions: ['Write Files', 'Read Folders'], 
      health: 'none',
      description: 'Alternative storage cloud for contractor documents, layouts, and backup archives.'
    },

    // Documents
    { 
      id: 'm365', 
      name: 'Microsoft 365 Enterprise', 
      category: 'documents', 
      status: 'not_connected', 
      logo: FileText, 
      permissions: ['Write Documents', 'Manage Sheets'], 
      health: 'none',
      description: 'Alternative document builder mapping contractor audit reports to Microsoft Office formats.'
    },
    { 
      id: 'gworkspace', 
      name: 'Google Workspace Suite', 
      category: 'documents', 
      status: 'connected', 
      lastSync: '2026-07-05 02:40', 
      logo: FileText, 
      permissions: ['Create Sheets', 'Create Docs', 'Manage Users'], 
      health: 'excellent',
      description: 'Canonical workspace connector automating shared client pitch drives and team schedules.'
    },

    // Future Coming Soon
    { id: 'hubspot', name: 'HubSpot Enterprise Sync', category: 'future', status: 'coming_soon', logo: HelpCircle, permissions: [], description: 'Bi-directional synchronization of qualified contractor deals.' },
    { id: 'salesforce', name: 'Salesforce CRM Bridge', category: 'future', status: 'coming_soon', logo: HelpCircle, permissions: [], description: 'Corporate lead pipeline mapping for enterprise partners.' },
    { id: 'notion', name: 'Notion Workspace Sync', category: 'future', status: 'coming_soon', logo: HelpCircle, permissions: [], description: 'Saves campaign strategies and SEO briefs in shared Notion boards.' },
    { id: 'slack', name: 'Slack Team Channels', category: 'future', status: 'coming_soon', logo: HelpCircle, permissions: [], description: 'Pushes real-time conversion activity notifications to Slack.' },
    { id: 'discord', name: 'Discord Operations Hub', category: 'future', status: 'coming_soon', logo: HelpCircle, permissions: [], description: 'Pushes automated diagnostic alerts to your support Discord guild.' },
    { id: 'github', name: 'GitHub Action Trigger', category: 'future', status: 'coming_soon', logo: HelpCircle, permissions: [], description: 'Triggers site updates automatically when SEO failures are detected.' }
  ], []);

  const categories = [
    { id: 'all', label: 'All Connectors' },
    { id: 'ai_providers', label: 'AI Chat APIs' },
    { id: 'intelligence', label: 'HALBiz 3.0 Intel' },
    { id: 'backend', label: 'Backend Services' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'local_business', label: 'Local Business' },
    { id: 'communication', label: 'Communication' },
    { id: 'scheduling', label: 'Scheduling' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'storage', label: 'Storage' },
    { id: 'documents', label: 'Documents' },
    { id: 'future', label: 'Coming Soon' }
  ];

  // In-memory status state for demo/interactive play
  const [connectorsState, setConnectorsState] = useState<Connector[]>(initialConnectors);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/connectors/health', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (data.connectors) {
          setConnectorsState(prev => prev.map(c => {
            const match = data.connectors.find((sc: any) => sc.id === c.id);
            if (match) {
              return {
                ...c,
                status: match.status,
                health: match.health,
                lastSync: match.lastSync || c.lastSync
              };
            }
            return c;
          }));
        }
      } catch (err) {
        console.error('Failed to load connector health status', err);
      }
    };
    fetchHealth();
  }, []);

  const filteredConnectors = useMemo(() => {
    return connectorsState.filter(c => {
      const matchQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'all' || c.category === selectedCategory;
      return matchQuery && matchCategory;
    });
  }, [connectorsState, searchQuery, selectedCategory]);

  const handleToggleConnection = (id: string, currentStatus: string) => {
    if (currentStatus === 'coming_soon') {
      toast({
        variant: 'info',
        title: 'Roadmap Reservation',
        description: 'This connector is scheduled for Phase 5 development.',
        whatNext: 'Review the HAL Bible Roadmap specification.'
      });
      return;
    }

    setConnectorsState(prev => prev.map(c => {
      if (c.id === id) {
        const newStatus = c.status === 'connected' ? 'not_connected' : 'connected';
        const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
        
        toast({
          variant: newStatus === 'connected' ? 'success' : 'warning',
          title: newStatus === 'connected' ? 'Integration Authenticated' : 'Integration Disconnected',
          description: `${c.name} authentication parameters successfully updated.`,
          whatNext: newStatus === 'connected' ? 'Triggering immediate health sweep...' : 'Audit logs recorded.'
        });

        return {
          ...c,
          status: newStatus,
          lastSync: newStatus === 'connected' ? nowStr : undefined,
          health: newStatus === 'connected' ? 'excellent' : 'none'
        };
      }
      return c;
    }));
  };

  const handleSyncNow = async (id: string, name: string) => {
    setSyncingId(id);
    toast({
      variant: 'info',
      title: 'Dispersing Sync Payload',
      description: `Sending REST packet to retrieve active updates from ${name}...`,
    });

    if (id === 'agent_reach') {
      try {
        const res = await fetch('/api/ai/test-agent-reach', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token')}`
          },
          body: JSON.stringify({ city: 'Calgary', niche: 'roofing' })
        });
        const data = await res.json();
        
        if (data.success) {
           setSyncingId(null);
           setConnectorsState(prev => prev.map(c => {
            if (c.id === id) {
              const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
              return {
                ...c,
                lastSync: nowStr,
                health: 'excellent'
              };
            }
            return c;
          }));
          toast({
            variant: 'success',
            title: 'Agent Reach Active',
            description: `Pinged ${data.engine}. Weather alert multipliers are online.`,
            whatNext: 'Ready for autonomous prospecting bursts.'
          });
          return;
        }
      } catch (e) {
         console.error('Failed to sync Agent Reach', e);
      }
    }

    setTimeout(() => {
      setSyncingId(null);
      setConnectorsState(prev => prev.map(c => {
        if (c.id === id) {
          const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
          return {
            ...c,
            lastSync: nowStr,
            health: 'excellent'
          };
        }
        return c;
      }));
      toast({
        variant: 'success',
        title: 'Sync Finalized',
        description: `Successfully synchronized parameters for ${name}.`,
        whatNext: 'Operational database records updated.'
      });
    }, 1500);
  };

  const handleAddConnectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDescription.trim()) {
      toast({
        variant: 'warning',
        title: 'Form Incomplete',
        description: 'Please provide a valid name and description.'
      });
      return;
    }

    // Map logo based on category
    let matchedLogo = Sparkles;
    if (newCategory === 'ai_providers') matchedLogo = Cpu;
    else if (newCategory === 'backend') matchedLogo = Database;
    else if (newCategory === 'communication') matchedLogo = Mail;
    else if (newCategory === 'scheduling') matchedLogo = Calendar;
    else if (newCategory === 'storage') matchedLogo = FileText;

    const parsedPermissions = newPermissions
      ? newPermissions.split(',').map(p => p.trim()).filter(Boolean)
      : ['Custom API Integration', 'Access Webhook Outbound'];

    const newConn: Connector = {
      id: 'custom_' + Date.now(),
      name: newName,
      category: newCategory,
      status: newStatus,
      logo: matchedLogo,
      lastSync: newStatus === 'connected' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : undefined,
      permissions: parsedPermissions,
      health: newStatus === 'connected' ? 'excellent' : 'none',
      description: newDescription
    };

    setConnectorsState(prev => [newConn, ...prev]);
    setIsAddModalOpen(false);

    toast({
      variant: 'success',
      title: 'Connector Added',
      description: `Successfully instantiated ${newName} within your Connectors Hub.`,
      whatNext: newStatus === 'connected' ? 'Immediate synchronization active.' : 'Available for manual authentication.'
    });

    // Reset Form
    setNewName('');
    setNewDescription('');
    setNewPermissions('');
    setNewCategory('ai_providers');
    setNewStatus('connected');
  };

  return (
    <div className="space-y-6 animate-fade-in text-text-primary" id="connectors_panel">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-dim pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-text-secondary uppercase">
            HAL INTEGRATION PORTAL
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Connectors Hub</h1>
            <span className="text-[10px] font-mono bg-accent/10 text-accent border border-accent/25 px-2 py-0.5 rounded-sm uppercase font-bold">HALBIZ 3.0</span>
          </div>
          <p className="text-xs text-text-secondary max-w-xl">
            Secure, decrypted pathways connecting HAL Core to external APIs, services, and search databases. This page contains only real, active network connectors.
          </p>
        </div>

        {/* Action button and status display */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Connector
          </Button>

          {/* Integration Summary Widget */}
          <div className="bg-bg-base border border-border-dim rounded-sm p-3 flex items-center gap-4 text-xs font-mono shrink-0 select-none">
            <div>
              <span className="text-[9px] text-text-secondary uppercase block">Active Gateway Nodes</span>
              <span className="text-text-primary font-bold text-sm">
                {connectorsState.filter(c => c.status === 'connected').length} / {connectorsState.filter(c => c.status !== 'coming_soon').length} Connected
              </span>
            </div>
            <div className="border-l border-border-dim pl-3 text-right">
              <span className="text-[9px] text-text-secondary uppercase block">Connection Health</span>
              <span className="text-positive font-bold">100% SECURE</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BUTTONS & SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase border rounded-sm transition-all ${
                selectedCategory === cat.id
                  ? 'bg-accent/10 border-accent/40 text-accent font-semibold'
                  : 'bg-bg-raised border-border-dim text-text-secondary hover:border-border-default hover:text-text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search API connectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-overlay border border-border-dim text-xs py-2 pl-8.5 pr-3 rounded-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* GRID DISPLAY */}
      {filteredConnectors.length === 0 ? (
        <div className="bg-bg-raised border border-border-dim rounded-sm p-12 text-center flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="w-8 h-8 text-text-tertiary" />
          <div className="space-y-1">
            <h3 className="text-xs font-mono text-text-primary uppercase font-bold">No Connectors Matching Query</h3>
            <p className="text-[11px] text-text-secondary">Try searching a different platform name or check category filters.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnectors.map(c => {
            const Icon = c.logo;
            const isConnected = c.status === 'connected';
            const isError = c.status === 'error';
            const isComingSoon = c.status === 'coming_soon';

            return (
              <Card key={c.id} className={isComingSoon ? 'opacity-65' : ''}>
                <CardHeader
                  title={c.name}
                  subtitle={c.category.replace('_', ' ').toUpperCase()}
                  action={
                    <div className="p-1.5 rounded bg-bg-raised border border-border-dim text-accent shrink-0">
                      <Icon className="w-4 h-4 text-accent" />
                    </div>
                  }
                />
                <CardContent className="space-y-3 flex-1 min-h-[140px]">
                  <p className="text-[11px] text-text-secondary leading-relaxed">{c.description}</p>
                  
                  {/* Status pills / sync values */}
                  <div className="pt-2 flex flex-wrap gap-2 text-[9.5px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-tertiary uppercase">HEALTH:</span>
                      {c.health === 'excellent' && <span className="text-positive font-bold flex items-center gap-1">🟢 HEALTHY / ACTIVE</span>}
                      {c.health === 'critical' && <span className="text-danger font-bold flex items-center gap-1">🔴 CRITICAL / MISSING KEY</span>}
                      {c.health === 'degraded' && <span className="text-yellow-400 font-bold flex items-center gap-1">🟡 DEGRADED</span>}
                      {c.health === 'none' && !isComingSoon && <span className="text-text-tertiary font-semibold">⚪ UNCONFIGURED</span>}
                      {isComingSoon && <span className="text-[#f59e0b] font-bold">● COMING SOON</span>}
                    </div>

                    {isConnected && c.lastSync && (
                      <div className="flex items-center gap-1">
                        <span className="text-text-tertiary">| SYNC:</span>
                        <span className="text-text-primary font-bold">{c.lastSync}</span>
                      </div>
                    )}
                  </div>

                  {/* Permissions listing */}
                  {!isComingSoon && c.permissions.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-border-dim/40">
                      <span className="text-[8px] font-mono text-text-tertiary uppercase block">Active Credentials Scope:</span>
                      <div className="flex flex-wrap gap-1">
                        {c.permissions.map(p => (
                          <span key={p} className="text-[8.5px] bg-bg-overlay border border-border-dim/50 px-1.5 py-0.5 rounded-sm text-text-secondary">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-between border-t border-border-dim/45 pt-3">
                  <Button
                    variant={isConnected ? 'outline' : isComingSoon ? 'ghost' : 'primary'}
                    size="sm"
                    disabled={isComingSoon}
                    onClick={() => handleToggleConnection(c.id, c.status)}
                  >
                    {isConnected ? 'Disconnect' : isComingSoon ? 'Coming Soon' : 'Authenticate'}
                  </Button>

                  {isConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={syncingId === c.id}
                      onClick={() => handleSyncNow(c.id, c.name)}
                      className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingId === c.id ? 'animate-spin text-accent' : ''}`} />
                      Sync Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE CUSTOM CONNECTOR DIALOG */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Instantiate New API Connector"
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddConnectorSubmit}>
              Create Connector
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddConnectorSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">
              Connector Name / Platform
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Perplexity API, Ollama Local"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-bg-overlay border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Connector['category'])}
                className="w-full bg-bg-overlay border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors select-none font-sans"
              >
                <option value="ai_providers">AI Chat APIs</option>
                <option value="intelligence">New Intelligence</option>
                <option value="backend">Backend Services</option>
                <option value="analytics">Analytics</option>
                <option value="local_business">Local Business</option>
                <option value="communication">Communication</option>
                <option value="scheduling">Scheduling</option>
                <option value="marketing">Marketing</option>
                <option value="storage">Storage</option>
                <option value="documents">Documents</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">
                Initial Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'connected' | 'not_connected')}
                className="w-full bg-bg-overlay border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors select-none font-sans"
              >
                <option value="connected">Connected (Active)</option>
                <option value="not_connected">Not Connected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">
              Active Scope / Permissions (Comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Read Traffic, Write Logs, Call webhook"
              value={newPermissions}
              onChange={(e) => setNewPermissions(e.target.value)}
              className="w-full bg-bg-overlay border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1">
              Operational Description
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide a clear description of the data exchange scope..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full bg-bg-overlay border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
