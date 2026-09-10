import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lead, LeadEvent } from '../types';
import { motion } from 'motion/react';
import LeadMap from './LeadMap';
import WhiteLabelReportModal from './WhiteLabelReportModal';
import { useBusinessContext } from '../context/BusinessContext';
import { getCityCoordinates, CITIES_CONFIG } from '../config/cities';
import { 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Globe,
  ShieldCheck,
  Star,
  Smile,
  Compass,
  Cpu,
  Layers,
  Download,
  Upload,
  Clipboard,
  X,
  FileText,
  Printer,
  Send,
  Radio,
  Loader2,
  Share2,
  Check,
  FileCheck2
} from 'lucide-react';
import ContractModal from './ContractModal';

interface LeadsPanelProps {
  leads: Lead[];
  token: string;
  onRefresh: () => void;
}

export default function LeadsPanel({ leads, token, onRefresh }: LeadsPanelProps) {
  const { activeCity, activeNiche, activeIndustry, supportedNiches } = useBusinessContext();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [newEventNotes, setNewEventNotes] = useState('');
  const [newEventType, setNewEventType] = useState('comment');
  const detailsRef = useRef<HTMLDivElement | null>(null);

  // White-Label Pitch Deck / Audit Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLeadTarget, setReportLeadTarget] = useState<Lead | null>(null);
  const [copiedAuditId, setCopiedAuditId] = useState<string | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Phase 2: Sourced Real Business Intelligence State
  const [harvestCity, setHarvestCity] = useState(activeCity);
  const [harvestNiche, setHarvestNiche] = useState(activeNiche);

  // Update harvest parameters when active context shifts
  useEffect(() => {
    setHarvestCity(activeCity);
    setHarvestNiche(activeNiche);
  }, [activeCity, activeNiche]);
  const [harvesting, setHarvesting] = useState(false);
  const [harvestedLeads, setHarvestedLeads] = useState<any[]>([]);
  const [replacing, setReplacing] = useState(false);
  const [showHarvester, setShowHarvester] = useState(false);

  const handleHarvest = async () => {
    setHarvesting(true);
    setHarvestedLeads([]);
    try {
      const res = await fetch('/api/leads/harvest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          city: harvestCity, 
          niche: harvestNiche,
          activeAi: localStorage.getItem('hal_active_ai') || 'gemini'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setHarvestedLeads(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHarvesting(false);
    }
  };

  const handlePurgeAndReplace = async () => {
    if (harvestedLeads.length === 0) return;
    setReplacing(true);
    try {
      const res = await fetch('/api/leads/purge-and-replace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leads: harvestedLeads })
      });
      const data = await res.json();
      if (res.ok) {
        setHarvestedLeads([]);
        setShowHarvester(false);
        setSelectedLead(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplacing(false);
    }
  };
  
  // Create lead form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [notes, setNotes] = useState('');

  // Spreadsheet Bulk Import & Export State
  const [showImportExport, setShowImportExport] = useState(false);
  const [importMethod, setImportMethod] = useState<'paste' | 'file'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [parsedLeads, setParsedLeads] = useState<any[]>([]);
  const [importingLeads, setImportingLeads] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Daily Export State
  const [exportDateFilter, setExportDateFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('today');
  const [exportDataType, setExportDataType] = useState<'leads' | 'events' | 'revenue'>('leads');
  const [exporting, setExporting] = useState(false);
  
  // Record revenue conversion form state
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueAmount, setRevenueAmount] = useState('');
  const [revenueSource, setRevenueSource] = useState('manual_entry');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = l.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            l.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (l.ownerName && l.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCity = cityFilter === 'all' || l.city === cityFilter;
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [leads, searchQuery, cityFilter, statusFilter]);

  const mappedLeadsForMap = useMemo(() => {
    return filteredLeads.map((lead, idx) => {
      const baseCoords = getCityCoordinates(lead.city);
      
      const angle = (idx * 137.5) * (Math.PI / 180);
      const r = 0.01 + (idx * 0.005);
      const latOffset = Math.sin(angle) * r * 0.35;
      const lngOffset = Math.cos(angle) * r * 0.45;

      return {
        id: lead.id,
        businessName: lead.businessName,
        ownerName: lead.ownerName,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        serviceType: lead.serviceType,
        googleRating: lead.googleRating,
        reviewCount: lead.reviewCount,
        seoScore: lead.seoScore,
        performanceScore: lead.performanceScore,
        sslStatus: lead.sslStatus,
        urgencyScore: lead.urgencyScore,
        predictedLtvUsd: lead.predictedLtvUsd,
        status: lead.status,
        coords: {
          lat: baseCoords.lat + latOffset,
          lng: baseCoords.lng + lngOffset
        }
      };
    });
  }, [filteredLeads]);

  const mapCenter = useMemo(() => {
    if (cityFilter !== 'all') {
      return getCityCoordinates(cityFilter);
    }
    if (filteredLeads.length > 0) {
      return getCityCoordinates(filteredLeads[0].city);
    }
    return { lat: 49.8951, lng: -97.1384 };
  }, [cityFilter, filteredLeads]);

  const cities = Array.from(new Set(leads.map(l => l.city)));

  useEffect(() => {
    if (selectedLead) {
      fetchLeadEvents(selectedLead.id);
    }
  }, [selectedLead]);

  useEffect(() => {
    const effectiveToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('halbiz_auth_token')) : '');
    if (!effectiveToken) return;

    fetch('/api/system/audit-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveToken}`
      },
      body: JSON.stringify({
        action: 'LEADS_VIEW_CHANGED',
        details: `Switched lead directory workspace view to: ${viewMode.toUpperCase()}`
      })
    }).catch(err => console.warn('Deferred leads view audit log:', err?.message || err));
  }, [viewMode, token]);

  const fetchLeadEvents = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName, ownerName, email, phone, city, serviceType, notes
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        // Reset
        setBusinessName('');
        setOwnerName('');
        setEmail('');
        setPhone('');
        setCity('');
        setServiceType('');
        setNotes('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newEventNotes.trim()) return;

    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: newEventType,
          notes: newEventNotes
        })
      });

      if (res.ok) {
        setNewEventNotes('');
        fetchLeadEvents(selectedLead.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !revenueAmount) return;

    try {
      const res = await fetch('/api/revenues', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leadId: selectedLead.id,
          amountUsd: Number(revenueAmount),
          source: revenueSource
        })
      });

      if (res.ok) {
        setShowRevenueModal(false);
        setRevenueAmount('');
        // Update selected lead status locally
        const updatedLead = { ...selectedLead, status: 'converted' as const };
        setSelectedLead(updatedLead);
        fetchLeadEvents(selectedLead.id);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateLeadStatus = async (lead: Lead, status: Lead['status']) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        const updated = { ...lead, status };
        if (selectedLead && selectedLead.id === lead.id) {
          setSelectedLead(updated);
        }
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Spreadsheet Clipboard / CSV Parsers
  const parseClipboardOrCSV = (text: string) => {
    if (!text || !text.trim()) return;
    
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return;

    // Determine delimiter (tabs for Excel paste, commas for typical CSV)
    const firstLine = lines[0];
    const hasTabs = firstLine.includes('\t');
    const delimiter = hasTabs ? '\t' : ',';

    const splitRow = (rowText: string) => {
      if (delimiter === '\t') {
        return rowText.split('\t');
      }
      // Simple quote-aware CSV split
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < rowText.length; i++) {
        const char = rowText[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const rawRows = lines.map(line => splitRow(line));
    if (rawRows.length === 0) return;

    // Header Detection Index
    let headerRowIndex = -1;
    let colMap: Record<string, number> = {
      businessName: 0,
      city: 1,
      serviceType: 2,
      ownerName: 3,
      email: 4,
      phone: 5,
      notes: 6
    };

    const firstRowLower = rawRows[0].map(cell => cell.toLowerCase().replace(/[^a-z]/g, ''));
    const hasCompanyHeader = firstRowLower.some(cell => cell.includes('company') || cell.includes('business') || cell.includes('entity') || (cell === 'name' && !firstRowLower.includes('owner')));

    if (hasCompanyHeader) {
      headerRowIndex = 0;
      rawRows[0].forEach((cell, idx) => {
        const c = cell.toLowerCase().trim();
        if (c.includes('company') || c.includes('business') || c.includes('entity') || (c === 'name' && !firstRowLower.includes('owner'))) {
          colMap.businessName = idx;
        } else if (c.includes('city') || c.includes('location') || c.includes('town')) {
          colMap.city = idx;
        } else if (c.includes('service') || c.includes('type') || c.includes('niche') || c.includes('vertical')) {
          colMap.serviceType = idx;
        } else if (c.includes('owner') || c.includes('contact') || c.includes('person') || c.includes('name')) {
          colMap.ownerName = idx;
        } else if (c.includes('email') || c.includes('mail')) {
          colMap.email = idx;
        } else if (c.includes('phone') || c.includes('tel') || c.includes('cell')) {
          colMap.phone = idx;
        } else if (c.includes('note') || c.includes('desc') || c.includes('comment') || c.includes('about')) {
          colMap.notes = idx;
        }
      });
    }

    const startIdx = headerRowIndex === -1 ? 0 : 1;
    const parsed = [];

    for (let i = startIdx; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

      const getValue = (field: string, defaultVal: string = '') => {
        const idx = colMap[field];
        if (idx !== undefined && idx < row.length) {
          return row[idx].trim();
        }
        return defaultVal;
      };

      const businessName = getValue('businessName');
      const cityVal = getValue('city') || 'Winnipeg';
      const serviceTypeVal = getValue('serviceType') || 'plumbing';
      const ownerNameVal = getValue('ownerName');
      const emailVal = getValue('email');
      const phoneVal = getValue('phone');
      const notesVal = getValue('notes');

      const isValid = businessName.length > 0;

      parsed.push({
        businessName,
        city: cityVal,
        serviceType: serviceTypeVal,
        ownerName: ownerNameVal,
        email: emailVal,
        phone: phoneVal,
        notes: notesVal,
        isValid
      });
    }

    setParsedLeads(parsed);
    setImportMessage({
      type: 'info',
      text: `Successfully parsed ${parsed.length} row(s) from spreadsheet. ${parsed.filter(r => r.isValid).length} are valid to ingest.`
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseClipboardOrCSV(text);
      }
    };
    reader.onerror = () => {
      setImportMessage({ type: 'error', text: 'Error reading selected CSV spreadsheet file.' });
    };
    reader.readAsText(file);
  };

  const handleBulkImportSubmit = async () => {
    const validLeads = parsedLeads.filter(l => l.isValid);
    if (validLeads.length === 0) {
      setImportMessage({ type: 'error', text: 'No valid prospect records mapped to ingest.' });
      return;
    }

    setImportingLeads(true);
    try {
      const res = await fetch('/api/leads/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leads: validLeads })
      });

      const data = await res.json();
      if (res.ok) {
        setImportMessage({
          type: 'success',
          text: `Secured Ledger successfully written: Ingested ${data.importedCount} prospects from spreadsheet!`
        });
        setParsedLeads([]);
        setPastedText('');
        onRefresh();
      } else {
        setImportMessage({
          type: 'error',
          text: data.error || 'Failed to bulk-import prospects.'
        });
      }
    } catch (err: any) {
      setImportMessage({ type: 'error', text: 'Secured endpoint timeout or connection failure.' });
      console.error(err);
    } finally {
      setImportingLeads(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      let dataToExport: any[] = [];
      let headers: string[] = [];
      let filename = `hal_report_${exportDataType}_${new Date().toISOString().split('T')[0]}.csv`;

      const isDateMatched = (dateStr?: string) => {
        if (!dateStr) return false;
        const recordDate = new Date(dateStr);
        const today = new Date();
        
        if (exportDateFilter === 'all') return true;

        if (exportDateFilter === 'today') {
          return recordDate.toDateString() === today.toDateString();
        }

        if (exportDateFilter === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return recordDate.toDateString() === yesterday.toDateString();
        }

        if (exportDateFilter === 'week') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return recordDate >= sevenDaysAgo;
        }

        return false;
      };

      if (exportDataType === 'leads') {
        const matchingLeads = leads.filter(l => isDateMatched(l.createdAt));
        headers = ['ID', 'Business Name', 'Owner Name', 'City', 'Service Type', 'Email', 'Phone', 'Status', 'Urgency Score', 'Predicted LTV ($)', 'Notes', 'Created At'];
        dataToExport = matchingLeads.map(l => [
          l.id,
          l.businessName,
          l.ownerName || '',
          l.city,
          l.serviceType,
          l.email || '',
          l.phone || '',
          l.status.toUpperCase(),
          l.urgencyScore,
          l.predictedLtvUsd,
          l.notes || '',
          l.createdAt
        ]);
      } else if (exportDataType === 'events') {
        const res = await fetch('/api/leads-events/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch events log');
        const allEvents: any[] = await res.json();
        
        const matchingEvents = allEvents.filter(e => isDateMatched(e.createdAt));
        headers = ['Event ID', 'Lead ID', 'Business Name', 'City', 'Event Type', 'Notes', 'Recorded At'];
        dataToExport = matchingEvents.map(e => [
          e.id,
          e.leadId,
          e.businessName,
          e.city,
          e.type.toUpperCase(),
          e.notes || '',
          e.createdAt
        ]);
      } else if (exportDataType === 'revenue') {
        const res = await fetch('/api/revenues', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch revenues');
        const revenues: any[] = await res.json();

        const leadsMap = new Map(leads.map(l => [l.id, l]));
        const matchingRevenues = revenues.filter(r => isDateMatched(r.recordedAt));
        
        headers = ['Revenue ID', 'Lead ID', 'Business Name', 'City', 'Source', 'Amount USD', 'Recorded At'];
        dataToExport = matchingRevenues.map(r => {
          const lead = leadsMap.get(r.leadId);
          return [
            r.id,
            r.leadId,
            lead ? lead.businessName : 'Unknown Entity',
            lead ? lead.city : '',
            r.source.toUpperCase(),
            r.amountUsd,
            r.recordedAt
          ];
        });
      }

      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          row.map(cell => {
            const cellStr = cell === null || cell === undefined ? '' : String(cell);
            if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      console.error(err);
      alert('Error compiling CSV export report.');
    } finally {
      setExporting(false);
    }
  };



  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      
      {/* PAGE CONTEXT BRIEFING */}
      <div className="border-b border-border-dim/60 pb-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold tracking-widest text-accent uppercase bg-accent-dim px-2 py-0.5 rounded">Memory</span>
          <span className="w-1 h-1 rounded-full bg-text-tertiary" />
          <span className="text-[10px] font-mono text-text-secondary">PROSPECT RECORD DATABASE</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Memory & Leads</h2>
            <p className="text-xs text-text-secondary max-w-2xl mt-0.5 leading-relaxed">
              Maintain the full memory and history of active merchant profiles. Track their contact states, recorded interaction events, technical scores, and revenue conversions seamlessly inside HAL.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div className="px-3.5 py-1.5 border border-border-dim rounded bg-bg-raised text-center min-w-[100px]">
              <span className="block text-[10px] text-text-secondary uppercase">Total Records</span>
              <span className="text-sm font-semibold text-text-primary mt-0.5 block">{leads.length}</span>
            </div>
            <div className="px-3.5 py-1.5 border border-border-dim rounded bg-bg-raised text-center min-w-[100px]">
              <span className="block text-[10px] text-text-secondary uppercase">Converted</span>
              <span className="text-sm font-semibold text-positive mt-0.5 block">{leads.filter(l => l.status === 'converted').length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* List Panel */}
      <div className="xl:col-span-2 space-y-4">
        {/* Phase 2 Intelligent Lead Harvester */}
        <div className="bg-card-dark border border-border-dark rounded-sm p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand animate-pulse" />
              <h3 className="text-xs font-mono font-bold text-text-primary tracking-wider uppercase">
                HAL Local Market intelligence & Harvester (Phase 2)
              </h3>
            </div>
            <button
              onClick={() => setShowHarvester(!showHarvester)}
              className="text-[10px] font-mono text-brand border border-brand/20 px-2 py-0.5 rounded-sm hover:bg-brand-glow transition-all"
            >
              {showHarvester ? 'COLLAPSE [-]' : 'OPEN HARVEST CONSOLE [+]'}
            </button>
          </div>

          {showHarvester && (
            <div className="space-y-4 pt-2 border-t border-border-dark/60">
              <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
                To fulfill the <strong>Phase 2 Intelligence Target</strong>, HAL bypasses static dummy entries. 
                Configure a territory and industry vertical below to crawl real-world operating entities, conduct automated technical SEO audits, SSL security checks, and public reviews sentiment gathering.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-mono text-text-dim uppercase tracking-wider mb-1 font-bold">Target City</label>
                  <select
                    value={harvestCity}
                    onChange={(e) => setHarvestCity(e.target.value)}
                    className="w-full bg-card-inner border border-border-dark rounded-sm p-2 text-xs text-text-secondary focus:outline-none focus:border-brand font-mono font-bold"
                  >
                    <option value="Winnipeg">Winnipeg</option>
                    <option value="Calgary">Calgary</option>
                    <option value="Fredericton">Fredericton</option>
                    <option value="Sherwood Park">Sherwood Park</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-text-dim uppercase tracking-wider mb-1 font-bold">Industry Vertical / Niche</label>
                  <select
                    value={harvestNiche}
                    onChange={(e) => setHarvestNiche(e.target.value)}
                    className="w-full bg-card-inner border border-border-dark rounded-sm p-2 text-xs text-text-secondary focus:outline-none focus:border-brand font-mono font-bold"
                  >
                    {supportedNiches.map((n) => (
                      <option key={n} value={n}>
                        {n.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleHarvest}
                    disabled={harvesting}
                    className="w-full bg-brand text-black hover:bg-brand-dim disabled:opacity-40 py-2 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
                    {harvesting ? 'Conducting Deep Scrapes...' : 'EXECUTE SCAN'}
                  </button>
                </div>
              </div>

              {harvesting && (
                <div className="bg-card-inner border border-border-dark/60 p-4 rounded-sm flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">HAL crawling maps, local web pages, and public profiles...</p>
                    <p className="text-[10px] font-mono text-text-dim">Analyzing SSL endpoints, technical speed scores, and conducting customer sentiment vector audits...</p>
                  </div>
                </div>
              )}

              {harvestedLeads.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block font-bold">
                    Discovered Active Operating Entities ({harvestedLeads.length})
                  </span>

                  <div className="border border-border-dark/80 rounded-sm divide-y divide-border-dark overflow-hidden bg-card-inner">
                    {harvestedLeads.map((hl, index) => (
                      <div key={index} className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-normal">
                        <div>
                          <p className="font-bold text-text-primary text-[13px]">{hl.businessName}</p>
                          <p className="text-[10px] font-mono text-text-dim uppercase tracking-wider">{hl.serviceType} • {hl.city}</p>
                          <p className="text-[11px] font-mono text-text-secondary mt-1">{hl.phone} | {hl.email}</p>
                        </div>
                        <div className="space-y-1 font-mono text-[11px] text-text-secondary">
                          <p className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-text-dim" />
                            <span className="truncate max-w-[150px]">{hl.websiteUrl}</span>
                            <span className={`text-[9px] px-1 py-0.5 rounded-sm font-bold uppercase ${
                              hl.sslStatus === 'secured' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>{hl.sslStatus}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Cpu className="w-3 h-3 text-text-dim" />
                            <span>SEO Score: <strong className="text-brand font-bold">{hl.seoScore}</strong></span>
                            <span>•</span>
                            <span>Perf Score: <strong className="text-text-primary font-bold">{hl.performanceScore}</strong></span>
                          </p>
                        </div>
                        <div className="space-y-1 font-mono text-[11px] text-text-secondary">
                          <p className="flex items-center gap-1.5">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span>{hl.googleRating} ({hl.reviewCount} reviews)</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Smile className="w-3 h-3 text-text-dim" />
                            <span>Sentiment Index: <strong className="text-brand font-bold">{Math.round(hl.sentimentScore * 100)}% POS</strong></span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-brand/10 border border-brand/25 p-3 rounded-sm space-y-2">
                    <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
                      ⚠️ <strong>MANDATORY DIRECTIVE</strong>: Committing this harvested data will permanently purge all default mock templates starting with <code>lead_seed_</code> and write these authentic business audits directly to your secured ledger.
                    </p>
                    <button
                      onClick={handlePurgeAndReplace}
                      disabled={replacing}
                      className="w-full bg-brand text-black hover:bg-brand-dim disabled:opacity-40 py-2 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                      {replacing ? 'COMMITTING LEDGER CHANGES...' : 'COMMIT REAL INTELLIGENCE: PURGE MOCK DATA & INGEST ACTUAL LEADS'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spreadsheet Integration & Export Center */}
        <div className="bg-card-dark border border-border-dark rounded-sm p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-brand animate-pulse" />
              <h3 className="text-xs font-mono font-bold text-text-primary tracking-wider uppercase">
                Spreadsheet Integration & Share Exports (Excel / Sheets)
              </h3>
            </div>
            <button
              onClick={() => {
                setShowImportExport(!showImportExport);
                setImportMessage(null);
                setParsedLeads([]);
              }}
              className="text-[10px] font-mono text-brand border border-brand/20 px-2 py-0.5 rounded-sm hover:bg-brand-glow transition-all"
            >
              {showImportExport ? 'COLLAPSE [-]' : 'OPEN SPREADSHEET CONSOLE [+]'}
            </button>
          </div>

          {showImportExport && (
            <div className="space-y-4 pt-2 border-t border-border-dark/60">
              <p className="text-[11px] text-text-secondary leading-relaxed font-sans">
                Quickly load large volumes of prospect leads from Excel or Google Sheets, or compile formatted daily CSV reports to share with bosses, clients, or contractors.
              </p>

              {/* Console Tabs */}
              <div className="grid grid-cols-2 gap-2 border-b border-border-dark/40 pb-2">
                <button
                  onClick={() => setImportMethod('paste')}
                  className={`py-1.5 text-xs font-mono font-bold uppercase border-b-2 transition-all ${
                    importMethod === 'paste' 
                      ? 'border-brand text-brand bg-brand/5' 
                      : 'border-transparent text-text-dim hover:text-text-secondary'
                  }`}
                >
                  Bulk Import (120+ Leads)
                </button>
                <button
                  onClick={() => setImportMethod('file')}
                  className={`py-1.5 text-xs font-mono font-bold uppercase border-b-2 transition-all ${
                    importMethod === 'file' 
                      ? 'border-brand text-brand bg-brand/5' 
                      : 'border-transparent text-text-dim hover:text-text-secondary'
                  }`}
                >
                  Daily Output & Export Center
                </button>
              </div>

              {/* BULK IMPORT CONSOLE */}
              {importMethod === 'paste' && (
                <div className="space-y-4">
                  <div className="bg-card-inner border border-border-dark/60 p-3 rounded-sm space-y-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-text-dim block font-bold">
                      OPTION A: PASTE DIRECTLY FROM EXCEL / GOOGLE SHEETS
                    </span>
                    <p className="text-[11px] text-text-secondary">
                      Select rows inside your spreadsheet, press <kbd className="bg-card-dark px-1 py-0.5 rounded text-text-primary font-mono text-[10px]">Ctrl+C</kbd> (or Cmd+C), and paste them directly below. HAL will auto-map columns like Business Name, City, Phone, Email, Owner name, Niche, and Notes.
                    </p>
                    <textarea
                      value={pastedText}
                      onChange={(e) => {
                        setPastedText(e.target.value);
                        parseClipboardOrCSV(e.target.value);
                      }}
                      placeholder="Paste columns from your spreadsheet here...
Example:
My Plumbing Corp	Winnipeg	Plumbing Service	John Doe	john@myplumbing.com	204-555-0199	High urgency client
Next-Gen Waterproofing	Calgary	Waterproofing	Jane Smith	jane@nextgen.ca	403-555-1234	Looking for immediate leads"
                      rows={5}
                      className="w-full bg-card-dark border border-border-dark rounded-sm p-2 text-xs text-text-primary focus:outline-none focus:border-brand font-mono placeholder-text-dim"
                    />
                  </div>

                  <div className="bg-card-inner border border-border-dark/60 p-3 rounded-sm space-y-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-text-dim block font-bold">
                      OPTION B: UPLOAD A CSV SPREADSHEET FILE
                    </span>
                    <div className="relative border-2 border-dashed border-border-dark hover:border-brand/40 transition-colors rounded-sm p-4 flex flex-col items-center justify-center cursor-pointer bg-card-dark/30">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-6 h-6 text-text-dim mb-1.5" />
                      <p className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">Drag & drop or click to select CSV</p>
                      <p className="text-[10px] text-text-dim mt-0.5 font-sans">Requires comma or tab-separated structure</p>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {importMessage && (
                    <div className={`p-3 rounded-sm border text-xs leading-relaxed font-sans flex items-start gap-2 ${
                      importMessage.type === 'success' 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                        : importMessage.type === 'error' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-brand/10 border-brand/20 text-brand'
                    }`}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        {importMessage.text}
                      </div>
                    </div>
                  )}

                  {/* Parsed List Preview */}
                  {parsedLeads.length > 0 && (
                    <div className="space-y-3 pt-1 border-t border-border-dark/40">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-brand block font-bold">
                          Mapped Spreadsheet Rows Preview ({parsedLeads.length} parsed)
                        </span>
                        <button
                          onClick={() => {
                            setParsedLeads([]);
                            setPastedText('');
                            setImportMessage(null);
                          }}
                          className="text-[10px] font-mono text-red-400 hover:underline"
                        >
                          Clear Data
                        </button>
                      </div>

                      <div className="border border-border-dark/80 rounded-sm overflow-hidden bg-card-inner">
                        <div className="max-h-60 overflow-y-auto font-mono text-[10px]">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-card-dark border-b border-border-dark text-text-dim uppercase tracking-wider text-[8px] font-bold">
                                <th className="p-2 pl-3">Business Name</th>
                                <th className="p-2">City</th>
                                <th className="p-2">Niche Vertical</th>
                                <th className="p-2">Owner / Contact</th>
                                <th className="p-2">Email</th>
                                <th className="p-2">Phone</th>
                                <th className="p-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-dark/60">
                              {parsedLeads.slice(0, 10).map((pl, idx) => (
                                <tr key={idx} className={`hover:bg-card-dark/25 transition-colors ${!pl.isValid ? 'bg-red-500/5 text-red-400' : 'text-text-secondary'}`}>
                                  <td className="p-2 pl-3 font-bold text-text-primary max-w-[150px] truncate">
                                    {!pl.isValid && <span className="text-red-400 font-bold mr-1">[!]</span>}
                                    {pl.businessName || 'Unnamed Business'}
                                  </td>
                                  <td className="p-2">{pl.city}</td>
                                  <td className="p-2">{pl.serviceType}</td>
                                  <td className="p-2 truncate max-w-[100px]">{pl.ownerName || '-'}</td>
                                  <td className="p-2 truncate max-w-[120px]">{pl.email || '-'}</td>
                                  <td className="p-2">{pl.phone || '-'}</td>
                                  <td className="p-2">
                                    <span className={`px-1 rounded-sm uppercase text-[8px] font-bold ${pl.isValid ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                      {pl.isValid ? 'Valid' : 'Skip'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {parsedLeads.length > 10 && (
                            <p className="p-2 text-center text-[9px] text-text-dim border-t border-border-dark/40 bg-card-dark/20 italic">
                              Showing first 10 rows. There are {parsedLeads.length - 10} more rows mapped and ready for ingestion...
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleBulkImportSubmit}
                        disabled={importingLeads || parsedLeads.filter(l => l.isValid).length === 0}
                        className="w-full bg-brand text-black hover:bg-brand-dim disabled:opacity-40 py-2.5 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                        {importingLeads ? 'Ingesting prospects...' : `INGEST & WRITE ${parsedLeads.filter(l => l.isValid).length} PROSPECTS TO SECURED LEDGER`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* DAILY REPORTS & EXPORT CENTER */}
              {importMethod === 'file' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-card-inner border border-border-dark/60 p-3 rounded-sm">
                    <div>
                      <label className="block text-[9px] font-mono text-text-dim uppercase tracking-wider mb-1 font-bold">
                        Dataset to Export
                      </label>
                      <select
                        value={exportDataType}
                        onChange={(e: any) => setExportDataType(e.target.value)}
                        className="w-full bg-card-dark border border-border-dark rounded-sm p-2 text-xs text-text-secondary focus:outline-none focus:border-brand font-mono font-bold"
                      >
                        <option value="leads">Prospect Directory (Contact Ledger)</option>
                        <option value="events">Activity Log (Calls, Notes, Updates)</option>
                        <option value="revenue">Converted Deals & Closed Revenue Reports</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-mono text-text-dim uppercase tracking-wider mb-1 font-bold">
                        Date Filter Range
                      </label>
                      <select
                        value={exportDateFilter}
                        onChange={(e: any) => setExportDateFilter(e.target.value)}
                        className="w-full bg-card-dark border border-border-dark rounded-sm p-2 text-xs text-text-secondary focus:outline-none focus:border-brand font-mono font-bold"
                      >
                        <option value="today">Today's Records</option>
                        <option value="yesterday">Yesterday's Records</option>
                        <option value="week">Past 7 Days Output</option>
                        <option value="all">Full Ledger Directory (All-time)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-brand/5 border border-brand/10 rounded-sm">
                    <p className="text-[11px] leading-relaxed text-text-secondary font-sans">
                      💡 <strong>Boss & Contractor Friendly</strong>: The compiled report exports decrypted, ready-to-use CSV logs. They can be dragged directly into Microsoft Excel, Google Sheets, or shared in Slack/Teams. The document matches dates and timestamps automatically.
                    </p>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    disabled={exporting}
                    className="w-full bg-brand text-black hover:bg-brand-dim disabled:opacity-40 py-2.5 rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    {exporting ? 'Compiling secure CSV report...' : 'COMPILE AND DOWNLOAD EXCEL-COMPATIBLE CSV'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* View Switcher Segments */}
        <div className="flex border-b border-border-dim/40 gap-4 mb-1">
          <button
            onClick={() => setViewMode('list')}
            className={`pb-2 text-xs font-mono font-bold uppercase border-b-2 tracking-wider transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'border-brand text-brand'
                : 'border-transparent text-text-dim hover:text-text-secondary'
            }`}
          >
            🗂️ Ledger Directory List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`pb-2 text-xs font-mono font-bold uppercase border-b-2 tracking-wider transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'border-brand text-brand'
                : 'border-transparent text-text-dim hover:text-text-secondary'
            }`}
          >
            🗺️ Conquest Map View
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-card-dark p-4 border border-border-dark rounded-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-dim" />
            <input
              type="text"
              placeholder="Search by name, owner, or niche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card-inner border border-border-dark rounded-sm pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:border-brand font-sans placeholder-text-dim"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-card-inner border border-border-dark rounded-sm px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-brand font-mono font-bold"
            >
              <option value="all">ALL CITIES</option>
              {cities.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-card-inner border border-border-dark rounded-sm px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-brand font-mono font-bold"
            >
              <option value="all">ALL STATUSES</option>
              <option value="new">UNTOUCHED</option>
              <option value="contacted">FOLLOW UP</option>
              <option value="converted">CONVERTED</option>
              <option value="dead">DEAD</option>
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-brand text-black hover:bg-brand-dim px-3 py-2 rounded-sm font-mono text-xs flex items-center gap-1.5 font-bold shrink-0 uppercase tracking-wider transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Lead
            </button>
          </div>
        </div>

        {viewMode === 'map' ? (
          <div className="bg-card-dark border border-border-dark p-4.5 rounded-sm">
            <LeadMap 
              leads={mappedLeadsForMap} 
              center={mapCenter} 
              city={cityFilter === 'all' ? 'Winnipeg' : cityFilter} 
              selectedLeadId={selectedLead?.id}
              onSelectLead={(leadId) => {
                const found = leads.find(l => l.id === leadId);
                if (found) setSelectedLead(found);
              }}
            />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-card-dark border border-border-dark rounded-sm py-12 text-center text-text-dim font-mono text-xs uppercase tracking-wider">
            No prospects found matching selected filter criteria.
          </div>
        ) : (
          <div className="bg-card-dark border border-border-dark rounded-sm overflow-hidden">
            <div className="divide-y divide-border-dark/60">
              {filteredLeads.map((l) => {
                const isActive = selectedLead?.id === l.id;
                return (
                  <div
                    key={l.id}
                    onClick={() => {
                      setSelectedLead(l);
                      setTimeout(() => {
                        if (window.innerWidth < 1280 && detailsRef.current) {
                          detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 50);
                    }}
                    className={`p-4 flex justify-between items-center cursor-pointer transition-all ${
                      isActive ? 'bg-brand-glow border-l-2 border-brand' : 'hover:bg-card-inner'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-text-primary text-sm font-sans">{l.businessName}</h4>
                        <span className="text-[9px] font-mono bg-card-dark text-text-secondary px-2 py-0.5 rounded-sm border border-border-dark font-bold uppercase tracking-wider">
                          {l.serviceType}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-text-secondary font-mono">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-text-dim" /> {l.city}</span>
                        <span className="text-border-dark select-none hidden sm:inline">•</span>
                        <span>SCORE: <strong className="text-brand font-bold">{l.urgencyScore}</strong></span>
                        <span className="text-border-dark select-none hidden sm:inline">•</span>
                        <span>EST. LTV: <strong className="text-text-primary font-bold">${l.predictedLtvUsd}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Status pill */}
                      <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-sm uppercase tracking-wider ${
                        l.status === 'converted' ? 'bg-brand-glow text-brand border border-brand/30' :
                        l.status === 'contacted' ? 'bg-brand-glow text-brand border border-brand/20' :
                        l.status === 'dead' ? 'bg-card-inner text-text-dim border border-border-dark' :
                        'bg-brand-glow text-brand border border-brand/30'
                      }`}>
                        {l.status === 'new' ? 'untouched' : l.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-text-dim" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Details / Activity Panel */}
      <div ref={detailsRef} className="bg-card-dark border border-border-dark rounded-sm p-5 flex flex-col justify-between h-fit min-h-[500px]">
        {selectedLead ? (
          <div className="space-y-6">
            <div className="border-b border-border-dark pb-4">
              <h3 className="text-base font-bold text-text-primary mb-1 leading-normal font-sans">{selectedLead.businessName}</h3>
              <p className="text-[10px] text-text-secondary uppercase font-mono tracking-widest font-bold">{selectedLead.serviceType}</p>
            </div>

            <div className="space-y-3.5 text-xs text-text-secondary font-sans">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-text-dim" />
                <span>Owner: <strong className="text-text-primary">{selectedLead.ownerName || 'Unknown / Unspecified'}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-text-dim" />
                <span className="font-mono text-text-primary">{selectedLead.email || 'None provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-text-dim" />
                <span className="font-mono text-text-primary">{selectedLead.phone || 'None provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-text-dim" />
                <span className="text-text-primary">Location: {selectedLead.city}</span>
              </div>
              <div className="bg-card-inner p-3 rounded-sm border border-border-dark/60 text-text-secondary leading-relaxed font-mono text-[11px] mt-2">
                {selectedLead.notes || 'No profile notes captured.'}
              </div>
            </div>

            {/* Phase 2: Sourced Intelligence Audit Metrics */}
            {selectedLead.websiteUrl && (
              <div className="border-t border-border-dark/60 pt-4 space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block font-bold mb-2">Website & SEO Audit</span>
                  <div className="bg-card-inner p-3 rounded-sm border border-border-dark/60 space-y-2.5 font-mono text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Website URL:</span>
                      <a href={selectedLead.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline flex items-center gap-1 font-bold">
                        <Globe className="w-3 h-3" /> Visit Site
                      </a>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">SSL Certificate:</span>
                      <span className="flex items-center gap-1">
                        {selectedLead.sslStatus === 'secured' ? (
                          <span className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> SECURED
                          </span>
                        ) : (
                          <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> UNSECURED
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-text-secondary">Technical SEO:</span>
                        <span className={`font-bold ${selectedLead.seoScore! >= 75 ? 'text-green-400' : selectedLead.seoScore! >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {selectedLead.seoScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-card-dark h-1.5 rounded-full overflow-hidden border border-border-dark/40">
                        <div 
                          className={`h-full rounded-full ${selectedLead.seoScore! >= 75 ? 'bg-green-400' : selectedLead.seoScore! >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${selectedLead.seoScore}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-text-secondary">Page Performance:</span>
                        <span className={`font-bold ${selectedLead.performanceScore! >= 75 ? 'text-green-400' : selectedLead.performanceScore! >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {selectedLead.performanceScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-card-dark h-1.5 rounded-full overflow-hidden border border-border-dark/40">
                        <div 
                          className={`h-full rounded-full ${selectedLead.performanceScore! >= 75 ? 'bg-green-400' : selectedLead.performanceScore! >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${selectedLead.performanceScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block font-bold mb-2">Reputation Intelligence</span>
                  <div className="bg-card-inner p-3 rounded-sm border border-border-dark/60 space-y-2.5 font-mono text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-text-secondary">Google Business Rating:</span>
                      <span className="flex items-center gap-1 text-text-primary font-bold font-sans">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        {selectedLead.googleRating} ({selectedLead.reviewCount} reviews)
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-text-secondary">Customer Sentiment:</span>
                        <span className="text-brand font-bold">{Math.round(selectedLead.sentimentScore! * 100)}% POSITIVE</span>
                      </div>
                      <div className="w-full bg-card-dark h-1.5 rounded-full overflow-hidden border border-border-dark/40">
                        <div 
                          className="h-full bg-brand rounded-full"
                          style={{ width: `${selectedLead.sentimentScore! * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block font-bold mb-2">Communication & Outreach Angle</span>
                  <div className="bg-brand-glow p-3 rounded-sm border border-brand/20 text-[11px] font-mono text-text-primary leading-relaxed">
                    {selectedLead.outreachStrategy}
                  </div>
                </div>
              </div>
            )}

            {/* Operations buttons */}
            <div className="flex flex-col gap-2 border-t border-border-dark/60 pt-4 mt-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setReportLeadTarget(selectedLead);
                    setShowContractModal(true);
                  }}
                  className="bg-positive/15 text-positive border border-positive/40 hover:bg-positive/25 py-2 px-2 rounded-sm text-[11px] font-mono font-bold flex items-center justify-center gap-1 uppercase tracking-wider transition-colors cursor-pointer"
                  title="Generate Statement of Work & Retainer Agreement"
                >
                  <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">AGREEMENT</span>
                </button>
                <button
                  onClick={() => {
                    setReportLeadTarget(selectedLead);
                    setShowReportModal(true);
                  }}
                  className="bg-brand/10 text-brand border border-brand/30 hover:bg-brand/20 py-2 px-2 rounded-sm text-[11px] font-mono font-bold flex items-center justify-center gap-1 uppercase tracking-wider transition-colors cursor-pointer"
                  title="Generate white-label PDF pitch deck"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">DECK</span>
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/?audit=${selectedLead.id}`;
                    navigator.clipboard.writeText(url);
                    setCopiedAuditId(selectedLead.id);
                    setTimeout(() => setCopiedAuditId(null), 3000);
                  }}
                  className="bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25 py-2 px-2 rounded-sm text-[11px] font-mono font-bold flex items-center justify-center gap-1 uppercase tracking-wider transition-colors cursor-pointer"
                  title="Copy client-facing audit page link with interactive calculator & booking"
                >
                  {copiedAuditId === selectedLead.id ? <Check className="w-3.5 h-3.5 text-positive shrink-0" /> : <Share2 className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{copiedAuditId === selectedLead.id ? 'COPIED!' : 'AUDIT'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                {selectedLead.status !== 'converted' && (
                  <button
                    onClick={() => setShowRevenueModal(true)}
                    className="flex-1 bg-brand text-black hover:bg-brand-dim py-1.5 px-3 rounded-sm text-xs font-mono font-bold flex items-center justify-center gap-1 uppercase tracking-wider transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" /> Close Deal
                  </button>
                )}
                
                {selectedLead.status === 'new' && (
                  <button
                    onClick={() => updateLeadStatus(selectedLead, 'contacted')}
                    className="flex-1 bg-card-highlight text-text-secondary hover:text-text-primary py-1.5 px-3 rounded-sm text-xs font-mono border border-border-dark font-bold uppercase tracking-wider transition-colors"
                  >
                    Mark Engaged
                  </button>
                )}

                {selectedLead.status === 'contacted' && (
                  <button
                    onClick={() => updateLeadStatus(selectedLead, 'dead')}
                    className="flex-1 bg-card-inner text-text-dim hover:text-red-400 py-1.5 px-3 rounded-sm text-xs font-mono border border-border-dark font-bold uppercase tracking-wider transition-colors"
                  >
                    Mark Dead
                  </button>
                )}
              </div>
            </div>

            {/* Activity History */}
            <div className="border-t border-border-dark/60 pt-4 space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block font-bold">Activity Log</span>

              {events.length === 0 ? (
                <p className="text-[11px] font-mono text-text-dim uppercase tracking-wider">No operations logged for this contact profile.</p>
              ) : (
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {events.map(ev => (
                    <div key={ev.id} className="text-xs bg-card-inner p-2.5 rounded-sm border border-border-dark/40 space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-text-dim">
                        <span className="uppercase font-bold tracking-wide text-brand">{ev.type}</span>
                        <span className="font-bold">{new Date(ev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-text-secondary font-sans leading-relaxed text-[11px]">{ev.notes}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add activity comment */}
              <form onSubmit={handleAddEvent} className="space-y-2 pt-2">
                <textarea
                  placeholder="Record call summary, message notes..."
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  className="w-full bg-card-inner border border-border-dark rounded-sm p-2 text-xs text-text-primary focus:outline-none focus:border-brand font-sans h-14 resize-none placeholder-text-dim"
                />
                <div className="flex justify-between items-center">
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="bg-card-inner border border-border-dark rounded-sm px-2 py-1 text-[10px] font-mono text-text-secondary font-bold focus:outline-none focus:border-brand"
                  >
                    <option value="comment">COMMENT</option>
                    <option value="call">CALL</option>
                    <option value="email_sent">EMAIL SENT</option>
                    <option value="meeting">MEETING</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-card-highlight text-text-secondary hover:text-text-primary border border-border-dark px-3 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
                  >
                    Add Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-text-dim space-y-3">
            <MessageSquare className="w-8 h-8 text-border-dark" />
            <p className="font-mono text-[10px] uppercase tracking-wider max-w-[240px] leading-relaxed">Select a prospect from the left column to view operational metrics and audit logs.</p>
          </div>
        )}
      </div>

      {/* CREATE LEAD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999]" style={{ isolation: 'isolate' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card-dark border border-border-dark rounded-sm max-w-lg w-full p-6 space-y-4 shadow-2xl relative z-10"
          >
            <div className="flex justify-between items-center border-b border-border-dark pb-3">
              <h3 className="text-xs font-mono font-bold text-text-primary tracking-widest flex items-center gap-2 uppercase">
                <Sparkles className="w-4 h-4 text-brand" /> Capture Prospect Metadata
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-text-dim hover:text-text-primary font-mono text-xs font-bold"
              >
                CLOSE [X]
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-1 font-bold">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={`e.g., Apex ${activeCity} ${activeNiche}`}
                    className="w-full bg-card-inner border border-border-dark rounded-sm p-2 focus:outline-none focus:border-brand text-text-primary placeholder-text-dim"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-1 font-bold">Owner Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g., Brett Johnson"
                    className="w-full bg-card-inner border border-border-dark rounded-sm p-2 focus:outline-none focus:border-brand text-text-primary placeholder-text-dim"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-1 font-bold">Service Type *</label>
                  <input
                    type="text"
                    required
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    placeholder={`e.g., ${activeNiche}`}
                    className="w-full bg-card-inner border border-border-dark rounded-sm p-2 focus:outline-none focus:border-brand text-text-primary placeholder-text-dim"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-1 font-bold">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., info@kingstree.ca"
                    className="w-full bg-card-inner border border-border-dark rounded-sm p-2 focus:outline-none focus:border-brand text-text-primary placeholder-text-dim"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-1 font-bold">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., 555-019-2834"
                    className="w-full bg-card-inner border border-border-dark rounded-sm p-2 focus:outline-none focus:border-brand text-text-primary placeholder-text-dim"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-1 font-bold">Operating City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Winnipeg"
                    className="w-full bg-card-inner border border-border-dark rounded-sm p-2 focus:outline-none focus:border-brand text-text-primary placeholder-text-dim"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-1 font-bold">Internal Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Capture initial audit observations, ad coverage gaps..."
                    className="w-full bg-card-inner border border-border-dark rounded-sm p-2 focus:outline-none focus:border-brand text-text-primary h-20 resize-none placeholder-text-dim font-mono text-[11px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand text-black font-bold hover:bg-brand-dim py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Save New Lead Profile
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* REVENUE CONVERSION MODAL */}
      {showRevenueModal && selectedLead && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999]" style={{ isolation: 'isolate' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card-dark border border-border-dark rounded-sm max-w-sm w-full p-6 space-y-4 shadow-2xl relative z-10"
          >
            <div className="flex justify-between items-center border-b border-border-dark pb-3">
              <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-widest">
                Record Closed Conversion
              </h3>
              <button 
                onClick={() => setShowRevenueModal(false)}
                className="text-text-dim hover:text-text-primary font-mono text-xs font-bold"
              >
                [X]
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-normal">
              Record real transactional revenue realized on lead conversion for <strong>{selectedLead.businessName}</strong>. This updates status to Converted and calibrates LTV multiplier.
            </p>

            <form onSubmit={handleRecordRevenue} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-1 font-bold">Conversion Revenue (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-text-dim font-mono text-xs">$</span>
                  <input
                    type="number"
                    required
                    value={revenueAmount}
                    onChange={(e) => setRevenueAmount(e.target.value)}
                    placeholder="3500"
                    className="w-full bg-card-inner border border-border-dark rounded-sm py-2 pl-7 pr-3 focus:outline-none focus:border-brand text-text-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-1 font-bold">Fulfillment Channel</label>
                <select
                  value={revenueSource}
                  onChange={(e) => setRevenueSource(e.target.value)}
                  className="w-full bg-card-inner border border-border-dark rounded-sm p-2 focus:outline-none focus:border-brand text-text-secondary font-mono font-bold"
                >
                  <option value="manual_entry">MANUAL LEDGER ENTRY</option>
                  <option value="invoice_sync">INVOICE SYNCHRONIZATION</option>
                  <option value="stripe_webhook">STRIPE AUTOMATED WEBHOOK</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand text-black font-bold hover:bg-brand-dim py-2 rounded-sm font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Record Transactional Conversion
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* White Label Pitch Deck & Audit Report Modal */}
      {showReportModal && (
        <WhiteLabelReportModal
          isOpen={showReportModal}
          lead={reportLeadTarget}
          onClose={() => {
            setShowReportModal(false);
            setReportLeadTarget(null);
          }}
        />
      )}

      {/* Statement of Work Agreement Modal */}
      {showContractModal && (
        <ContractModal
          isOpen={showContractModal}
          lead={reportLeadTarget}
          onClose={() => {
            setShowContractModal(false);
            setReportLeadTarget(null);
          }}
        />
      )}
    </div>
  </div>
);
}
