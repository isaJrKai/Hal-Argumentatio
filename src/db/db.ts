import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Types for our Database models
export interface Contractor {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'user';
  marketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  contractorId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  contractorId: string;
  businessName: string;
  ownerName?: string;
  emailEncrypted?: string; // Encrypted email
  phoneEncrypted?: string; // Encrypted phone
  city: string;
  serviceType: string;
  source: string;
  status: 'new' | 'contacted' | 'converted' | 'dead';
  urgencyScore: number;
  predictedLtvUsd: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Unencrypted fields (decrypted in memory, never stored plaintext)
  email?: string;
  phone?: string;

  // Phase 2: Sourced Real Business Intelligence Properties
  websiteUrl?: string;
  seoScore?: number;
  performanceScore?: number;
  sslStatus?: 'secured' | 'missing';
  googleRating?: number;
  reviewCount?: number;
  sentimentScore?: number;
  outreachStrategy?: string;
}

export interface LeadEvent {
  id: string;
  leadId: string;
  type: string;
  notes?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  contractorId: string;
  marketId?: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceSnapshot {
  id: string;
  campaignId: string;
  date: string;
  leads: number;
  spend: number;
  cpl: number;
  clicks: number;
  impressions: number;
  createdAt: string;
}

export interface Revenue {
  id: string;
  leadId: string;
  contractorId: string;
  amountUsd: number;
  source: string;
  recordedAt: string;
}

export interface Forecast {
  id: string;
  contractorId: string;
  metric: string; // lead_volume | cpl | conversions | revenue
  predicted: number;
  confidenceScore: number;
  targetDate: string;
  modelVersion: string;
  evaluated: boolean;
  assumptions?: string;
  createdAt: string;
}

export interface PredictionOutcome {
  id: string;
  forecastId: string;
  predicted: number;
  actual: number;
  deviation: number;
  evaluatedAt: string;
}

export interface LearningInsight {
  id: string;
  category: string;
  insight: string;
  confidence: number;
  sourceForecastId?: string;
  observedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Recommendation {
  id: string;
  contractorId: string;
  category: string;
  action: string;
  rationale: string;
  confidence: number;
  evidence?: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'evaluated';
  outcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  category: string;
  title: string;
  description: string;
  evidence?: string;
  confidence: number;
  timesObserved: number;
  lastObserved: string;
  createdAt: string;
}

export interface OutcomeRecord {
  id: string;
  actionType: string;
  actionDetails: string;
  predictedResult?: string;
  actualResult?: string;
  delta?: number;
  evaluatedAt?: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  contractorId: string;
  keyHash: string; // SHA-256 hash of API key
  prefix: string; // hlbz_ + first 8 characters of key for display
  name: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  contractorId: string;
  type: string; // info | success | warning | alert
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SystemAuditLog {
  id: string;
  contractorId?: string;
  action: string;
  ipAddress?: string;
  details?: string;
  createdAt: string;
}

// ─── HAL Roadmap Phase 1 (Foundation): Cryptographic Structured Ledger ───────
export interface StructuredLedgerEntry {
  id: string;
  contractorId: string;
  sequenceNumber: number;
  eventType: 
    | 'lead_captured' 
    | 'crm_transition' 
    | 'recommendation_proposed' 
    | 'recommendation_approved' 
    | 'recommendation_executed' 
    | 'conversion_outbox' 
    | 'revenue_recognized' 
    | 'security_event' 
    | 'pipeline_mutation'
    | 'evidence_gathered'
    | 'stage_transition'
    | 'phase2_verification_audit'
    | 'competitor_audit_completed'
    | 'lead_harvested'
    | 'territory_harvest_completed'
    | 'phase3_verification_audit'
    | 'phase3_sequence_triggered'
    | 'phase3_outbox_processed'
    | 'phase3_live_dispatch'
    | 'phase3_scheduler_executed'
    | 'phase4_verification_audit'
    | 'phase4_consensus_synthesized'
    | 'phase4_weights_recalibrated'
    | 'phase4_arbitrage_executed'
    | 'phase5_verification_audit'
    | 'phase5_brain_synced'
    | 'phase5_regions_federated'
    | 'phase5_ontology_propagated'
    | 'genesis_block';
  entityType: string;
  entityId: string;
  actor: string;
  payloadHash: string;
  prevHash: string;
  entryHash: string;
  details?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SchedulerJob {
  id: string;
  job: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: string;
  createdAt: string;
}

export interface ChatMessageDb {
  id: string;
  contractorId: string;
  role: 'user' | 'model';
  text: string;
  enableGrounding: boolean;
  sources?: Array<{ title: string; uri: string }>;
  timestamp: string;
  createdAt: string;
}

export interface MissionStep {
  id: string;
  missionId: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  updatedAt: string;
}

export interface Mission {
  id: string;
  contractorId: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  city: string;
  niche: string;
  createdAt: string;
  updatedAt: string;
  steps: MissionStep[];
}

export interface WinLossRecordDb {
  id: string;
  contractorId: string;
  leadId: string;
  businessName: string;
  city: string;
  niche: string;
  outcome: 'won' | 'lost';
  closedValueUsd: number;
  primaryReason: string;
  keyLesson: string;
  outreachChannelUsed: string;
  closedAt: string;
}

export interface OutreachSequenceDb {
  id: string;
  contractorId: string;
  name: string;
  niche?: string;
  steps: Array<{
    day: number;
    channel: 'email' | 'sms' | 'call' | 'linkedin';
    title: string;
    template: string;
    purpose: string;
  }>;
  createdAt: string;
}

export interface ClientMilestoneDb {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  deliverablesProof?: string;
}

export interface ClientAssetDb {
  id: string;
  name: string;
  category: 'logo' | 'brand_guidelines' | 'domain_access' | 'analytics_access' | 'photos' | 'copy';
  status: 'received' | 'pending' | 'verified';
  uploadedAt?: string;
  notes?: string;
}

export interface ClientProjectDb {
  id: string;
  contractorId: string;
  leadId: string;
  clientName: string;
  businessName: string;
  city: string;
  serviceType: string;
  packageTier: 'Growth' | 'Dominance' | 'Enterprise';
  monthlyRetainerUsd: number;
  startDate: string;
  status: 'onboarding' | 'active_delivery' | 'review' | 'completed';
  initialAuditScore: number;
  currentScore: number;
  targetScore: number;
  milestones: ClientMilestoneDb[];
  assets: ClientAssetDb[];
  notes?: string;
  portalAccessToken: string;
  createdAt: string;
  updatedAt: string;
}

// Memory Database structure
interface DBStructure {
  contractors: Contractor[];
  sessions: Session[];
  passwordResets: PasswordResetToken[];
  leads: Lead[];
  leadEvents: LeadEvent[];
  campaigns: Campaign[];
  performanceSnapshots: PerformanceSnapshot[];
  revenues: Revenue[];
  forecasts: Forecast[];
  predictionOutcomes: PredictionOutcome[];
  learningInsights: LearningInsight[];
  recommendations: Recommendation[];
  lessons: Lesson[];
  outcomeRecords: OutcomeRecord[];
  apiKeys: ApiKey[];
  notifications: Notification[];
  systemAuditLogs: SystemAuditLog[];
  structuredLedger?: StructuredLedgerEntry[];
  schedulerJobs: SchedulerJob[];
  missions: Mission[];
  chatMessages?: ChatMessageDb[];
  winLossRecords?: WinLossRecordDb[];
  outreachSequences?: OutreachSequenceDb[];
  clientProjects?: ClientProjectDb[];
  connectorCredentials?: Record<string, Record<string, string>>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Helper to get Lead encryption key
function getEncryptionKey(): Buffer {
  const b64 = process.env.LEAD_ENCRYPTION_KEY_B64 || 'Z01Xek1XOHpNVGczTnpBek1EUTFORFUxTkRVMU5EVTE=';
  let key = Buffer.from(b64, 'base64');
  if (key.length !== 32) {
    key = crypto.createHash('sha256').update(key).digest();
  }
  return key;
}

// AES-256-GCM encryption - strictly fail-closed
export function encrypt(text: string): string {
  if (!text) return '';
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('PII Encryption failure: aborting to prevent plaintext data leakage.');
  }
}

// AES-256-GCM decryption with a specific key
function decryptWithKey(encryptedText: string, key: Buffer): string | null {
  try {
    if (!encryptedText || !encryptedText.includes(':')) return null;
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

// AES-256-GCM decryption - strictly fail-closed
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  if (!encryptedText.includes(':')) return '';

  // 1. Try with the active derived encryption key
  try {
    const key = getEncryptionKey();
    const result = decryptWithKey(encryptedText, key);
    if (result !== null) return result;
  } catch (err) {}

  // 2. Try with the default base64 key raw (32 bytes)
  try {
    const defaultB64 = 'Z01Xek1XOHpNVGczTnpBek1EUTFORFUxTkRVMU5EVTE=';
    const rawDefaultKey = Buffer.from(defaultB64, 'base64');
    const result = decryptWithKey(encryptedText, rawDefaultKey);
    if (result !== null) return result;
  } catch (err) {}

  // 3. Try with the current env key unhashed if it was 32 bytes
  try {
    const b64 = process.env.LEAD_ENCRYPTION_KEY_B64;
    if (b64) {
      const rawEnvKey = Buffer.from(b64, 'base64');
      if (rawEnvKey.length === 32) {
        const result = decryptWithKey(encryptedText, rawEnvKey);
        if (result !== null) return result;
      }
    }
  } catch (err) {}

  // 4. Try with default key hashed
  try {
    const defaultB64 = 'Z01Xek1XOHpNVGczTnpBek1EUTFORFUxTkRVMU5EVTE=';
    const defaultKeyHashed = crypto.createHash('sha256').update(Buffer.from(defaultB64, 'base64')).digest();
    const result = decryptWithKey(encryptedText, defaultKeyHashed);
    if (result !== null) return result;
  } catch (err) {}

  // Fail closed - never return raw ciphertext or corrupted data
  return '';
}

class Database {
  private data: DBStructure = {
    contractors: [],
    sessions: [],
    passwordResets: [],
    leads: [],
    leadEvents: [],
    campaigns: [],
    performanceSnapshots: [],
    revenues: [],
    forecasts: [],
    predictionOutcomes: [],
    learningInsights: [],
    recommendations: [],
    lessons: [],
    outcomeRecords: [],
    apiKeys: [],
    notifications: [],
    systemAuditLogs: [],
    structuredLedger: [],
    schedulerJobs: [],
    missions: [],
    chatMessages: [],
    connectorCredentials: {}
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // Load with proper fallbacks
        this.data = { ...this.data, ...parsed };
        console.log('Database loaded successfully with', this.data.leads.length, 'leads.');
      } catch (e) {
        console.error('Error loading database, resetting...', e);
        this.save();
      }
    } else {
      this.save();
    }

    // Ensure Phase 1 Genesis Block in Structured Ledger
    if (!this.data.structuredLedger || this.data.structuredLedger.length === 0) {
      this.data.structuredLedger = [];
      this.recordLedgerEntry({
        contractorId: 'system_genesis',
        eventType: 'genesis_block',
        entityType: 'system_architecture',
        entityId: 'hal_foundation_phase1',
        actor: 'HAL Constitution Engine',
        details: 'Genesis Block initialized for HAL Roadmap Phase 1: Foundation (Structured Ledger, Secure Storage, Basic Pipeline)',
        metadata: { version: '1.0.0', phase: 'Foundation', algorithm: 'SHA-256' }
      });
    }

    if (this.data.contractors.length === 0) {
      this.seed();
    } else {
      // Ensure primary admin and Isaac accounts are present
      if (!this.data.contractors.some(c => c.email.toLowerCase() === 'kaisoisaac@gmail.com')) {
        const now = new Date().toISOString();
        this.data.contractors.push({
          id: 'con_isaac_seed',
          email: 'kaisoisaac@gmail.com',
          passwordHash: hashPassword('admin123'),
          name: 'Isaac',
          role: 'admin',
          marketId: 'market_winnipeg_calgary',
          createdAt: now,
          updatedAt: now
        });
        this.save();
      }
    }
  }

