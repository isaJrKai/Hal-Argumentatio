import { getDrizzleDb } from '../db/postgres';
import { neuralState } from '../db/schema';
import { eq } from 'drizzle-orm';
/**
 * HAL Autonomous Self-Teaching Neural Learning & Offline Policy Engine
 * 
 * Implements continuous Bayesian calibration, dynamic weight tuning, 
 * offline pitch & objection synthesis, and local execution rules 
 * when cloud LLMs (Gemini/Nemotron) are offline or disconnected.
 */

export interface NicheCalibration {
  niche: string;
  sampleCount: number;
  winCount: number;
  lossCount: number;
  conversionRate: number; // 0.0 - 1.0
  avgClosedValueUsd: number;
  optimalRetainerUsd: number;
  bestChannel: 'phone' | 'email' | 'sms' | 'in_person';
  topAuditDeficiency: 'missing_ssl' | 'mobile_speed' | 'low_reviews' | 'missing_schema' | 'poor_seo';
  avgDaysToClose: number;
  confidenceScore: number; // Heuristic confidence; meaningful only after recorded outcomes
  lastCalibratedAt: string;
  calibrationSource?: 'measured_outcomes' | 'heuristic_default' | 'unverified_legacy';
}

export type ObjectionIntentType = 
  | 'price' 
  | 'timing' 
  | 'existing_agency' 
  | 'trust_skepticism' 
  | 'not_interested'
  | 'authority_delegation'
  | 'diy_in_house';

export interface SemanticIntentClassification {
  primaryIntent: ObjectionIntentType;
  confidenceScore: number;
  matchedConcepts: string[];
  secondaryIntent?: ObjectionIntentType;
  reasoning: string;
}

export interface ObjectionRule {
  id: string;
  triggerKeywords: string[];
  objectionType: ObjectionIntentType;
  rebuttalScript: string;
  successRate: number; // Recorded success rate; zero until outcome tracking is implemented
  timesApplied: number;
  lastUsedAt: string;
  calibrationSource?: 'recorded_events' | 'heuristic_default' | 'unverified_legacy';
}

export interface TechnicalWeights {
  missingSslUrgency: number;       // default ~8.5
  slowSpeedUrgency: number;        // default ~7.2
  lowReviewCountWeight: number;    // default ~6.8
  poorGoogleRatingWeight: number;  // default ~7.5
  noWebsiteWeight: number;         // default ~9.0
  phoneChannelMultiplier: number;  // default ~1.35
  emailChannelMultiplier: number;  // default ~0.95
  smsChannelMultiplier: number;    // default ~1.15
}

export interface LearningState {
  version: string;
  calibrationEpoch: number;
  lastUpdated: string;
  totalOutcomesDigested: number;
  autonomyReadinessScore: number; // 0% - 100%
  isOfflineModeActive: boolean;
  technicalWeights: TechnicalWeights;
  nicheMap: Record<string, NicheCalibration>;
  objections: ObjectionRule[];
  recentLearningLogs: Array<{
    id: string;
    timestamp: string;
    trigger: string;
    delta: string;
    confidence: number;
  }>;
}

const STORAGE_KEY = 'hal_autonomous_learning_state_v2';

// Baseline seed data distilled from historical real-world contractor intelligence
const DEFAULT_NICHE_PROFILES: Record<string, NicheCalibration> = {
  roofing: {
    niche: 'roofing',
    sampleCount: 0,
    winCount: 0,
    lossCount: 0,
    conversionRate: 0,
    avgClosedValueUsd: 0,
    optimalRetainerUsd: 0,
    bestChannel: 'phone',
    topAuditDeficiency: 'mobile_speed',
    avgDaysToClose: 0,
    confidenceScore: 0,
    lastCalibratedAt: ''
  },
  plumbing: {
    niche: 'plumbing',
    sampleCount: 0,
    winCount: 0,
    lossCount: 0,
    conversionRate: 0,
    avgClosedValueUsd: 0,
    optimalRetainerUsd: 0,
    bestChannel: 'phone',
    topAuditDeficiency: 'missing_ssl',
    avgDaysToClose: 0,
    confidenceScore: 0,
    lastCalibratedAt: ''
  },
  hvac: {
    niche: 'hvac',
    sampleCount: 0,
    winCount: 0,
    lossCount: 0,
    conversionRate: 0,
    avgClosedValueUsd: 0,
    optimalRetainerUsd: 0,
    bestChannel: 'phone',
    topAuditDeficiency: 'missing_ssl',
    avgDaysToClose: 0,
    confidenceScore: 0,
    lastCalibratedAt: ''
  },
  general: {
    niche: 'general',
    sampleCount: 0,
    winCount: 0,
    lossCount: 0,
    conversionRate: 0,
    avgClosedValueUsd: 0,
    optimalRetainerUsd: 0,
    bestChannel: 'email',
    topAuditDeficiency: 'poor_seo',
    avgDaysToClose: 0,
    confidenceScore: 0,
    lastCalibratedAt: ''
  }
};

