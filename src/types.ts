export interface Lead {
  id: string;
  contractorId: string;
  businessName: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  city: string;
  serviceType: string;
  source: string;
  status: 'new' | 'contacted' | 'converted' | 'dead';
  urgencyScore: number;
  predictedLtvUsd: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;

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
  eventType: string;
  previousStage?: string;
  newStage?: string;
  dealValue?: number;
  currency?: string;
  metadata?: any;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  businessName?: string;
  city?: string;
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
  metric: string;
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

export interface ApiKey {
  id: string;
  contractorId: string;
  keyHash: string;
  prefix: string;
  name: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  contractorId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  targetTab?: string;
  targetEntityId?: string;
}

export interface Contractor {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  marketId?: string;
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

export interface OutreachSequenceStep {
  day: number;
  channel: 'email' | 'sms' | 'call' | 'linkedin';
  title: string;
  template: string;
  purpose: string;
}

export interface OutreachSequence {
  id: string;
  name: string;
  niche?: string;
  steps: OutreachSequenceStep[];
  createdAt: string;
}

export interface WinLossRecord {
  id: string;
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

export interface TechAuditReport {
  targetUrl: string;
  businessName?: string;
  city?: string;
  sslStatus: 'secured' | 'missing' | 'expired';
  sslExpiryDays?: number;
  mobileSpeedScore: number; // 0-100
  desktopSpeedScore: number; // 0-100
  seoHealthScore: number; // 0-100
  mobileViewportOptimized: boolean;
  hasGoogleMapsEmbed: boolean;
  estimatedLostLeadsMonthly: number;
  estimatedLostRevenueMonthlyUsd: number;
  identifiedVulnerabilities: string[];
  recommendedFixes: string[];
  generatedAt: string;
}

export interface ProposalDeck {
  id: string;
  leadId: string;
  clientName: string;
  companyName: string;
  preparedBy: string;
  packageTier: 'Growth' | 'Dominance' | 'Enterprise';
  monthlyRetainerUsd: number;
  setupFeeUsd: number;
  deliverables: string[];
  roiEstimateAnnualUsd: number;
  auditHighlights: string[];
  validUntil: string;
}

export interface ClientMilestone {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  deliverablesProof?: string;
}

export interface ClientAsset {
  id: string;
  name: string;
  category: 'logo' | 'brand_guidelines' | 'domain_access' | 'analytics_access' | 'photos' | 'copy';
  status: 'received' | 'pending' | 'verified';
  uploadedAt?: string;
  notes?: string;
}

export interface ClientProject {
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
  milestones: ClientMilestone[];
  assets: ClientAsset[];
  notes?: string;
  portalAccessToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSnapshot {
  currentMrrUsd: number;
  arrUsd: number;
  activeClientCount: number;
  averageContractLengthMonths: number;
  averageLtvUsd: number;
  blendedCacUsd: number;
  ltvToCacRatio: number;
  churnRatePercent: number;
  cashRunwayMonths: number;
  projectedMrr6Months: number;
  projectedMrr12Months: number;
  mrrHistory: { month: string; mrr: number; clients: number; newRevenue: number; churnedRevenue: number }[];
  tierDistribution: { tier: 'Growth' | 'Dominance' | 'Enterprise'; count: number; totalRevenue: number }[];
}



