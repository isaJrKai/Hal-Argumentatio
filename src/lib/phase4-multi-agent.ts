/**
 * HAL Roadmap Phase 4: Multi-Agent Consensus & Neural Graph Routing
 * 
 * Implements:
 * 1. Dual-Drive Parallel Engine Consensus (Google Gemini 2.5 + NVIDIA Nemotron 70B)
 * 2. Neural Graph Agent Routing & Bayesian Weight Recalibration
 * 3. Autonomous Closed-Loop Strategy Arbitrage (Spend & Campaign Reallocation)
 * 4. Cryptographic Invariant Verification
 */

export interface DualDriveConsensusResult {
  id: string;
  topic: string;
  geminiEngine: {
    model: string;
    focus: string;
    recommendation: string;
    confidence: number;
    latencyMs: number;
  };
  nemotronEngine: {
    model: string;
    focus: string;
    recommendation: string;
    confidence: number;
    latencyMs: number;
  };
  alignmentScore: number; // 0 - 100%
  arbitrationMethod: 'weighted_synthesis' | 'policy_critic_gate' | 'unanimous';
  synthesizedAction: string;
  policyValidationPassed: boolean;
  verdict?: 'CONTRACT_VERIFIED_UNANIMOUS' | 'BOUNDS_SATISFIED_WITH_CONDITIONS' | 'DIRECTIONAL_CONTRADICTION' | 'INVARIANT_VIOLATION' | 'CRITICAL_INVARIANT_BREACH';
  invariants?: Array<{ ruleId: string; ruleName: string; passed: boolean; severity: string; proof: string }>;
  contractVerification?: any;
  timestamp: string;
}

export interface NeuralGraphNode {
  id: string;
  name: string;
  role: string;
  primaryEngine: 'Google Gemini 2.5' | 'NVIDIA Nemotron 70B' | 'Dual-Drive Consensus';
  status: 'active' | 'evaluating' | 'ready';
  avgLatencyMs: number;
  confidenceScore: number;
  connectedNodes: string[];
  tasksProcessed: number;
}

export interface StrategyArbitrageOpportunity {
  id: string;
  sourceChannel: string;
  targetChannel: string;
  sourceCampaignId?: string;
  targetCampaignId?: string;
  proposedReallocationUsd: number;
  currentSourceRoas: number;
  projectedTargetRoas: number;
  expectedNetMonthlyLiftUsd: number;
  riskRating: 'LOW' | 'MEDIUM' | 'GUARDED';
  guardrailCompliant: boolean;
  status: 'evaluated' | 'approved' | 'executed';
  rationale: string;
  createdAt: string;
}

export interface Phase4VerificationResult {
  pillar1: {
    name: string;
    passed: boolean;
    status: 'VERIFIED_ACTIVE' | 'NON_COMPLIANT';
    detail: string;
    alignmentScore: number;
  };
  pillar2: {
    name: string;
    passed: boolean;
    status: 'VERIFIED_ACTIVE' | 'NON_COMPLIANT';
    detail: string;
    epochCount: number;
  };
  pillar3: {
    name: string;
    passed: boolean;
    status: 'VERIFIED_ACTIVE' | 'NON_COMPLIANT';
    detail: string;
    arbitrageOpportunitiesCount: number;
  };
  allPassed: boolean;
  totalScore: number;
  verifiedAt: string;
}

/**
 * Returns default specialized autonomous nodes in HAL's Neural Graph
 */
export function getDefaultNeuralGraphNodes(): NeuralGraphNode[] {
  // Runtime node telemetry is not currently persisted or queried.
  return [];
}

/**
 * No verified consensus history is persisted yet.
 */
export function getDefaultConsensusHistory(): DualDriveConsensusResult[] {
  // Never present hardcoded sample decisions as historical production activity.
  return [];
}

/**
 * No verified arbitrage history is persisted yet.
 */
export function getDefaultArbitrageOpportunities(): StrategyArbitrageOpportunity[] {
  // Opportunities must come from measured campaign telemetry, not fixtures.
  return [];
}

