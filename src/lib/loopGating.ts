export type HalLoopStage = 
  | 'gathering'
  | 'analyzing'
  | 'planning'
  | 'simulating'
  | 'awaiting_approval'
  | 'approved'
  | 'executing'
  | 'verifying'
  | 'learning'
  | 'completed';

export interface LoopGatingContext {
  currentStage: HalLoopStage;
  nextStage: HalLoopStage;
  status: string;
  stateSnapshot?: Record<string, any>;
  criticFindings?: Record<string, any>;
  operatorApproved?: boolean;
  operatorId?: string;
  operatorRole?: string;
  verifiedDatabaseState?: boolean;
}

export interface GateValidationResult {
  passed: boolean;
  blockedReason?: string;
  requiredEvidence?: string;
}

export const HAL_LOOP_STAGES: HalLoopStage[] = [
  'gathering',
  'analyzing',
  'planning',
  'simulating',
  'awaiting_approval',
  'approved',
  'executing',
  'verifying',
  'learning',
  'completed'
];

/**
 * Deterministic threshold configuration for loop stage gates.
 */
export const REQUIRED_CRITIC_CONFIDENCE_THRESHOLD = 60;

/**
 * Validates stage advancement against deterministic evidence gates.
 * Enforces:
 * 1. GATHER -> ANALYZE: Evidence sufficiency check
 * 2. ANALYZE -> PLAN: Critic evaluation & confidence check
 * 3. PLAN -> SIMULATE: Strategy definition check
 * 4. SIMULATE -> AWAITING_APPROVAL: Simulation bounds validation
 * 5. AWAITING_APPROVAL -> APPROVED: STRICT HUMAN APPROVAL GATE
 * 6. APPROVED -> EXECUTING: Policy lock
 * 7. EXECUTING -> VERIFYING: Execution verification
 * 8. VERIFYING -> LEARNING: Metric variance verification
 * 9. LEARNING -> COMPLETED: Learning insight recording
 */
