export interface DocumentTemplate {
  id: string;
  title: string;
  category: 'proposals' | 'audits' | 'agreements' | 'reviews' | 'blank';
  description: string;
  content: string;
  themeId: string;
  styleId: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'commercial-sla-proposal',
    title: 'Commercial Contractor SLA & Retainer Proposal',
    category: 'proposals',
    description: 'Guaranteed inbound lead acquisition and high-speed emergency dispatch SLA.',
    themeId: 'modern-executive',
    styleId: 'shaded',
    content: `
      <div class="doc-cover-block" style="border-bottom: 2px solid #2563eb; padding-bottom: 24px; margin-bottom: 32px;">
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin: 0 0 6px 0;">CONFIDENTIAL COMMERCIAL PROPOSAL</p>
        <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.02em;">High-Yield Inbound Lead Acquisition SLA</h1>
        <p style="font-size: 15px; color: #475569; margin: 0;">Prepared for <strong>{{business_name}}</strong> &bull; Attn: <strong>{{owner_name}}</strong> &bull; Location: <strong>{{city}}</strong></p>
      </div>

      <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 24px;">1. Executive Summary & Objective</h2>
      <p style="font-size: 13px; line-height: 1.6; color: #334155;">
        This Service Level Agreement (SLA) outlines the deployment of an autonomous lead acquisition and emergency inbound dispatch pipeline tailored specifically for <strong>{{business_name}}</strong> in <strong>{{city}}</strong>. Current diagnostic analysis indicates high local search demand with competitors currently capitalizing on latency inefficiencies.
      </p>

      <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 28px;">2. Territory Diagnostic Snapshot</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
            <th style="padding: 8px 12px; font-weight: 600; color: #475569;">Diagnostic Audit Item</th>
            <th style="padding: 8px 12px; font-weight: 600; color: #475569;">Verified Status</th>
            <th style="padding: 8px 12px; font-weight: 600; color: #475569;">Optimization Target</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 12px; font-weight: 500;">Target Trade Niche</td>
            <td style="padding: 8px 12px; color: #0f172a;">{{trade_niche}}</td>
            <td style="padding: 8px 12px; color: #2563eb;">Primary Local Map Pack Dominance</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9; background-color: #fafafa;">
            <td style="padding: 8px 12px; font-weight: 500;">Security & SSL Status</td>
            <td style="padding: 8px 12px; color: #e11d48; font-weight: 600;">{{ssl_status}}</td>
            <td style="padding: 8px 12px; color: #059669;">Zero-Trust 256-Bit TLS Enforcement</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 12px; font-weight: 500;">Mobile Loading Latency (LCP)</td>
            <td style="padding: 8px 12px; color: #d97706; font-weight: 600;">{{lcp_speed}}</td>
            <td style="padding: 8px 12px; color: #059669;">Sub-1.2s Edge CDN Cache</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9; background-color: #fafafa;">
            <td style="padding: 8px 12px; font-weight: 500;">Inbound Lead Routing</td>
            <td style="padding: 8px 12px;">Manual Voicemail / Email</td>
            <td style="padding: 8px 12px; color: #059669;">Instant SMS & Calendar Push &lt; 90s</td>
          </tr>
        </tbody>
      </table>

      <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 28px;">3. Service Retainer & Performance Terms</h2>
      <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 16px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">Recommended Monthly SLA: <span style="color: #2563eb;">\${{monthly_sla}} / month</span></p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Includes full management of local ad auctions, emergency booking landing pages, and guaranteed lead delivery pacing.</p>
      </div>

      <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 32px;">4. Authorized Signatures</h2>
      <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px;">
        <div style="width: 45%; border-top: 1px solid #94a3b8; padding-top: 8px;">
          <p style="margin: 0; font-size: 12px; font-weight: 600; color: #0f172a;">{{business_name}}</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Authorized Signer: {{owner_name}}</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">Date: ____________________</p>
        </div>
        <div style="width: 45%; border-top: 1px solid #94a3b8; padding-top: 8px;">
          <p style="margin: 0; font-size: 12px; font-weight: 600; color: #0f172a;">HAL Operating Intelligence</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Enterprise Systems Director</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">Date: {{date_today}}</p>
        </div>
      </div>
    `
  },
  {
    id: 'technical-seo-speed-audit',
    title: 'Technical SEO & PageSpeed Intelligence Audit',
    category: 'audits',
    description: 'Detailed competitor breakdown, Core Web Vitals, and SSL encryption verification.',
    themeId: 'tech-clean',
    styleId: 'technical',
    content: `
      <div style="border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 24px;">
        <p style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; margin: 0 0 4px 0;">LOCAL TERRITORY AUDIT REPORT</p>
        <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0;">Comprehensive Technical Audit & Vulnerability Scorecard</h1>
        <p style="font-size: 13px; color: #475569; margin: 6px 0 0 0;">Target Entity: <strong>{{business_name}}</strong> &bull; Target Market: <strong>{{city}}</strong></p>
      </div>

      <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">1. Core Web Vitals & Conversion Drag</h2>
      <p style="font-size: 13px; color: #334155; line-height: 1.6;">
        Google search rankings heavily penalize commercial websites with Largest Contentful Paint (LCP) exceeding 2.5 seconds. For contractors in <strong>{{city}}</strong>, high latency translates directly into lost phone calls from emergency homeowners.
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 18px 0;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; background-color: #f8fafc;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Current LCP</div>
          <div style="font-size: 22px; font-weight: 800; color: #dc2626; margin: 4px 0;">{{lcp_speed}}</div>
          <div style="font-size: 11px; color: #94a3b8;">Poor Mobile Performance</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; background-color: #f8fafc;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">SSL Security</div>
          <div style="font-size: 20px; font-weight: 800; color: #d97706; margin: 4px 0;">{{ssl_status}}</div>
          <div style="font-size: 11px; color: #94a3b8;">Browser Warning Flag</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; background-color: #f8fafc;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Missed Revenue/Mo</div>
          <div style="font-size: 22px; font-weight: 800; color: #059669; margin: 4px 0;">+$8,400</div>
          <div style="font-size: 11px; color: #94a3b8;">Recoverable via Speed Fix</div>
        </div>
      </div>

      <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 28px;">2. Immediate Remediation Roadmap</h2>
      <ol style="font-size: 13px; line-height: 1.7; color: #334155; padding-left: 20px;">
        <li><strong>Provision High-Grade TLS Certificate:</strong> Eliminate browser security warnings and improve Google Trust rank.</li>
        <li><strong>Deploy Static Asset Caching:</strong> Pre-compress critical CSS/JS to achieve sub-second LCP.</li>
        <li><strong>One-Tap Tap-To-Call Dispatch:</strong> Add sticky high-contrast dispatch buttons for smartphone visitors.</li>
      </ol>
    `
  },
  {
    id: 'subcontractor-master-agreement',
    title: 'Master Subcontractor Services Agreement',
    category: 'agreements',
    description: 'Standard independent trade agreement with scope, payment milestones, and liability terms.',
    themeId: 'classic-serif',
    styleId: 'classic',
    content: `
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 28px;">
        <h1 style="font-size: 24px; font-weight: 800; text-transform: uppercase; margin: 0;">Independent Subcontractor Agreement</h1>
        <p style="font-size: 12px; color: #475569; margin: 6px 0 0 0;">Binding Commercial Agreement &bull; Jurisdiction: <strong>{{city}}</strong></p>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #1e293b;">
        This Independent Subcontractor Agreement is entered into on <strong>{{date_today}}</strong>, by and between <strong>HAL Enterprise Operating System</strong> ("General Contractor"), and <strong>{{business_name}}</strong> ("Subcontractor"), with principal offices located in <strong>{{city}}</strong>.
      </p>

      <h2 style="font-size: 16px; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px;">Section 1: Scope of Work & Deliverables</h2>
      <p style="font-size: 13px; line-height: 1.6; color: #334155;">
        Subcontractor agrees to perform commercial trade fulfillment in accordance with local safety standards, building codes, and client SLAs for projects dispatched in the <strong>{{trade_niche}}</strong> sector.
      </p>

      <h2 style="font-size: 16px; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px;">Section 2: Compensation & Invoicing</h2>
      <p style="font-size: 13px; line-height: 1.6; color: #334155;">
        Payment shall be remitted bi-weekly upon receipt of verified customer completion sign-offs. Retainage of 5% may be held pending final inspection.
      </p>

      <div style="margin-top: 50px; display: flex; justify-content: space-between;">
        <div style="width: 45%;">
          <div style="border-bottom: 1px solid #000; padding-bottom: 24px;"></div>
          <p style="font-size: 12px; font-weight: 600; margin: 4px 0 0 0;">{{business_name}} (Subcontractor)</p>
          <p style="font-size: 11px; color: #64748b; margin: 0;">Name: {{owner_name}}</p>
        </div>
        <div style="width: 45%;">
          <div style="border-bottom: 1px solid #000; padding-bottom: 24px;"></div>
          <p style="font-size: 12px; font-weight: 600; margin: 4px 0 0 0;">HAL Business Operations (Contractor)</p>
          <p style="font-size: 11px; color: #64748b; margin: 0;">Date: {{date_today}}</p>
        </div>
      </div>
    `
  },
  {
    id: 'blank-executive-document',
    title: 'Blank Canvas Document',
    category: 'blank',
    description: 'Clean blank sheet with standard margins, ready for bespoke drafting and formatting.',
    themeId: 'modern-executive',
    styleId: 'clean',
    content: `
      <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">Untitled Document</h1>
      <p style="font-size: 13px; line-height: 1.6; color: #334155;">
        Start typing your business document here or use the Ribbon toolbar above to insert tables, graphics, mail merge variables, or choose a design theme.
      </p>
    `
  }
];