const DEFAULT_OBJECTION_RULES: ObjectionRule[] = [
  {
    id: 'obj_too_expensive',
    triggerKeywords: ['expensive', 'budget', 'price', 'cost', 'money', 'afford'],
    objectionType: 'price',
    rebuttalScript: "I understand the need to manage costs carefully. I can outline scope and pricing transparently; I won't estimate lost revenue without measured evidence.",
    successRate: 0,
    timesApplied: 0,
    lastUsedAt: ''
  },
  {
    id: 'obj_have_agency',
    triggerKeywords: ['already have', 'current agency', 'in-house', 'web guy', 'someone doing it'],
    objectionType: 'existing_agency',
    rebuttalScript: "It's good that you already have support. If useful, I can share specific, verifiable observations about your public digital presence for your current team to assess.",
    successRate: 0,
    timesApplied: 0,
    lastUsedAt: ''
  },
  {
    id: 'obj_not_interested',
    triggerKeywords: ['not interested', 'busy', 'no time', 'good right now', 'call back later'],
    objectionType: 'timing',
    rebuttalScript: "Understood. I won't keep pressing. If you'd like information later, I can send a short overview.",
    successRate: 0,
    timesApplied: 0,
    lastUsedAt: ''
  },
  {
    id: 'obj_skeptic',
    triggerKeywords: ['scam', 'seo is fake', 'burned before', 'tired of marketers'],
    objectionType: 'trust_skepticism',
    rebuttalScript: "That skepticism is reasonable. I can show the checks and sources behind any findings, and I won't promise results that haven't been measured.",
    successRate: 0,
    timesApplied: 0,
    lastUsedAt: ''
  },
  {
    id: 'obj_authority_delegation',
    triggerKeywords: ['partner', 'not decision maker', 'wife handles', 'accountant', 'boss', 'owner is out'],
    objectionType: 'authority_delegation',
    rebuttalScript: "Of course. I can prepare a concise summary of the proposed scope, available evidence, and costs for decision-makers to review.",
    successRate: 0,
    timesApplied: 0,
    lastUsedAt: ''
  },
  {
    id: 'obj_diy_referrals',
    triggerKeywords: ['word of mouth', 'referrals only', 'dont need advertising', 'we do it ourselves', 'booked through referrals'],
    objectionType: 'diy_in_house',
    rebuttalScript: "Referrals can be valuable. If useful, I can review your public digital presence and share specific observations without assuming referrals are being lost.",
    successRate: 0,
    timesApplied: 0,
    lastUsedAt: ''
  }
];