  private seed() {
    console.log('Seeding database with default HALBiz data...');
    const now = new Date().toISOString();
    
    // 1. Create admin contractor
    const adminId = 'con_admin_seed';
    const admin: Contractor = {
      id: adminId,
      email: 'admin@kaislead.com',
      passwordHash: hashPassword('admin123'),
      name: 'Isaac (Admin)',
      role: 'admin',
      marketId: 'market_winnipeg_calgary',
      createdAt: now,
      updatedAt: now
    };
    this.data.contractors.push(admin);

    // 2. Create Prospects / Leads list
    const defaultCity = "Winnipeg";
    const defaultNiche = "trade services";

    const seedProspects = [
      { num: 3, name: "Apex Premier Contracting", city: "Winnipeg", email: "contact@apexpremier.com", owner: "Matthew Miller", niche: "custom building", status: "new" },
      { num: 5, name: "Horizon Trade Services", city: "Winnipeg", email: "contact@horizontrades.ca", owner: "Sarah Jenkins", niche: "general contracting", status: "new" },
      { num: 8, name: "Guardian Mechanical & Power", city: "Landmark", email: "info@guardianpower.com", owner: "Dylan Foster", niche: "electrical & solar", status: "new" },
      { num: 9, name: "River Park Construction", city: "Winnipeg", email: "info@riverparkbuild.com", owner: "Owner", niche: "custom building", status: "new" },
      { num: 11, name: "Polar Climate & Mechanical", city: "Winkler", email: "gord@polarclimate.ca", owner: "Gord", niche: "hvac & mechanical", status: "new" },
      { num: 12, name: "Prairie Mowing & Turf Co.", city: "Morris", email: "chad@prairiemow.ca", owner: "Chad", niche: "lawn care", status: "new" },
      { num: 13, name: "Grand Slam Builders", city: "Brandon", email: "info@grandslambuilders.com", owner: "Owner", niche: "custom building", status: "new" },
      { num: 17, name: "Arbeau Contracting Solutions", city: "Fredericton", email: "alparbeau@gmail.com", owner: "Adam Arbeau", niche: "trade services", status: "new" },
      { num: 18, name: "Phil Dixon Exterior Pro", city: "Fredericton", email: "phil.j.dixon@gmail.com", owner: "Phil Dixon", niche: "roofing & siding", status: "new" },
      { num: 19, name: "Grant West Mechanical", city: "Fredericton", email: "grantwest@gmail.com", owner: "Grant West", niche: "hvac & mechanical", status: "new" },
      { num: 22, name: "Wise Cracks Construction", city: "Fredericton", email: "info@wisecracks.com", owner: "Owner", niche: "foundation repair", status: "new" },
      { num: 23, name: "WINMAR Territory Services", city: "Fredericton", email: "fredericton@winmar.ca", owner: "Owner", niche: "restoration", status: "new" },
      { num: 34, name: "Kingstree Builders", city: "Sherwood Park", email: "brett@kingstreebuilders.ca", owner: "Brett Kingstree", niche: "custom building", status: "new" },
      { num: 35, name: "The Gentlemen Pros Calgary", city: "Calgary", email: "brham@tgpros.ca", owner: "Brham Trim", niche: "home services", status: "new" },
      { num: 43, name: "Nordic Auto Logistics", city: "Winnipeg", email: "dennisbaldwinson@gmail.com", owner: "Dennis Baldwin", niche: "auto detailing", status: "new" },
      { num: 45, name: "Aloha Turf & Landscape", city: "Winnipeg", email: "JDejesus@alohaturf.ca", owner: "Angel Sanchez", niche: "lawn care", status: "new" },
      { num: 48, name: "Northern Concrete Repair", city: "Fredericton", email: "joel.smith@NorthernConcreteRepair.ca", owner: "Joel Smith", niche: "concrete & masonry", status: "new" },
      { num: 2, name: "ILV Contracting Group", city: "Winnipeg", email: "ilias@ilvcontracting.com", owner: "Ilias", niche: "general contracting", status: "contacted" },
      { num: 4, name: "Worthy Pick Builders", city: "Winnipeg", email: "info@worthypick.ca", owner: "Owner", niche: "custom building", status: "contacted" },
      { num: 6, name: "Next-Gen Power & Solar", city: "Winnipeg", email: "info@nextgenpower.ca", owner: "Owner", niche: "electrical & solar", status: "converted" },
    ];

    for (const p of seedProspects) {
      const emailEncrypted = encrypt(p.email);
      const leadId = `lead_seed_${p.num}`;
      
      const l: Lead = {
        id: leadId,
        contractorId: adminId,
        businessName: p.name,
        ownerName: p.owner === "Owner" ? undefined : p.owner,
        emailEncrypted,
        city: p.city,
        serviceType: p.niche,
        source: 'cold_outreach',
        status: p.status as 'new' | 'contacted' | 'converted' | 'dead',
        urgencyScore: Math.round((Math.random() * 4 + 5) * 10) / 10, // 5.0 to 9.0
        predictedLtvUsd: p.status === 'converted' ? 18500 : Math.round((Math.random() * 8000 + 4500)),
        notes: `Seeded lead for ${p.name} in ${p.city}. Niche: ${p.niche}.`,
        createdAt: new Date(Date.now() - (30 - p.num) * 24 * 3600000).toISOString(), // staggered dates
        updatedAt: now
      };
      this.data.leads.push(l);

      // Create a converted revenue for the converted lead
      if (p.status === 'converted') {
        const rev: Revenue = {
          id: `rev_seed_${p.num}`,
          leadId,
          contractorId: adminId,
          amountUsd: 18500,
          source: 'manual_entry',
          recordedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
        };
        this.data.revenues.push(rev);
      }
    }

    // 3. Create Campaigns
    const WinnipegCampaignId = 'camp_seed_winnipeg';
    const CalgaryCampaignId = 'camp_seed_calgary';

    const campWinnipeg: Campaign = {
      id: WinnipegCampaignId,
      contractorId: adminId,
      marketId: 'market_winnipeg',
      name: 'Winnipeg Territory Acquisition Launch',
      platform: 'google_ads',
      budget: 1800,
      spent: 1250,
      status: 'active',
      startDate: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
      updatedAt: now
    };

    const campCalgary: Campaign = {
      id: CalgaryCampaignId,
      contractorId: adminId,
      marketId: 'market_calgary',
      name: 'Calgary High-LTV Growth Campaign',
      platform: 'google_ads',
      budget: 2200,
      spent: 1400,
      status: 'active',
      startDate: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
      updatedAt: now
    };

    this.data.campaigns.push(campWinnipeg);
    this.data.campaigns.push(campCalgary);

    // 4. Create Performance Snapshots for last 7 days
    for (let i = 7; i >= 1; i--) {
      const snapDate = new Date(Date.now() - i * 24 * 3600000).toISOString().split('T')[0];
      
      // Winnipeg snaps
      this.data.performanceSnapshots.push({
        id: `snap_w_${i}`,
        campaignId: WinnipegCampaignId,
        date: snapDate,
        leads: Math.floor(Math.random() * 4) + 2, // 2-5 leads
        spend: 40 + Math.random() * 10,
        cpl: 0, // calculate later
        clicks: Math.floor(Math.random() * 20) + 15,
        impressions: Math.floor(Math.random() * 300) + 200,
        createdAt: now
      });

      // Calgary snaps
      this.data.performanceSnapshots.push({
        id: `snap_c_${i}`,
        campaignId: CalgaryCampaignId,
        date: snapDate,
        leads: Math.floor(Math.random() * 3) + 1, // 1-4 leads
        spend: 55 + Math.random() * 15,
        cpl: 0, // calculate later
        clicks: Math.floor(Math.random() * 25) + 12,
        impressions: Math.floor(Math.random() * 400) + 250,
        createdAt: now
      });
    }

    // Fix CPL in performance snapshots
    this.data.performanceSnapshots.forEach(s => {
      s.cpl = s.leads > 0 ? Math.round((s.spend / s.leads) * 100) / 100 : s.spend;
    });

    // 5. Create some Forecasts (e.g. Lead volume target)
    const targetDate1 = new Date(Date.now() - 1 * 24 * 3600000).toISOString(); // Yesterday (expired!)
    const targetDate2 = new Date(Date.now() + 5 * 24 * 3600000).toISOString(); // Future

    const fcExpired: Forecast = {
      id: 'fc_seed_expired',
      contractorId: adminId,
      metric: 'lead_volume',
      predicted: 25,
      confidenceScore: 0.82,
      targetDate: targetDate1,
      modelVersion: 'v1_manual',
      evaluated: false,
      assumptions: 'Assumed high demand driven by market growth and regional digital audit gap analysis.',
      createdAt: new Date(Date.now() - 8 * 24 * 3600000).toISOString()
    };

    const fcFuture: Forecast = {
      id: 'fc_seed_future',
      contractorId: adminId,
      metric: 'cpl',
      predicted: 18.5,
      confidenceScore: 0.74,
      targetDate: targetDate2,
      modelVersion: 'v1_auto',
      evaluated: false,
      assumptions: 'Predicted based on seasonal optimization adjustments and lowered bidding competition.',
      createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
    };

    this.data.forecasts.push(fcExpired);
    this.data.forecasts.push(fcFuture);

    // 6. Create some Recommendations
    this.data.recommendations.push({
      id: 'rec_seed_1',
      contractorId: adminId,
      category: 'budget_allocation',
      action: 'Shift $400 from Calgary High-LTV to Winnipeg Territory Launch Campaign',
      rationale: 'Winnipeg campaign shows a Cost-Per-Lead (CPL) of $12.50 vs Calgary\'s $22.40. Reallocating budget maximizes total generated leads within the same aggregate budget constraint.',
      confidence: 0.91,
      evidence: 'Cost efficiency difference is statistically significant (p < 0.01) based on performance over the last 14 days.',
      status: 'pending',
      createdAt: now,
      updatedAt: now
    });

    this.data.recommendations.push({
      id: 'rec_seed_2',
      contractorId: adminId,
      category: 'bidding_strategy',
      action: 'Enable Enhanced CPC for high-intent emergency service keywords',
      rationale: 'Search queries peak during night hours due to current weather conditions in target territories. Automated bid multipliers will capture high-intent emergency traffic.',
      confidence: 0.85,
      evidence: 'Conversion rate of night-time queries is 3.5x higher than daytime counterparts during weather advisory periods.',
      status: 'pending',
      createdAt: now,
      updatedAt: now
    });

    // 7. Seed Learning Insights
    this.data.learningInsights.push({
      id: 'insight_seed_1',
      category: 'weather_elasticity',
      insight: 'High-intent service lead volume is highly elastic to local seasonal weather shifts (elasticity factor: 2.8x volume increase within 12 hours).',
      confidence: 0.94,
      observedCount: 4,
      createdAt: now,
      updatedAt: now
    });

    this.data.learningInsights.push({
      id: 'insight_seed_2',
      category: 'competition_decay',
      insight: 'Weekend Cost-Per-Click (CPC) drops by 24% across Winnipeg home services because competitors pause budgets, but conversion rates remain within 5% of weekday levels.',
      confidence: 0.88,
      observedCount: 8,
      createdAt: now,
      updatedAt: now
    });

    // 8. Seed default automated Missions
    const mis1Id = 'mis_seed_fredericton';
    const mis2Id = 'mis_seed_winnipeg';

    this.data.missions = [
      {
        id: mis1Id,
        contractorId: adminId,
        title: 'Territory Penetration Mission: Fredericton Regional Trades',
        description: 'Automated multi-agent sequence to harvest active businesses, evaluate digital speed/SEO gaps, and compile custom outreach copy.',
        status: 'completed',
        city: 'Fredericton',
        niche: 'trade services',
        createdAt: now,
        updatedAt: now,
        steps: [
          {
            id: 'mstep_fred_1',
            missionId: mis1Id,
            title: 'Territory Intelligence Harvest',
            description: 'Scans the regional business registry to extract email, phone, and owner listings.',
            status: 'completed',
            result: 'Successfully identified 5 premium local business profiles with contact records.',
            updatedAt: now
          },
          {
            id: 'mstep_fred_2',
            missionId: mis1Id,
            title: 'Technical Web Speed Audits',
            description: 'Analyzes render latency, mobile responsiveness, and SSL security indicators.',
            status: 'completed',
            result: 'Completed 5 automated audits. Identified 2 critical sites lacking mobile CTAs.',
            updatedAt: now
          },
          {
            id: 'mstep_fred_3',
            missionId: mis1Id,
            title: 'Personalized Value Outreach Drafting',
            description: 'Drafts cold outreach angles detailing exact performance scores and conversion gains.',
            status: 'completed',
            result: 'Outbound pitch documents constructed using custom speed parameters.',
            updatedAt: now
          }
        ]
      },
      {
        id: mis2Id,
        contractorId: adminId,
        title: 'Demand-Triggered Territory Conquest Campaign',
        description: 'Real-time weather warning trigger to bid aggressively on high-intent terms during high demand periods.',
        status: 'running',
        city: 'Winnipeg',
        niche: 'trade services',
        createdAt: now,
        updatedAt: now,
        steps: [
          {
            id: 'mstep_wpg_1',
            missionId: mis2Id,
            title: 'Open-Meteo Environmental Threshold Check',
            description: 'Queries live weather data to verify if regional demand indicators trigger campaign scaling.',
            status: 'completed',
            result: 'Environmental threshold met: Active demand signal recorded in Winnipeg.',
            updatedAt: now
          },
          {
            id: 'mstep_wpg_2',
            missionId: mis2Id,
            title: 'Sourced Leads Intelligence Query',
            description: 'Retrieves high-priority regional service leads with active digital gaps.',
            status: 'completed',
            result: 'Loaded 4 sourced leads with active digital weaknesses.',
            updatedAt: now
          },
          {
            id: 'mstep_wpg_3',
            missionId: mis2Id,
            title: 'Demand-Triggered Ad Bid Increase',
            description: 'Injects CPC bid multiplier (1.4x) on high-intent regional service terms.',
            status: 'pending',
            result: 'Waiting for manual review or automatic API trigger.',
            updatedAt: now
          }
        ]
      }
    ];

    this.save();
    console.log('Database seeding complete!');
  }