export const THEME_PRESETS = [
  {
    id: 'modern-executive',
    name: 'Modern Executive',
    fontFamily: 'Inter, sans-serif',
    headingFont: 'Inter, sans-serif',
    primaryColor: '#0f172a',
    accentColor: '#2563eb',
    borderColor: '#e2e8f0',
    headingStyle: 'clean' as const
  },
  {
    id: 'tech-clean',
    name: 'Tech & Diagnostic',
    fontFamily: 'system-ui, sans-serif',
    headingFont: 'JetBrains Mono, monospace',
    primaryColor: '#0c4a6e',
    accentColor: '#0284c7',
    borderColor: '#cbd5e1',
    headingStyle: 'shaded' as const
  },
  {
    id: 'classic-serif',
    name: 'Classic Legal Serif',
    fontFamily: 'Georgia, serif',
    headingFont: 'Georgia, serif',
    primaryColor: '#1c1917',
    accentColor: '#78350f',
    borderColor: '#d6d3d1',
    headingStyle: 'classic' as const
  },
  {
    id: 'bold-slate',
    name: 'Bold Slate & Industrial',
    fontFamily: 'Inter, sans-serif',
    headingFont: 'Inter, sans-serif',
    primaryColor: '#1e293b',
    accentColor: '#059669',
    borderColor: '#cbd5e1',
    headingStyle: 'boxed' as const
  }
];