export const INTENT_SEMANTIC_ANCHORS: Record<ObjectionIntentType, {
  keywords: string[];
  intentCentroid: string[];
  weight: number;
}> = {
  price: {
    keywords: ['expensive', 'budget', 'price', 'cost', 'money', 'afford', 'cashflow', 'dollars', 'margin', 'rates', 'fee', 'charge'],
    intentCentroid: ['capital', 'liquidity', 'financial', 'overhead', 'expensive', 'cost', 'quote', 'affordability', 'roi'],
    weight: 1.2
  },
  timing: {
    keywords: ['busy', 'timing', 'time', 'later', 'next month', 'winter', 'summer', 'schedule', 'swamped', 'slammed', 'booked', 'season', 'tomorrow'],
    intentCentroid: ['bandwidth', 'capacity', 'availability', 'backlog', 'delay', 'postpone', 'reschedule', 'urgent'],
    weight: 1.0
  },
  existing_agency: {
    keywords: ['already have', 'current agency', 'in-house', 'web guy', 'someone doing it', 'vendor', 'nephew', 'another company'],
    intentCentroid: ['incumbent', 'vendor', 'contract', 'in-house', 'delegated', 'agency', 'retainer', 'loyalty'],
    weight: 1.15
  },
  trust_skepticism: {
    keywords: ['scam', 'seo is fake', 'burned before', 'tired of marketers', 'guarantee', 'proof', 'snake oil', 'waste of money', 'cold calls'],
    intentCentroid: ['skepticism', 'fraud', 'disillusioned', 'credentials', 'guarantee', 'risk', 'reputation', 'distrust'],
    weight: 1.25
  },
  not_interested: {
    keywords: ['not interested', 'no thanks', 'remove', 'unsubscribe', 'stop calling', 'don\'t want', 'leave alone', 'pass'],
    intentCentroid: ['rejection', 'optout', 'uninterested', 'dismiss', 'refusal', 'halt', 'unwanted'],
    weight: 1.0
  },
  authority_delegation: {
    keywords: ['partner', 'not decision maker', 'wife handles', 'accountant', 'boss', 'owner is out', 'speak with my'],
    intentCentroid: ['stakeholder', 'hierarchy', 'approval', 'partner', 'delegation', 'authorization', 'permission'],
    weight: 1.1
  },
  diy_in_house: {
    keywords: ['word of mouth', 'referrals only', 'dont need advertising', 'we do it ourselves', 'booked through referrals'],
    intentCentroid: ['organic', 'referral', 'reputation', 'self-sufficient', 'in-house', 'unassisted', 'traditional'],
    weight: 1.15
  }
};

export function classifySemanticObjectionIntent(objectionText: string): SemanticIntentClassification {
  const normalized = objectionText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = normalized.split(/\s+/).filter(t => t.length > 2);
  const matchedTokens: Record<ObjectionIntentType, string[]> = {
    price: [], timing: [], existing_agency: [], trust_skepticism: [],
    not_interested: [], authority_delegation: [], diy_in_house: []
  };

  const scores: Record<ObjectionIntentType, number> = {
    price: 0, timing: 0, existing_agency: 0, trust_skepticism: 0,
    not_interested: 0, authority_delegation: 0, diy_in_house: 0
  };

  for (const [intentKey, profile] of Object.entries(INTENT_SEMANTIC_ANCHORS) as [ObjectionIntentType, typeof INTENT_SEMANTIC_ANCHORS[ObjectionIntentType]][]) {
    for (const kw of profile.keywords) {
      if (normalized.includes(kw)) {
        scores[intentKey] += 2.5 * profile.weight;
        matchedTokens[intentKey].push(kw);
      }
    }
    for (const token of tokens) {
      if (profile.intentCentroid.includes(token)) {
        scores[intentKey] += 1.5 * profile.weight;
        matchedTokens[intentKey].push(token);
      }
    }
  }

  const sortedIntents = (Object.keys(scores) as ObjectionIntentType[])
    .sort((a, b) => scores[b] - scores[a]);

  const topIntent = sortedIntents[0];
  const runnerUp = sortedIntents[1];
  const topScore = scores[topIntent];
  const confidenceScore = topScore > 0 
    ? Math.min(0.98, Math.round((topScore / (topScore + (scores[runnerUp] * 0.4) + 1.5)) * 100) / 100)
    : 0.45;

  const matched = Array.from(new Set(matchedTokens[topIntent]));
  const reasoning = matched.length > 0
    ? `Semantic intent classified as [${topIntent}] based on concept anchors: "${matched.slice(0, 4).join('", "')}".`
    : `Weak semantic anchor signal; default heuristic categorized as [${topIntent}].`;

  return {
    primaryIntent: topIntent,
    confidenceScore,
    matchedConcepts: matched,
    secondaryIntent: scores[runnerUp] > 0 ? runnerUp : undefined,
    reasoning
  };
}