  public save() {
    try {
      // Prior to saving, ensure sensitive PII is encrypted.
      // Note: in-memory representation inside this.data.leads has BOTH encrypted and plain fields.
      // When saving, we strip plain fields and keep only encrypted fields.
      const leadsToSave = this.data.leads.map(lead => {
        const copy = { ...lead };
        // If plain fields are available but encrypted ones aren't, encrypt them
        if (copy.email && !copy.emailEncrypted) {
          copy.emailEncrypted = encrypt(copy.email);
        }
        if (copy.phone && !copy.phoneEncrypted) {
          copy.phoneEncrypted = encrypt(copy.phone);
        }
        delete copy.email;
        delete copy.phone;
        return copy;
      });

      const payload = { ...this.data, leads: leadsToSave };
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // Helper to get active/decrypted leads
  public getLeads(contractorId?: string): Lead[] {
    let rawLeads = this.data.leads;
    if (contractorId) {
      rawLeads = rawLeads.filter(l => l.contractorId === contractorId);
    }
    return rawLeads.map(lead => {
      return {
        ...lead,
        email: lead.emailEncrypted ? decrypt(lead.emailEncrypted) : undefined,
        phone: lead.phoneEncrypted ? decrypt(lead.phoneEncrypted) : undefined
      };
    });
  }

  public addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead {
    const id = 'lead_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    
    const emailEncrypted = lead.email ? encrypt(lead.email) : undefined;
    const phoneEncrypted = lead.phone ? encrypt(lead.phone) : undefined;

    const newLead: Lead = {
      ...lead,
      id,
      emailEncrypted,
      phoneEncrypted,
      createdAt: now,
      updatedAt: now
    };

    this.data.leads.push(newLead);
    this.save();

    return {
      ...newLead,
      email: lead.email,
      phone: lead.phone
    };
  }

  public purgeMockLeads(contractorId: string) {
    // Clear mock leads starting with lead_seed_
    this.data.leads = this.data.leads.filter(l => !(l.contractorId === contractorId && l.id.startsWith('lead_seed_')));
    // Also clear associated mock revenues
    this.data.revenues = this.data.revenues.filter(r => !(r.contractorId === contractorId && r.id.startsWith('rev_seed_')));
    this.save();
  }

  public resetContractorCampaignData(contractorId: string, city: string, niche: string, mode: 'blank' | 'mock') {
    const now = new Date().toISOString();
    
    // 1. Identify all lead IDs for this contractor to purge events associated with them
    const contractorLeads = this.data.leads.filter(l => l.contractorId === contractorId);
    const leadIds = new Set(contractorLeads.map(l => l.id));

    // Get contractor's campaigns and forecasts to purge associated snapshot/outcome records
    const campaignIds = new Set(this.data.campaigns.filter(c => c.contractorId === contractorId).map(c => c.id));
    const forecastIds = new Set(this.data.forecasts.filter(f => f.contractorId === contractorId).map(f => f.id));

    // 2. Wipe existing data for this contractor
    this.data.leads = this.data.leads.filter(l => l.contractorId !== contractorId);
    this.data.leadEvents = this.data.leadEvents.filter(ev => !leadIds.has(ev.leadId));
    this.data.campaigns = this.data.campaigns.filter(c => c.contractorId !== contractorId);
    this.data.revenues = this.data.revenues.filter(r => r.contractorId !== contractorId);
    this.data.performanceSnapshots = this.data.performanceSnapshots.filter(ps => !campaignIds.has(ps.campaignId));
    this.data.forecasts = this.data.forecasts.filter(f => f.contractorId !== contractorId);
    this.data.predictionOutcomes = this.data.predictionOutcomes.filter(po => !forecastIds.has(po.forecastId));
    this.data.recommendations = this.data.recommendations.filter(re => re.contractorId !== contractorId);
    this.data.missions = this.data.missions.filter(m => m.contractorId !== contractorId);
    
    // Also clear chat history for this contractor
    if (this.data.chatMessages) {
      this.data.chatMessages = this.data.chatMessages.filter(m => m.contractorId !== contractorId);
    }

    // Update contractor's market ID
    const contractorIdx = this.data.contractors.findIndex(c => c.id === contractorId);
    if (contractorIdx !== -1) {
      this.data.contractors[contractorIdx].marketId = `market_${city.toLowerCase().replace(/\s+/g, '_')}`;
      this.data.contractors[contractorIdx].updatedAt = now;
    }

    let seededCount = 0;
    if (mode === 'mock') {
      const capCity = city.trim().replace(/\b\w/g, c => c.toUpperCase());
      const capNiche = niche.trim().replace(/\b\w/g, c => c.toUpperCase());
      const lower = niche.toLowerCase();

      // Dynamic LTV scaling based on industry trade
      let ltvBase = 3500;
      if (lower.includes('builder') || lower.includes('contractor') || lower.includes('remodel') || lower.includes('framing')) {
        ltvBase = 125000;
      } else if (lower.includes('solar') || lower.includes('electric')) {
        ltvBase = 28000;
      } else if (lower.includes('roof')) {
        ltvBase = 18500;
      } else if (lower.includes('mow') || lower.includes('lawn') || lower.includes('landscap')) {
        ltvBase = 2400;
      }

      // Create 5 realistic mock leads
      const seedTemplates = [
        { name: `${capCity} Professional ${capNiche}`, owner: "Matthew Miller", status: "converted" as const, urgency: 8.4, ltv: Math.round(ltvBase * 1.3), daysAgo: 14 },
        { name: `${capCity} ${capNiche} & Service Experts`, owner: "Sarah Jenkins", status: "contacted" as const, urgency: 7.2, ltv: Math.round(ltvBase * 0.8), daysAgo: 8 },
        { name: `Elite ${capNiche} of ${capCity}`, owner: "Dylan Foster", status: "new" as const, urgency: 9.1, ltv: Math.round(ltvBase * 1.1), daysAgo: 5 },
        { name: `Apex ${capNiche} Specialists`, owner: "Emily Vance", status: "new" as const, urgency: 5.6, ltv: Math.round(ltvBase * 0.6), daysAgo: 3 },
        { name: `${capCity} Local ${capNiche} Co.`, owner: "Michael Chang", status: "dead" as const, urgency: 4.8, ltv: Math.round(ltvBase * 0.5), daysAgo: 1 }
      ];

      for (let i = 0; i < seedTemplates.length; i++) {
        const t = seedTemplates[i];
        const emailEncrypted = encrypt(`contact@${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`);
        const phoneEncrypted = encrypt(`555-01${10 + i}`);
        const leadId = `lead_reset_seed_${contractorId}_${i}`;

        const l: Lead = {
          id: leadId,
          contractorId,
          businessName: t.name,
          ownerName: t.owner,
          emailEncrypted,
          phoneEncrypted,
          city: capCity,
          serviceType: niche.toLowerCase().trim(),
          source: 'cold_outreach',
          status: t.status,
          urgencyScore: t.urgency,
          predictedLtvUsd: t.ltv,
          notes: `Seeded fresh pivot prospect for ${t.name} in ${capCity}. Niche: ${niche}.`,
          createdAt: new Date(Date.now() - t.daysAgo * 24 * 3600000).toISOString(),
          updatedAt: now
        };
        this.data.leads.push(l);
        seededCount++;

        // Add lead creation event
        this.data.leadEvents.push({
          id: `ev_reset_seed_${contractorId}_${i}_create`,
          leadId,
          type: 'creation',
          notes: `Lead generated during new campaign seeding for ${capCity}.`,
          createdAt: l.createdAt
        });

        if (t.status === 'converted') {
          // Add a revenue event
          const revId = `rev_reset_seed_${contractorId}_${i}`;
          const rev: Revenue = {
            id: revId,
            leadId,
            contractorId,
            amountUsd: t.ltv,
            source: 'manual_entry',
            recordedAt: new Date(Date.now() - (t.daysAgo - 2) * 24 * 3600000).toISOString()
          };
          this.data.revenues.push(rev);

          // Add conversion event
          this.data.leadEvents.push({
            id: `ev_reset_seed_${contractorId}_${i}_convert`,
            leadId,
            type: 'conversion',
            notes: `Successfully closed deal! Project size of $${t.ltv} registered under revenue ledger.`,
            createdAt: rev.recordedAt
          });
        } else if (t.status === 'contacted') {
          // Add contacted event
          this.data.leadEvents.push({
            id: `ev_reset_seed_${contractorId}_${i}_contact`,
            leadId,
            type: 'contact',
            notes: `Outreach completed via email proposal. Awaiting response regarding operational performance gaps.`,
            createdAt: new Date(Date.now() - (t.daysAgo - 1) * 24 * 3600000).toISOString()
          });
        }
      }

      // Add a Campaign
      const campId = `camp_reset_seed_${contractorId}`;
      const camp: Campaign = {
        id: campId,
        contractorId,
        marketId: `market_${city.toLowerCase().replace(/\s+/g, '_')}`,
        name: `${capCity} ${capNiche} Launch Campaign`,
        platform: 'google_ads',
        budget: 2500,
        spent: 350,
        status: 'active',
        startDate: new Date(Date.now() - 6 * 24 * 3600000).toISOString(),
        createdAt: new Date(Date.now() - 6 * 24 * 3600000).toISOString(),
        updatedAt: now
      };
      this.data.campaigns.push(camp);

      // Add a default learning insight (System wide, without contractorId)
      const insightId = `li_reset_seed_${contractorId}`;
      this.data.learningInsights.push({
        id: insightId,
        category: 'weather_elasticity',
        insight: `Search volume for ${niche.toLowerCase()} services in ${capCity} increases exponentially during local extreme weather alerts. Synchronizing ad scheduling with real-time alerts is highly recommended.`,
        confidence: 0.88,
        observedCount: 1,
        createdAt: now,
        updatedAt: now
      });

      // Add a default recommendation (Has contractorId)
      const recId = `rec_reset_seed_${contractorId}`;
      this.data.recommendations.push({
        id: recId,
        contractorId,
        category: 'budget_reallocation',
        action: `Leverage weather trigger ads in ${capCity}`,
        rationale: `Optimize Google Ads bid multipliers during high-intent timeframes for ${niche.toLowerCase()} service demand surges.`,
        confidence: 0.9,
        status: 'pending',
        createdAt: now,
        updatedAt: now
      });
    }

    this.save();
    return {
      cleared: true,
      seededCount,
      city,
      niche,
      mode
    };
  }

  public updateLead(id: string, contractorId: string, updates: Partial<Omit<Lead, 'id' | 'contractorId' | 'createdAt' | 'updatedAt'>>): Lead | null {
    const idx = this.data.leads.findIndex(l => l.id === id && l.contractorId === contractorId);
    if (idx === -1) return null;

    const existing = this.data.leads[idx];
    const now = new Date().toISOString();

    const emailEncrypted = updates.email !== undefined 
      ? (updates.email ? encrypt(updates.email) : undefined) 
      : existing.emailEncrypted;

    const phoneEncrypted = updates.phone !== undefined 
      ? (updates.phone ? encrypt(updates.phone) : undefined) 
      : existing.phoneEncrypted;

    const updatedLead: Lead = {
      ...existing,
      ...updates,
      emailEncrypted,
      phoneEncrypted,
      updatedAt: now
    };

    this.data.leads[idx] = updatedLead;
    this.save();

    return {
      ...updatedLead,
      email: updates.email !== undefined ? updates.email : (existing.emailEncrypted ? decrypt(existing.emailEncrypted) : undefined),
      phone: updates.phone !== undefined ? updates.phone : (existing.phoneEncrypted ? decrypt(existing.phoneEncrypted) : undefined)
    };
  }

  // Contractor Methods
  public getContractors(): Contractor[] {
    return this.data.contractors;
  }

  public getContractorById(id: string): Contractor | null {
    return this.data.contractors.find(c => c.id === id) || null;
  }

  public getContractorByEmail(email: string): Contractor | null {
    return this.data.contractors.find(c => c.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public addContractor(c: Omit<Contractor, 'id' | 'createdAt' | 'updatedAt'>): Contractor {
    const id = 'con_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const newCon: Contractor = {
      ...c,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.data.contractors.push(newCon);
    this.save();
    return newCon;
  }

  // Sessions
  public getSession(token: string): Session | null {
    const s = this.data.sessions.find(x => x.token === token);
    if (!s) return null;
    if (new Date(s.expiresAt) < new Date()) {
      this.deleteSession(token);
      return null;
    }
    return s;
  }

  public addSession(contractorId: string, token: string, expiresAt: Date): Session {
    const id = 'sess_' + crypto.randomBytes(8).toString('hex');
    const newSession: Session = {
      id,
      contractorId,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };
    this.data.sessions.push(newSession);
    this.save();
    return newSession;
  }

  public deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter(x => x.token !== token);
    this.save();
  }

  public revokeAllSessionsForContractor(contractorId: string) {
    this.data.sessions = this.data.sessions.filter(x => x.contractorId !== contractorId);
    this.save();
  }

  // Campaigns
  public getCampaigns(contractorId?: string): Campaign[] {
    if (contractorId) {
      return this.data.campaigns.filter(c => c.contractorId === contractorId);
    }
    return this.data.campaigns;
  }

  public getCampaignById(id: string, contractorId: string): Campaign | null {
    return this.data.campaigns.find(c => c.id === id && c.contractorId === contractorId) || null;
  }

  public addCampaign(c: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Campaign {
    const id = 'camp_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const newCamp: Campaign = {
      ...c,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.data.campaigns.push(newCamp);
    this.save();
    return newCamp;
  }

  public updateCampaign(id: string, contractorId: string, updates: Partial<Omit<Campaign, 'id' | 'contractorId' | 'createdAt' | 'updatedAt'>>): Campaign | null {
    const idx = this.data.campaigns.findIndex(c => c.id === id && c.contractorId === contractorId);
    if (idx === -1) return null;
    const existing = this.data.campaigns[idx];
    const updated: Campaign = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.campaigns[idx] = updated;
    this.save();
    return updated;
  }

  // PerformanceSnapshots
  public getPerformanceSnapshots(campaignIds: string[]): PerformanceSnapshot[] {
    return this.data.performanceSnapshots.filter(s => campaignIds.includes(s.campaignId));
  }

  public addPerformanceSnapshot(s: Omit<PerformanceSnapshot, 'id' | 'createdAt'>): PerformanceSnapshot {
    const id = 'snap_' + crypto.randomBytes(8).toString('hex');
    const newSnap: PerformanceSnapshot = {
      ...s,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.performanceSnapshots.push(newSnap);
    this.save();
    return newSnap;
  }

  // Revenues
  public getRevenues(contractorId?: string): Revenue[] {
    if (contractorId) {
      return this.data.revenues.filter(r => r.contractorId === contractorId);
    }
    return this.data.revenues;
  }

  public addRevenue(r: Omit<Revenue, 'id' | 'recordedAt'>): Revenue {
    const id = 'rev_' + crypto.randomBytes(8).toString('hex');
    const newRev: Revenue = {
      ...r,
      id,
      recordedAt: new Date().toISOString()
    };
    this.data.revenues.push(newRev);
    
    // Also change lead status to converted if converted
    const leadIdx = this.data.leads.findIndex(l => l.id === r.leadId);
    if (leadIdx !== -1) {
      this.data.leads[leadIdx].status = 'converted';
      this.data.leads[leadIdx].updatedAt = new Date().toISOString();
    }
    
    this.save();
    return newRev;
  }

  // Forecasts & Outcomes
  public getForecasts(contractorId?: string): Forecast[] {
    if (contractorId) {
      return this.data.forecasts.filter(f => f.contractorId === contractorId);
    }
    return this.data.forecasts;
  }

  public addForecast(f: Omit<Forecast, 'id' | 'createdAt'>): Forecast {
    const id = 'fc_' + crypto.randomBytes(8).toString('hex');
    const newFc: Forecast = {
      ...f,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.forecasts.push(newFc);
    this.save();
    return newFc;
  }

  public getPredictionOutcomes(): PredictionOutcome[] {
    return this.data.predictionOutcomes;
  }

  public addPredictionOutcome(o: Omit<PredictionOutcome, 'id' | 'evaluatedAt'>): PredictionOutcome {
    const id = 'out_' + crypto.randomBytes(8).toString('hex');
    const newOut: PredictionOutcome = {
      ...o,
      id,
      evaluatedAt: new Date().toISOString()
    };
    this.data.predictionOutcomes.push(newOut);
    
    // Mark forecast as evaluated
    const fcIdx = this.data.forecasts.findIndex(f => f.id === o.forecastId);
    if (fcIdx !== -1) {
      this.data.forecasts[fcIdx].evaluated = true;
    }

    this.save();
    return newOut;
  }

  // Learning Insights
  public getLearningInsights(): LearningInsight[] {
    return this.data.learningInsights;
  }

  public addLearningInsight(insight: Omit<LearningInsight, 'id' | 'createdAt' | 'updatedAt'>): LearningInsight {
    const id = 'li_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const newLi: LearningInsight = {
      ...insight,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.data.learningInsights.push(newLi);
    this.save();
    return newLi;
  }

  public incrementInsightObserved(id: string) {
    const idx = this.data.learningInsights.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.learningInsights[idx].observedCount += 1;
      this.data.learningInsights[idx].updatedAt = new Date().toISOString();
      this.save();
    }
  }

  // Recommendations
  public getRecommendations(contractorId?: string): Recommendation[] {
    if (contractorId) {
      return this.data.recommendations.filter(r => r.contractorId === contractorId);
    }
    return this.data.recommendations;
  }

  public addRecommendation(r: Omit<Recommendation, 'id' | 'createdAt' | 'updatedAt'>): Recommendation {
    const id = 'rec_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const newRec: Recommendation = {
      ...r,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.data.recommendations.push(newRec);
    this.save();
    return newRec;
  }

  public updateRecommendationStatus(id: string, contractorId: string, status: Recommendation['status'], outcome?: string): Recommendation | null {
    const idx = this.data.recommendations.findIndex(r => r.id === id && r.contractorId === contractorId);
    if (idx === -1) return null;
    const existing = this.data.recommendations[idx];
    const updated: Recommendation = {
      ...existing,
      status,
      outcome: outcome || existing.outcome,
      updatedAt: new Date().toISOString()
    };
    this.data.recommendations[idx] = updated;
    this.save();
    return updated;
  }

  // Lessons & OutcomeRecords (Phase 2)
  public getLessons(): Lesson[] {
    return this.data.lessons;
  }

  public addLesson(l: Omit<Lesson, 'id' | 'createdAt'>): Lesson {
    const id = 'les_' + crypto.randomBytes(8).toString('hex');
    const newLesson: Lesson = {
      ...l,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.lessons.push(newLesson);
    this.save();
    return newLesson;
  }

  public incrementLessonObserved(id: string) {
    const idx = this.data.lessons.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.lessons[idx].timesObserved += 1;
      this.data.lessons[idx].lastObserved = new Date().toISOString();
      this.save();
    }
  }

  public getOutcomeRecords(): OutcomeRecord[] {
    return this.data.outcomeRecords;
  }

  public addOutcomeRecord(r: Omit<OutcomeRecord, 'id' | 'createdAt'>): OutcomeRecord {
    const id = 'outr_' + crypto.randomBytes(8).toString('hex');
    const newRec: OutcomeRecord = {
      ...r,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.outcomeRecords.push(newRec);
    this.save();
    return newRec;
  }

  // API Keys
  public getApiKeys(contractorId: string): ApiKey[] {
    return this.data.apiKeys.filter(k => k.contractorId === contractorId);
  }

  public addApiKey(contractorId: string, keyHash: string, prefix: string, name: string, expiresAt?: Date): ApiKey {
    const id = 'key_' + crypto.randomBytes(8).toString('hex');
    const newKey: ApiKey = {
      id,
      contractorId,
      keyHash,
      prefix,
      name,
      expiresAt: expiresAt?.toISOString(),
      createdAt: new Date().toISOString()
    };
    this.data.apiKeys.push(newKey);
    this.save();
    return newKey;
  }

  public deleteApiKey(id: string, contractorId: string) {
    this.data.apiKeys = this.data.apiKeys.filter(k => !(k.id === id && k.contractorId === contractorId));
    this.save();
  }

  public getConnectorCredentials(contractorId: string): Record<string, string> {
    if (!this.data.connectorCredentials) {
      this.data.connectorCredentials = {};
    }
    return this.data.connectorCredentials[contractorId] || {};
  }

  public saveConnectorCredential(contractorId: string, service: string, keyVal: string) {
    if (!this.data.connectorCredentials) {
      this.data.connectorCredentials = {};
    }
    if (!this.data.connectorCredentials[contractorId]) {
      this.data.connectorCredentials[contractorId] = {};
    }
    this.data.connectorCredentials[contractorId][service] = keyVal;
    this.save();
  }

  // Notifications
  public getNotifications(contractorId: string): Notification[] {
    return this.data.notifications.filter(n => n.contractorId === contractorId);
  }

  public addNotification(n: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const id = 'not_' + crypto.randomBytes(8).toString('hex');
    const newNotification: Notification = {
      ...n,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.push(newNotification);
    this.save();
    return newNotification;
  }

  public markNotificationAsRead(id: string, contractorId: string) {
    const idx = this.data.notifications.findIndex(n => n.id === id && n.contractorId === contractorId);
    if (idx !== -1) {
      this.data.notifications[idx].read = true;
      this.save();
    }
  }

  // Lead events
  public getLeadEvents(leadId: string): LeadEvent[] {
    return this.data.leadEvents.filter(e => e.leadId === leadId);
  }

  public getContractorLeadEvents(contractorId: string): LeadEvent[] {
    const leadIds = new Set(this.data.leads.filter(l => l.contractorId === contractorId).map(l => l.id));
    return this.data.leadEvents.filter(e => leadIds.has(e.leadId));
  }

  public addLeadEvent(e: Omit<LeadEvent, 'id' | 'createdAt'>): LeadEvent {
    const id = 'le_ev_' + crypto.randomBytes(8).toString('hex');
    const newEv: LeadEvent = {
      ...e,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.leadEvents.push(newEv);
    this.save();
    return newEv;
  }

  // Audit Logs
  public getAuditLogs(contractorId?: string): SystemAuditLog[] {
    if (contractorId) {
      return this.data.systemAuditLogs.filter(l => l.contractorId === contractorId);
    }
    return this.data.systemAuditLogs;
  }

  public addAuditLog(l: Omit<SystemAuditLog, 'id' | 'createdAt'>): SystemAuditLog {
    const id = 'log_' + crypto.randomBytes(8).toString('hex');
    const newLog: SystemAuditLog = {
      ...l,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.systemAuditLogs.push(newLog);
    this.save();
    return newLog;
  }

  // ─── HAL Roadmap Phase 1: Cryptographic Structured Ledger Methods ───────────
  public getStructuredLedger(contractorId?: string, limit = 100): StructuredLedgerEntry[] {
    if (!this.data.structuredLedger) {
      this.data.structuredLedger = [];
    }
    let entries = this.data.structuredLedger;
    if (contractorId) {
      entries = entries.filter(e => e.contractorId === contractorId || e.contractorId === 'system_genesis');
    }
    return entries.slice(-limit).reverse();
  }

  public recordLedgerEntry(params: {
    contractorId: string;
    eventType: StructuredLedgerEntry['eventType'];
    entityType: string;
    entityId: string;
    actor: string;
    details?: string;
    metadata?: Record<string, any>;
  }): StructuredLedgerEntry {
    if (!this.data.structuredLedger) {
      this.data.structuredLedger = [];
    }
    
    const entries = this.data.structuredLedger;
    const sequenceNumber = entries.length + 1;
    const prevHash = entries.length > 0 ? entries[entries.length - 1].entryHash : '0'.repeat(64);
    
    const payloadStr = JSON.stringify({
      contractorId: params.contractorId,
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details || '',
      metadata: params.metadata || {}
    });
    
    const payloadHash = crypto.createHash('sha256').update(payloadStr).digest('hex');
    const now = new Date().toISOString();
    const id = 'led_' + crypto.randomBytes(8).toString('hex');
    
    const entryHash = crypto.createHash('sha256').update(
      `${sequenceNumber}:${prevHash}:${payloadHash}:${params.actor}:${now}`
    ).digest('hex');
    
    const newEntry: StructuredLedgerEntry = {
      id,
      contractorId: params.contractorId,
      sequenceNumber,
      eventType: params.eventType,
      entityType: params.entityType,
      entityId: params.entityId,
      actor: params.actor,
      payloadHash,
      prevHash,
      entryHash,
      details: params.details,
      metadata: params.metadata,
      createdAt: now
    };
    
    entries.push(newEntry);
    this.save();
    return newEntry;
  }

  public verifyLedgerIntegrity(contractorId?: string): { 
    valid: boolean; 
    totalEntries: number; 
    latestHash: string;
    brokenAtSequence?: number;
    auditMessage: string;
  } {
    if (!this.data.structuredLedger || this.data.structuredLedger.length === 0) {
      return { 
        valid: true, 
        totalEntries: 0, 
        latestHash: '0'.repeat(64), 
        auditMessage: 'Ledger is initialized and empty' 
      };
    }
    
    const entries = this.data.structuredLedger;
    let expectedPrevHash = '0'.repeat(64);
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.sequenceNumber !== i + 1) {
        return {
          valid: false,
          totalEntries: entries.length,
          latestHash: entries[entries.length - 1].entryHash,
          brokenAtSequence: i + 1,
          auditMessage: `Sequence mismatch at index ${i}: expected ${i + 1}, found ${entry.sequenceNumber}`
        };
      }
      if (entry.prevHash !== expectedPrevHash) {
        return {
          valid: false,
          totalEntries: entries.length,
          latestHash: entries[entries.length - 1].entryHash,
          brokenAtSequence: i + 1,
          auditMessage: `Hash chain break at sequence ${entry.sequenceNumber}: prevHash does not match previous entry's hash`
        };
      }
      expectedPrevHash = entry.entryHash;
    }
    
    return {
      valid: true,
      totalEntries: entries.length,
      latestHash: entries[entries.length - 1].entryHash,
      auditMessage: `Cryptographic SHA-256 hash chain intact across all ${entries.length} sequenced ledger entries.`
    };
  }

  // Scheduler Jobs
  public getSchedulerJobs(): SchedulerJob[] {
    return this.data.schedulerJobs;
  }

  public addSchedulerJob(job: Omit<SchedulerJob, 'id' | 'createdAt'>): SchedulerJob {
    const id = 'job_' + crypto.randomBytes(8).toString('hex');
    const newJob: SchedulerJob = {
      ...job,
      id,
      createdAt: new Date().toISOString()
    };
    this.data.schedulerJobs.push(newJob);
    this.save();
    return newJob;
  }

  public updateSchedulerJob(id: string, updates: Partial<Omit<SchedulerJob, 'id' | 'createdAt'>>) {
    const idx = this.data.schedulerJobs.findIndex(j => j.id === id);
    if (idx !== -1) {
      this.data.schedulerJobs[idx] = {
        ...this.data.schedulerJobs[idx],
        ...updates
      };
      this.save();
    }
  }

  // Missions
  public getMissions(contractorId?: string): Mission[] {
    const list = this.data.missions || [];
    if (contractorId) {
      return list.filter(m => m.contractorId === contractorId);
    }
    return list;
  }

  public getMissionById(id: string): Mission | undefined {
    const list = this.data.missions || [];
    return list.find(m => m.id === id);
  }

  public addMission(m: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'steps'> & { steps: Omit<MissionStep, 'id' | 'missionId' | 'updatedAt'>[] }): Mission {
    const now = new Date().toISOString();
    const id = 'mis_' + crypto.randomBytes(8).toString('hex');
    
    const steps: MissionStep[] = m.steps.map((s, idx) => ({
      ...s,
      id: `mstep_${idx}_` + crypto.randomBytes(4).toString('hex'),
      missionId: id,
      updatedAt: now
    }));

    const newMission: Mission = {
      ...m,
      id,
      steps,
      createdAt: now,
      updatedAt: now
    };

    if (!this.data.missions) {
      this.data.missions = [];
    }
    this.data.missions.push(newMission);
    this.save();
    return newMission;
  }

  public updateMission(id: string, updates: Partial<Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>>): Mission | null {
    const idx = this.data.missions?.findIndex(m => m.id === id);
    if (idx === -1 || idx === undefined) return null;

    const now = new Date().toISOString();
    this.data.missions[idx] = {
      ...this.data.missions[idx],
      ...updates,
      updatedAt: now
    };
    this.save();
    return this.data.missions[idx];
  }

  public updateMissionStep(missionId: string, stepId: string, updates: Partial<Omit<MissionStep, 'id' | 'missionId' | 'updatedAt'>>): MissionStep | null {
    const mission = this.getMissionById(missionId);
    if (!mission) return null;

    const stepIdx = mission.steps.findIndex(s => s.id === stepId);
    if (stepIdx === -1) return null;

    const now = new Date().toISOString();
    const updatedStep = {
      ...mission.steps[stepIdx],
      ...updates,
      updatedAt: now
    };

    mission.steps[stepIdx] = updatedStep;
    mission.updatedAt = now;
    this.save();
    return updatedStep;
  }

  // ─── CHAT HISTORY METHODS ───────────────────────────────────────────
  public getChatHistory(contractorId: string): ChatMessageDb[] {
    if (!this.data.chatMessages) {
      this.data.chatMessages = [];
    }
    return this.data.chatMessages.filter(m => m.contractorId === contractorId);
  }

  public addChatMessage(m: Omit<ChatMessageDb, 'id' | 'createdAt'>): ChatMessageDb {
    const now = new Date().toISOString();
    const id = 'msg_' + crypto.randomBytes(8).toString('hex');
    
    const newMsg: ChatMessageDb = {
      ...m,
      id,
      createdAt: now
    };

    if (!this.data.chatMessages) {
      this.data.chatMessages = [];
    }
    this.data.chatMessages.push(newMsg);
    this.save();
    return newMsg;
  }

  public deleteChatMessage(contractorId: string, id: string): boolean {
    if (!this.data.chatMessages) return false;
    const initialLen = this.data.chatMessages.length;
    this.data.chatMessages = this.data.chatMessages.filter(m => !(m.id === id && m.contractorId === contractorId));
    const deleted = this.data.chatMessages.length < initialLen;
    if (deleted) {
      this.save();
    }
    return deleted;
  }

  public clearChatHistory(contractorId: string): boolean {
    if (!this.data.chatMessages) return false;
    this.data.chatMessages = this.data.chatMessages.filter(m => m.contractorId !== contractorId);
    this.save();
    return true;
  }

  // ─── WIN / LOSS RECORD METHODS ───────────────────────────────────────
  public getWinLossRecords(contractorId: string): WinLossRecordDb[] {
    if (!this.data.winLossRecords) {
      this.data.winLossRecords = [];
    }
    return this.data.winLossRecords.filter(r => r.contractorId === contractorId);
  }

  public addWinLossRecord(record: Omit<WinLossRecordDb, 'id' | 'closedAt'>): WinLossRecordDb {
    if (!this.data.winLossRecords) {
      this.data.winLossRecords = [];
    }
    const id = 'wl_' + crypto.randomBytes(8).toString('hex');
    const newRecord: WinLossRecordDb = {
      ...record,
      id,
      closedAt: new Date().toISOString()
    };
    this.data.winLossRecords.push(newRecord);
    this.save();
    return newRecord;
  }

  // ─── OUTREACH SEQUENCE METHODS ───────────────────────────────────────
  public getOutreachSequences(contractorId: string): OutreachSequenceDb[] {
    if (!this.data.outreachSequences || this.data.outreachSequences.length === 0) {
      // Initialize with default high-converting sequences
      this.data.outreachSequences = [
        {
          id: 'seq_default_conquest',
          contractorId,
          name: 'Territory Conquest 3-Touch Audit Cadence',
          niche: 'All Niches',
          steps: [
            {
              day: 1,
              channel: 'email',
              title: 'Executive Speed & SEO Audit Reveal',
              purpose: 'Deliver value upfront by presenting concrete vulnerabilities without pitching.',
              template: 'Hi {{ownerName}},\n\nI ran an automated performance diagnostic on {{businessName}} in {{city}} and noticed mobile load speed is currently scoring {{performanceScore}}/100, which typically leaks 20-30% of high-intent search traffic to local competitors.\n\nI put together a complete 1-page breakdown showing exactly where the bottlenecks are. Would you like me to send over the PDF report?\n\nBest regards,\nTerritory Intelligence Team'
            },
            {
              day: 3,
              channel: 'sms',
              title: 'Quick Follow-up SMS with Value Metric',
              purpose: 'Casual, low-friction text message referencing potential recovered deal revenue.',
              template: 'Hey {{ownerName}}, quick check-in from HAL Territory Ops regarding {{businessName}}. We calculated that resolving your SSL and mobile speed flags could recover an est. ${{predictedLtv}} in new job bookings this quarter. Let me know if you want the checklist!'
            },
            {
              day: 7,
              channel: 'call',
              title: 'Objection-Proof Closing Call Script',
              purpose: 'Direct phone conversation positioning yourself as the territory authority.',
              template: 'Script: "Hi {{ownerName}}, this is calling regarding the digital footprint audit we ran for {{businessName}} in {{city}}. I wanted to see if you had 3 minutes to review the 2 high-priority fixes before we publish our quarterly {{serviceType}} industry benchmark report."'
            }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      this.save();
    }
    return this.data.outreachSequences.filter(s => s.contractorId === contractorId);
  }

  public saveOutreachSequence(contractorId: string, seq: Omit<OutreachSequenceDb, 'contractorId'>): OutreachSequenceDb {
    if (!this.data.outreachSequences) {
      this.data.outreachSequences = [];
    }
    const existingIdx = this.data.outreachSequences.findIndex(s => s.id === seq.id && s.contractorId === contractorId);
    const item: OutreachSequenceDb = {
      ...seq,
      contractorId
    };
    if (existingIdx >= 0) {
      this.data.outreachSequences[existingIdx] = item;
    } else {
      this.data.outreachSequences.push(item);
    }
    this.save();
    return item;
  }

  // ─── PHASE 4: CLIENT ONBOARDING & PROJECT DELIVERY ─────────────────────────

  public getClientProjects(contractorId: string): ClientProjectDb[] {
    if (!this.data.clientProjects) {
      this.data.clientProjects = [];
    }

    // Auto-seed an initial representative project if empty
    if (this.data.clientProjects.filter(p => p.contractorId === contractorId).length === 0) {
      const convertedLeads = this.getLeads(contractorId).filter(l => l.status === 'converted');
      const baseLead = convertedLeads[0] || this.getLeads(contractorId)[0];

      if (baseLead) {
        this.data.clientProjects.push({
          id: 'proj_' + crypto.randomBytes(6).toString('hex'),
          contractorId,
          leadId: baseLead.id,
          clientName: baseLead.ownerName || 'David Miller',
          businessName: baseLead.businessName,
          city: baseLead.city,
          serviceType: baseLead.serviceType,
          packageTier: 'Dominance',
          monthlyRetainerUsd: 2400,
          startDate: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
          status: 'active_delivery',
          initialAuditScore: 48,
          currentScore: 84,
          targetScore: 95,
          portalAccessToken: crypto.randomBytes(12).toString('hex'),
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          notes: 'Client authorized complete technical infrastructure acceleration and geo-rank pack setup.',
          assets: [
            { id: 'ast_1', name: 'High-Res Vector Brand Logo', category: 'logo', status: 'verified', uploadedAt: new Date(Date.now() - 12 * 86400000).toISOString() },
            { id: 'ast_2', name: 'DNS & Domain Control Registrar Access', category: 'domain_access', status: 'verified', uploadedAt: new Date(Date.now() - 11 * 86400000).toISOString() },
            { id: 'ast_3', name: 'Google Business Profile Manager Delegation', category: 'analytics_access', status: 'verified', uploadedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
            { id: 'ast_4', name: 'Jobsite Before & After High-Res Photography', category: 'photos', status: 'received', uploadedAt: new Date(Date.now() - 5 * 86400000).toISOString() }
          ],
          milestones: [
            {
              id: 'ms_1',
              title: 'Onboarding & Asset Verification',
              description: 'Intake domain registrar credentials, brand guidelines, and target geo-service territory zones.',
              status: 'completed',
              completedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
              deliverablesProof: 'All assets intake forms validated. Primary domain authorized.'
            },
            {
              id: 'ms_2',
              title: 'TLS 1.3 SSL & Core Web Vitals Acceleration',
              description: 'Hardened security certificates, compressed asset payloads, and achieved sub-1.2s mobile load speeds.',
              status: 'completed',
              completedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
              deliverablesProof: 'Mobile PageSpeed improved from 48/100 to 84/100. SSL Grade A+.'
            },
            {
              id: 'ms_3',
              title: 'Local Geo-SEO Schema & Google Map Pack Push',
              description: 'Injected JSON-LD LocalBusiness schema, synchronized 40+ directory citations, and updated service areas.',
              status: 'in_progress'
            },
            {
              id: 'ms_4',
              title: 'Autonomous Lead Funnel & SMS Notification Flow',
              description: 'Configured high-converting click-to-call mobile lead magnet and instant dispatcher notifications.',
              status: 'pending'
            },
            {
              id: 'ms_5',
              title: 'Monthly Executive ROI Review & Proof of Work Delivery',
              description: 'Generate white-label performance PDF with before-and-after conversion comparisons and ranking metrics.',
              status: 'pending'
            }
          ]
        });
        this.save();
      }
    }

    return this.data.clientProjects.filter(p => p.contractorId === contractorId);
  }

  public createClientProject(contractorId: string, project: Omit<ClientProjectDb, 'contractorId'>): ClientProjectDb {
    if (!this.data.clientProjects) {
      this.data.clientProjects = [];
    }
    const item: ClientProjectDb = {
      ...project,
      contractorId
    };
    this.data.clientProjects.unshift(item);
    this.save();
    return item;
  }

  public updateClientProject(id: string, contractorId: string, updates: Partial<ClientProjectDb>): ClientProjectDb | null {
    if (!this.data.clientProjects) return null;
    const idx = this.data.clientProjects.findIndex(p => p.id === id && p.contractorId === contractorId);
    if (idx < 0) return null;

    const existing = this.data.clientProjects[idx];
    const updated: ClientProjectDb = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.clientProjects[idx] = updated;
    this.save();
    return updated;
  }

  public getProjectByPortalToken(token: string): ClientProjectDb | null {
    if (!this.data.clientProjects) return null;
    return this.data.clientProjects.find(p => p.portalAccessToken === token) || null;
  }
}

export const db = new Database();

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'salt-for-halbiz', 1000, 64, 'sha512').toString('hex');
}