export const FORMATTING_STYLE_PRESETS = [
  {
    id: 'clean',
    name: 'Clean Minimalist',
    titleClass: 'text-2xl font-bold tracking-tight text-slate-900 border-none',
    h1Class: 'text-xl font-bold text-slate-900 mt-6 mb-3',
    h2Class: 'text-lg font-semibold text-slate-800 mt-5 mb-2',
    bodyClass: 'text-sm leading-relaxed text-slate-700',
    borderAccent: 'border-slate-200'
  },
  {
    id: 'shaded',
    name: 'Executive Shaded',
    titleClass: 'text-3xl font-extrabold tracking-tight text-slate-900 pb-3 border-b-2 border-blue-600',
    h1Class: 'text-xl font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded mt-6 mb-3',
    h2Class: 'text-lg font-semibold text-blue-900 border-b border-slate-200 pb-1 mt-5 mb-2',
    bodyClass: 'text-sm leading-relaxed text-slate-700',
    borderAccent: 'border-blue-500'
  },
  {
    id: 'technical',
    name: 'Technical Diagnostic',
    titleClass: 'text-2xl font-black font-mono tracking-tight text-sky-950 pb-2 border-b-2 border-sky-500',
    h1Class: 'text-lg font-bold font-mono text-sky-900 border-l-4 border-sky-600 pl-2 mt-6 mb-3',
    h2Class: 'text-base font-semibold font-mono text-slate-800 mt-4 mb-2',
    bodyClass: 'text-sm font-sans leading-relaxed text-slate-700',
    borderAccent: 'border-sky-500'
  },
  {
    id: 'classic',
    name: 'Classic Centered',
    titleClass: 'text-2xl font-serif font-bold text-center tracking-wide text-neutral-950 uppercase border-b border-neutral-900 pb-4',
    h1Class: 'text-lg font-serif font-bold text-neutral-900 uppercase tracking-wide mt-6 mb-3 border-b border-neutral-300 pb-1',
    h2Class: 'text-base font-serif font-semibold text-neutral-800 italic mt-4 mb-2',
    bodyClass: 'text-sm font-serif leading-relaxed text-neutral-800',
    borderAccent: 'border-neutral-800'
  }
];