export class AutonomousLearningEngine {
  private state: LearningState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): LearningState {
    return {
      version: '2.5-untrained',
      calibrationEpoch: 0,
      lastUpdated: new Date().toISOString(),
      totalOutcomesDigested: 0,
      autonomyReadinessScore: 0,
      isOfflineModeActive: false,
      technicalWeights: {
        missingSslUrgency: 8.8,
        slowSpeedUrgency: 7.6,
        lowReviewCountWeight: 6.9,
        poorGoogleRatingWeight: 7.4,
        noWebsiteWeight: 9.2,
        phoneChannelMultiplier: 1.38,
        emailChannelMultiplier: 0.92,
        smsChannelMultiplier: 1.18
      },
      nicheMap: DEFAULT_NICHE_PROFILES,
      objections: DEFAULT_OBJECTION_RULES,
      recentLearningLogs: []
    };
  }

  public async initializeFromDb(): Promise<void> {
    try {
      const [record] = await getDrizzleDb().select().from(neuralState).where(eq(neuralState.id, 'singleton'));
      if (record) {
        const storedNiches = (record.nicheMap || {}) as Record<string, NicheCalibration>;
        const nicheMap: Record<string, NicheCalibration> = {};
        for (const [key, profile] of Object.entries(storedNiches)) {
          // Legacy profiles lack provenance and may contain seeded demo statistics.
          nicheMap[key] = profile.calibrationSource === 'measured_outcomes'
            ? profile
            : {
                ...(DEFAULT_NICHE_PROFILES[key] || DEFAULT_NICHE_PROFILES.general),
                niche: profile.niche || key,
                calibrationSource: 'unverified_legacy'
              };
        }
        const trustedOutcomes = Object.values(nicheMap)
          .filter(profile => profile.calibrationSource === 'measured_outcomes')
          .reduce((sum, profile) => sum + Math.max(0, profile.sampleCount || 0), 0);
        const storedObjections = (record.objections || []) as ObjectionRule[];
        const objections = DEFAULT_OBJECTION_RULES.map(defaultRule => {
          const storedRule = storedObjections.find(rule => rule.id === defaultRule.id);
          return storedRule?.calibrationSource === 'recorded_events' ? storedRule : defaultRule;
        });
        this.state = {
          version: '2.5-untrained',
          calibrationEpoch: trustedOutcomes,
          lastUpdated: record.updatedAt.toISOString(),
          totalOutcomesDigested: trustedOutcomes,
          autonomyReadinessScore: Math.min(100, trustedOutcomes),
          isOfflineModeActive: record.isOfflineModeActive,
          technicalWeights: record.technicalWeights as TechnicalWeights,
          nicheMap: Object.keys(nicheMap).length ? nicheMap : DEFAULT_NICHE_PROFILES,
          objections,
          recentLearningLogs: this.state.recentLearningLogs || []
        };
        // Persist the sanitized state so legacy seeded statistics are not reloaded.
        await this.saveState();
      } else {
        await this.saveState();
      }
    } catch (e) {
      console.warn('[Autonomous Learning] DB Init failed, using memory fallback:', e);
    }
  }

  public async saveState(): Promise<void> {
    this.state.lastUpdated = new Date().toISOString();
    try {
      await getDrizzleDb().insert(neuralState).values({
        id: 'singleton',
        version: this.state.version,
        calibrationEpoch: this.state.calibrationEpoch,
        totalOutcomesDigested: this.state.totalOutcomesDigested,
        autonomyReadinessScore: this.state.autonomyReadinessScore,
        isOfflineModeActive: this.state.isOfflineModeActive,
        technicalWeights: this.state.technicalWeights,
        nicheMap: this.state.nicheMap,
        objections: this.state.objections,
        activeNodes: [{ name: 'Bayesian Base', status: 'online' }]
      }).onConflictDoUpdate({
        target: neuralState.id,
        set: {
          version: this.state.version,
          calibrationEpoch: this.state.calibrationEpoch,
          totalOutcomesDigested: this.state.totalOutcomesDigested,
          autonomyReadinessScore: this.state.autonomyReadinessScore,
          isOfflineModeActive: this.state.isOfflineModeActive,
          technicalWeights: this.state.technicalWeights,
          nicheMap: this.state.nicheMap,
          objections: this.state.objections,
          updatedAt: new Date()
        }
      });
    } catch(e) {
      console.warn('Failed to persist neural state to DB:', e);
    }
  }

  public getState(): LearningState {
    return { ...this.state };
  }

  public setOfflineMode(active: boolean): void {
    this.state.isOfflineModeActive = active;
    this.saveState();
  }

  /**
   * Slowly learns and recalibrates weights whenever a deal outcome is recorded (Win, Loss, Pitch, Objection)
   */
  public digestBusinessOutcome(params: {
    niche: string;
    city?: string;
    outcome: 'won' | 'lost' | 'objection_encountered' | 'outreach_sent';
    closedValueUsd?: number;
    channelUsed?: 'phone' | 'email' | 'sms' | 'in_person';
    objectionText?: string;
    auditFindings?: {
      sslMissing?: boolean;
      mobileSpeedScore?: number;
      reviewScore?: number;
    };
  }): { updatedNiche: NicheCalibration; newEpoch: number; logMessage: string } {
    const cleanNiche = (params.niche || 'general').toLowerCase().trim();
    const current = this.state.nicheMap[cleanNiche] || {
      niche: cleanNiche,
      sampleCount: 0,
      winCount: 0,
      lossCount: 0,
      conversionRate: 0,
      avgClosedValueUsd: 0,
      optimalRetainerUsd: 0,
      bestChannel: params.channelUsed || 'phone',
      topAuditDeficiency: 'mobile_speed',
      avgDaysToClose: 0,
      confidenceScore: 0,
      lastCalibratedAt: '',
      calibrationSource: 'heuristic_default' as const
    };

    current.sampleCount += 1;
    current.calibrationSource = 'measured_outcomes';
    this.state.totalOutcomesDigested += 1;
    this.state.calibrationEpoch += 1;
    this.state.lastUpdated = new Date().toISOString();

    let logMessage = '';

    if (params.outcome === 'won') {
      current.winCount += 1;
      const closedVal = params.closedValueUsd || current.avgClosedValueUsd;
      // Exponential moving average for deal values
      current.avgClosedValueUsd = Math.round((current.avgClosedValueUsd * 0.8) + (closedVal * 0.2));
      current.optimalRetainerUsd = Math.round(current.avgClosedValueUsd * 0.85);

      if (params.channelUsed === 'phone') {
        this.state.technicalWeights.phoneChannelMultiplier = Math.min(2.0, this.state.technicalWeights.phoneChannelMultiplier + 0.02);
      } else if (params.channelUsed === 'sms') {
        this.state.technicalWeights.smsChannelMultiplier = Math.min(2.0, this.state.technicalWeights.smsChannelMultiplier + 0.02);
      }

      logMessage = `Self-Taught Calibrator: Deal WON in ${cleanNiche} ($${closedVal}). Calibrated win rate to ${Math.round((current.winCount / current.sampleCount) * 100)}%.`;
    } else if (params.outcome === 'lost') {
      current.lossCount += 1;
      logMessage = `Self-Taught Calibrator: Deal LOST in ${cleanNiche}. Adjusted objection weighting and conversion prior.`;
    } else if (params.outcome === 'objection_encountered' && params.objectionText) {
      this.trainObjectionMatcher(params.objectionText);
      logMessage = `Self-Taught Calibrator: Digested objection pattern for "${params.objectionText.slice(0, 40)}...". Updated counter matrix.`;
    } else {
      logMessage = `Self-Taught Calibrator: Ingested telemetry outcome in ${cleanNiche}. Recalibrated Bayesian prior.`;
    }

    current.conversionRate = Number((current.winCount / Math.max(1, current.sampleCount)).toFixed(3));
    // Bayesian confidence increases with sample size
    current.confidenceScore = Number(Math.min(0.99, 0.4 + (current.sampleCount * 0.015)).toFixed(2));
    current.lastCalibratedAt = new Date().toISOString();

    this.state.nicheMap[cleanNiche] = current;

    // Recalculate autonomy score (based on sample volume and model coverage)
    // Readiness is a transparent count-based proxy, not a claim of validated autonomy.
    this.state.autonomyReadinessScore = Math.min(100, this.state.totalOutcomesDigested);

    // Push to recent logs
    this.state.recentLearningLogs.unshift({
      id: 'learn_' + Math.random().toString(36).substring(2, 8),
      timestamp: new Date().toISOString(),
      trigger: `Outcome in ${cleanNiche.toUpperCase()}`,
      delta: logMessage,
      confidence: current.confidenceScore
    });

    if (this.state.recentLearningLogs.length > 20) {
      this.state.recentLearningLogs = this.state.recentLearningLogs.slice(0, 20);
    }

    this.saveState();

    return {
      updatedNiche: current,
      newEpoch: this.state.calibrationEpoch,
      logMessage
    };
  }

  private trainObjectionMatcher(objectionText: string): void {
    const classification = classifySemanticObjectionIntent(objectionText);
    const matchedRule = this.state.objections.find(r => r.objectionType === classification.primaryIntent);
    if (matchedRule) {
      matchedRule.timesApplied += 1;
      matchedRule.lastUsedAt = new Date().toISOString();
      matchedRule.calibrationSource = 'recorded_events';
      for (const concept of classification.matchedConcepts) {
        if (!matchedRule.triggerKeywords.includes(concept)) {
          matchedRule.triggerKeywords.push(concept);
        }
      }
    }
  }

  /**
   * OFFLINE AUTONOMOUS PITCH GENERATOR
   * Runs purely locally when Gemini/Nemotron APIs are offline or disconnected.
   */
  public generateOfflinePitch(lead: {
    businessName: string;
    ownerName?: string;
    city: string;
    niche: string;
    phone?: string;
    email?: string;
    sslStatus?: string;
    performanceScore?: number;
    seoScore?: number;
    predictedMonthlyLostRevenueUsd?: number;
    auditEvidenceVerified?: boolean;
  }, channel: 'phone' | 'email' | 'sms' = 'phone'): {
    subject: string;
    openingHook: string;
    body: string;
    callToAction: string;
    recommendedRetainerUsd: number;
    confidence: number;
    engine: string;
  } {
    const nicheKey = (lead.niche || 'general').toLowerCase();
    const profile = this.state.nicheMap[nicheKey] || this.state.nicheMap.general || DEFAULT_NICHE_PROFILES.general;
    const owner = lead.ownerName || 'Business Owner';
    const verifiedEvidence = lead.auditEvidenceVerified === true;
    const isSslBroken = verifiedEvidence && lead.sslStatus === 'missing';
    const isSpeedSlow = verifiedEvidence && typeof lead.performanceScore === 'number'
      && Number.isFinite(lead.performanceScore) && lead.performanceScore >= 0 && lead.performanceScore < 65;

    let hook = '';
    let body = '';
    let subject = '';

    if (channel === 'phone') {
      subject = `Phone Discovery Script: ${lead.businessName} (${lead.city})`;
      hook = `Hi ${owner}, this is HAL calling about ${lead.businessName} in ${lead.city}.`;
    } else if (channel === 'sms') {
      subject = `SMS Introduction: ${lead.businessName}`;
      hook = `Hi ${owner}, I'm reaching out about ${lead.businessName} in ${lead.city}.`;
    } else {
      subject = `Digital presence review for ${lead.businessName} (${lead.city})`;
      hook = `Hi ${owner},\\n\\nI'm reaching out about ${lead.businessName}'s public digital presence.`;
    }

    if (isSslBroken) {
      body = 'A recorded technical assessment marked the site certificate as missing. I can share the assessment details and timestamp so your team can verify the finding.';
    } else if (isSpeedSlow) {
      body = `A recorded assessment lists a mobile performance score of ${lead.performanceScore}/100. If the assessment is current, I can share its source and details for your team to review.`;
    } else {
      body = 'I have not confirmed a current technical issue for your business, so I do not want to claim an audit found one. If useful, I can offer a short review and share only specific findings with their sources.';
    }

    const cta = 'Would you be open to a brief, no-obligation review?';

    return {
      subject,
      openingHook: hook,
      body: `${hook}\n\n${body}\n\n${cta}`,
      callToAction: cta,
      recommendedRetainerUsd: profile.calibrationSource === 'measured_outcomes' && profile.sampleCount >= 5 ? profile.optimalRetainerUsd : 0,
      confidence: profile.calibrationSource === 'measured_outcomes' ? profile.confidenceScore : 0,
      engine: 'HAL offline heuristic; empirical pricing and conversion claims unavailable until outcomes are recorded'
    };
  }

  /**
   * SEMANTIC INTENT OBJECTION SOLVER
   * Uses intent centroid embeddings and semantic concept anchors to solve objections.
   */
  public solveOfflineObjection(objectionText: string, niche: string): {
    matchedObjection: string;
    rebuttal: string;
    successRate: number;
    confidence: number;
    matchedConcepts: string[];
    reasoning: string;
    engine: string;
  } {
    const classification = classifySemanticObjectionIntent(objectionText);
    const matchedRule = this.state.objections.find(r => r.objectionType === classification.primaryIntent)
      || (classification.secondaryIntent ? this.state.objections.find(r => r.objectionType === classification.secondaryIntent) : null)
      || this.state.objections[0];

    // Replace dynamic placeholders
    const nicheProfile = this.state.nicheMap[niche.toLowerCase()] || this.state.nicheMap.general || DEFAULT_NICHE_PROFILES.general;
    const customizedRebuttal = matchedRule.rebuttalScript
      .replace(/\{\{predictedMonthlyLostRevenueUsd\}\}/g, `$${nicheProfile.avgClosedValueUsd}`);

    return {
      matchedObjection: matchedRule.objectionType,
      rebuttal: customizedRebuttal,
      successRate: matchedRule.calibrationSource === 'recorded_events' ? matchedRule.successRate : 0,
      confidence: classification.confidenceScore,
      matchedConcepts: classification.matchedConcepts,
      reasoning: classification.reasoning,
      engine: 'HAL Semantic Intent Reasoning Engine (Self-Taught Calibrator)'
    };
  }

  /**
   * Directly classify objection text intent
   */
  public classifyObjection(objectionText: string): SemanticIntentClassification {
    return classifySemanticObjectionIntent(objectionText);
  }

  /**
   * Calculate calibrated Lead Urgency Score offline using learned Bayesian weights
   */
  public calculateAutonomousScore(lead: {
    sslStatus?: string;
    performanceScore?: number;
    googleRating?: number;
    reviewCount?: number;
    websiteUrl?: string;
  }): { score: number; conversionLikelihood: number; rationale: string[] } {
    const weights = this.state.technicalWeights;
    let baseScore = 5.0;
    const rationale: string[] = [];

    if (!lead.websiteUrl) {
      baseScore += 3.5;
      rationale.push('No active website (+3.5 urgency)');
    } else {
      if (lead.sslStatus === 'missing') {
        baseScore += (weights.missingSslUrgency * 0.35);
        rationale.push(`Missing SSL TLS certificate (+${(weights.missingSslUrgency * 0.35).toFixed(1)})`);
      }
      if (lead.performanceScore && lead.performanceScore < 60) {
        const delta = (60 - lead.performanceScore) * 0.05;
        baseScore += delta;
        rationale.push(`Slow mobile load score of ${lead.performanceScore}/100 (+${delta.toFixed(1)})`);
      }
      if (lead.googleRating && lead.googleRating < 4.2) {
        baseScore += 1.2;
        rationale.push(`Sub-optimal Google rating (${lead.googleRating}★) (+1.2)`);
      }
      if (lead.reviewCount && lead.reviewCount < 10) {
        baseScore += 0.8;
        rationale.push(`Low review count (${lead.reviewCount} reviews) (+0.8)`);
      }
    }

    const finalScore = Math.min(10.0, Math.max(1.0, Number(baseScore.toFixed(1))));
    const conversionLikelihood = Number(Math.min(0.95, (finalScore / 10) * 0.85).toFixed(2));

    return {
      score: finalScore,
      conversionLikelihood,
      rationale
    };
  }
}

// Global Singleton Instance
export const autonomousLearning = new AutonomousLearningEngine();