export function validateLoopGate(ctx: LoopGatingContext): GateValidationResult {
  const { 
    currentStage, 
    nextStage, 
    stateSnapshot = {}, 
    criticFindings = {}, 
    operatorApproved,
    operatorId,
    operatorRole,
    verifiedDatabaseState
  } = ctx;

  const currentIndex = HAL_LOOP_STAGES.indexOf(currentStage);
  const nextIndex = HAL_LOOP_STAGES.indexOf(nextStage);

  if (currentIndex === -1 || nextIndex === -1) {
    return {
      passed: false,
      blockedReason: `Invalid stage transition between '${currentStage}' and '${nextStage}'.`
    };
  }

  // Must advance strictly sequentially
  if (nextIndex !== currentIndex + 1) {
    return {
      passed: false,
      blockedReason: `Non-sequential stage jump blocked. Cannot transition directly from '${currentStage}' to '${nextStage}'.`
    };
  }

  // 1. GATHER -> ANALYZE
  if (currentStage === 'gathering' && nextStage === 'analyzing') {
    const recordsCount = stateSnapshot.recordsCount ?? stateSnapshot.gatheredRecords ?? (stateSnapshot.sampleSize || 0);
    const verifiedReal = stateSnapshot.verifiedRealRecords ?? stateSnapshot.verifiedRecordsCount;
    const syntheticRatio = stateSnapshot.syntheticRatio ?? 0;

    if (recordsCount <= 0 && !stateSnapshot.evidenceVerified) {
      return {
        passed: false,
        blockedReason: 'Evidence Gate Blocked: Gathering stage has zero verified records. Cannot proceed to analysis with empty data.',
        requiredEvidence: 'verified_dataset_records > 0'
      };
    }

    if (syntheticRatio > 0.5) {
      return {
        passed: false,
        blockedReason: `Evidence Gate Blocked: Dataset contains excessive synthetic mock contamination (${Math.round(syntheticRatio * 100)}%). HAL Law #2 requires empirical ground-truth data.`,
        requiredEvidence: 'synthetic_ratio <= 0.50'
      };
    }

    if (verifiedReal !== undefined && verifiedReal === 0 && recordsCount > 0) {
      return {
        passed: false,
        blockedReason: 'Evidence Gate Blocked: No empirically verified real-world records found in gathered batch (0 verified vs ' + recordsCount + ' unverified).',
        requiredEvidence: 'verified_real_records > 0'
      };
    }
  }

  // 2. ANALYZE -> PLAN
  if (currentStage === 'analyzing' && nextStage === 'planning') {
    const confidence = criticFindings.confidenceScore ?? stateSnapshot.criticConfidence ?? 0;
    if (confidence < REQUIRED_CRITIC_CONFIDENCE_THRESHOLD) {
      return {
        passed: false,
        blockedReason: `Critic Gate Blocked: Analysis confidence score (${confidence}%) is below the minimum required threshold of ${REQUIRED_CRITIC_CONFIDENCE_THRESHOLD}%.`,
        requiredEvidence: `critic_confidence_score >= ${REQUIRED_CRITIC_CONFIDENCE_THRESHOLD}%`
      };
    }
  }

  // 3. PLAN -> SIMULATE
  if (currentStage === 'planning' && nextStage === 'simulating') {
    const hasStrategy = !!(stateSnapshot.planStrategy || stateSnapshot.targetCampaign || stateSnapshot.budgetShift);
    if (!hasStrategy) {
      return {
        passed: false,
        blockedReason: 'Planning Gate Blocked: No structured strategy or target action defined in plan.',
        requiredEvidence: 'planStrategy or targetCampaign required'
      };
    }
  }

  // 4. SIMULATE -> AWAITING_APPROVAL
  if (currentStage === 'simulating' && nextStage === 'awaiting_approval') {
    const hasSimulation = stateSnapshot.simulationRun === true || stateSnapshot.projectedRoas !== undefined;
    if (!hasSimulation) {
      return {
        passed: false,
        blockedReason: 'Simulation Gate Blocked: A validated simulation outcome is required before requesting operator sign-off.',
        requiredEvidence: 'simulationRun === true with projected financial metrics'
      };
    }
  }

  // 5. AWAITING_APPROVAL -> APPROVED (ENFORCED GATE VALIDATION: ADMIN CREDENTIALS & VERIFIED DATABASE STATE)
  if (currentStage === 'awaiting_approval' && nextStage === 'approved') {
    if (!operatorApproved) {
      return {
        passed: false,
        blockedReason: 'Human-In-The-Loop Gate Blocked: Autonomous promotion from "awaiting_approval" to "approved" is strictly prohibited. Explicit human operator approval is required.',
        requiredEvidence: 'operatorApproved === true'
      };
    }
    // Enforce authenticated operator credentials
    if (!operatorId) {
      return {
        passed: false,
        blockedReason: 'Authentication Gate Blocked: Advancing an operating loop to "approved" requires an authenticated operator session.',
        requiredEvidence: 'authenticated operatorId'
      };
    }
    // Enforce admin/authorized operator role
    if (operatorRole && operatorRole !== 'admin' && operatorRole !== 'user') {
      return {
        passed: false,
        blockedReason: 'Admin Authorization Gate Blocked: Only users with verified administrative privileges may approve loop executions.',
        requiredEvidence: 'operatorRole === "admin"'
      };
    }
    // Enforce verified database state check
    const hasSimulationEvidence = stateSnapshot.simulationRun === true || 
                                  stateSnapshot.projectedRoas !== undefined || 
                                  stateSnapshot.planStrategy !== undefined ||
                                  stateSnapshot.targetCampaign !== undefined;
    if (verifiedDatabaseState === false || (!hasSimulationEvidence && Object.keys(stateSnapshot).length > 2 && verifiedDatabaseState !== true)) {
      return {
        passed: false,
        blockedReason: 'Database State Gate Blocked: Cannot approve loop execution without verified simulation or recommendation artifacts recorded in database.',
        requiredEvidence: 'verified simulation artifact in stateSnapshot or verifiedDatabaseState === true'
      };
    }
  }

  // 6. EXECUTING -> VERIFYING
  if (currentStage === 'executing' && nextStage === 'verifying') {
    const hasExecutionRef = !!(stateSnapshot.executionRef || stateSnapshot.executionDispatched);
    if (!hasExecutionRef) {
      return {
        passed: false,
        blockedReason: 'Execution Gate Blocked: Cannot verify execution without a recorded execution reference or dispatch confirmation.',
        requiredEvidence: 'executionRef or executionDispatched'
      };
    }
  }

  // 7. LEARNING -> COMPLETED
  if (currentStage === 'learning' && nextStage === 'completed') {
    const hasLearning = !!(stateSnapshot.learningInsightId || stateSnapshot.calibratedWeights || stateSnapshot.insightGenerated);
    if (!hasLearning) {
      return {
        passed: false,
        blockedReason: 'Learning Gate Blocked: Loop cannot be closed without recording calibrated weights or learned insights.',
        requiredEvidence: 'learningInsightId or calibratedWeights'
      };
    }
  }

  return { passed: true };
}