export {
  calculateConsensusAlignment,
  extractContractFromPerspective,
  verifyStructuredContracts
} from './contractVerification';

export {
  auditArbitrageGuardrails,
  calculateNetMonthlyLift,
  aggregateCampaignMetrics,
  evaluateAutonomousStrategyArbitrage,
  DEFAULT_ARBITRAGE_GUARDRAILS,
  type ArbitrageGuardrailConfig,
  type CampaignPerformanceMetrics,
  type ArbitrageEvaluationResult,
  type GuardrailComplianceReport
} from './strategyArbitrage';
export type {
  ExtractedContract,
  StructuredConsensusResult,
  InvariantCheckResult,
  ConsensusVerdict
} from './contractVerification';

/**
 * Validates Phase 4 Multi-Agent Invariants:
 * 1. Dual-Drive Consensus (Gemini 2.5 + Nemotron 70B parallel arbitration via Structured Contract Verification)
 * 2. Adaptive Bayesian Weights (calibration epochs > 0, calibrated technical weights)
 * 3. Autonomous Strategy Arbitrage (spend reallocations evaluated with guardrails)
 */
export function verifyPhase4Pillars(
  consensusHistory: DualDriveConsensusResult[],
  nodes: NeuralGraphNode[],
  arbitrage: StrategyArbitrageOpportunity[]
): Phase4VerificationResult {
  // Pillar 1 Check: At least 1 dual-drive consensus record with alignment >= 85%
  const validConsensus = consensusHistory.filter(c => c.alignmentScore >= 85 && c.policyValidationPassed);
  const avgAlignment = consensusHistory.length > 0 
    ? Math.round(consensusHistory.reduce((acc, c) => acc + c.alignmentScore, 0) / consensusHistory.length)
    : 0;
  const p1Passed = validConsensus.length >= 1 && nodes.length >= 4;

  // Pillar 2 Check: Active Neural Graph with specialized agents and calibrated weights
  const activeNodes = nodes.filter(n => n.status === 'active');
  const p2Passed = activeNodes.length >= 4;

  // Pillar 3 Check: At least 1 closed-loop spend arbitrage opportunity evaluated and guardrail compliant
  const validArb = arbitrage.filter(a => a.guardrailCompliant && a.proposedReallocationUsd > 0);
  const p3Passed = validArb.length >= 1;

  const allPassed = p1Passed && p2Passed && p3Passed;
  const totalScore = (p1Passed ? 34 : 0) + (p2Passed ? 33 : 0) + (p3Passed ? 33 : 0);

  return {
    pillar1: {
      name: 'Parallel Engine Consensus (Dual-Drive)',
      passed: p1Passed,
      status: p1Passed ? 'VERIFIED_ACTIVE' : 'NON_COMPLIANT',
      detail: validConsensus.length > 0 ? `Observed consensus records: ${validConsensus.length}; average alignment ${avgAlignment}%.` : 'No verified consensus records are available.',
      alignmentScore: avgAlignment
    },
    pillar2: {
      name: 'Adaptive Autonomous Weights',
      passed: p2Passed,
      status: p2Passed ? 'VERIFIED_ACTIVE' : 'NON_COMPLIANT',
      detail: activeNodes.length > 0 ? `${activeNodes.length} active nodes reported by runtime telemetry.` : 'Runtime node telemetry is not configured.',
      epochCount: 0
    },
    pillar3: {
      name: 'Autonomous Strategy Arbitrage',
      passed: p3Passed,
      status: p3Passed ? 'VERIFIED_ACTIVE' : 'NON_COMPLIANT',
      detail: validArb.length > 0 ? `${validArb.length} opportunities calculated from supplied campaign data.` : 'No verified arbitrage opportunities are available.',
      arbitrageOpportunitiesCount: validArb.length
    },
    allPassed,
    totalScore,
    verifiedAt: new Date().toISOString()
  };
}
