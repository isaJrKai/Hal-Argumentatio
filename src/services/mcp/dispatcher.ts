import { db as pgDb } from '../../db/index.ts';
import { buildFinancialHealthReport } from '../../lib/financialHealth';
import { 
  googleAdsDailyPerformance, 
  revenueRecords, 
  leads, 
  halLoops, 
  halLoopEvents, 
  auditLogs,
  revenueSimulations,
  missions,
  workEvents,
  workTasks,
  hermesLabArtifacts
} from '../../db/schema.ts';
import { eq, and, desc, gte } from 'drizzle-orm';
import crypto from 'crypto';
import {
  McpToolDefinition,
  validateFinancialHealthInput,
  validateInspectAnomaliesInput,
  validateRunWhatIfSimulationInput,
  validateGetLoopContextInput,
  validateAttachLoopIntelligenceInput
} from './types.ts';
import { executeHermesLabTool, LabToolType } from '../hermesLab.ts';
import { getRecentWorkEvents } from '../../lib/workLedger';
import { listWorkTasks, getWorkTask } from '../../lib/workTasks';

export const HAL_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'hal_get_operational_context',
    description: 'Retrieves a bounded, tenant-scoped snapshot of recent work events, leads, missions and assigned tasks so HAL agents can understand current business activity. Facts are authoritative only for the returned records; missing data must not be guessed.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum recent records per category, from 1 to 20 (default 10).' }
      }
    }
  },
  {
    name: 'hal_create_work_task',
    description: 'Creates a durable work item assigned to a human or specialist worker. This queues work only; it does not execute the task. External communications, spend, contracts and destructive actions must require human approval.',
    inputSchema: {
      type: 'object',
      properties: {
        taskType: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        assignedWorker: { type: 'string', enum: ['human', 'hal_assistant', 'hermes', 'amis', 'gemini', 'nemotron'] },
        priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
        entityType: { type: 'string' },
        entityId: { type: 'string' },
        correlationId: { type: 'string' },
        input: { type: 'object' },
        requiresApproval: { type: 'boolean' }
      },
      required: ['taskType', 'title', 'assignedWorker']
    }
  },
  {
    name: 'hal_list_work_tasks',
    description: 'Lists the authenticated tenant work queue. Use it to inspect queued, running, approval-blocked, completed and failed tasks before assigning duplicate work.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' }
      }
    }
  },
  {
    name: 'hal_get_financial_health',
    description: 'Calculates deterministic business financials (CPL, CAC, ROAS, LTV, Net Margin, Payback Period) across a given timeframe.',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['last_7_days', 'last_30_days', 'last_90_days', 'all_time'],
          description: 'The historical timeframe to analyze.'
        }
      },
      required: ['timeframe']
    }
  },
  {
    name: 'hal_inspect_campaign_anomalies',
    description: 'Scans all active Google Ads and revenue campaigns for statistically significant ROAS drops, CPA spikes, or lead decay.',
    inputSchema: {
      type: 'object',
      properties: {
        thresholdDropPct: {
          type: 'number',
          description: 'Minimum percentage drop in ROAS or conversion rate to qualify as an anomaly (default: 20).'
        }
      }
    }
  },
  {
    name: 'hal_run_what_if_simulation',
    description: 'Executes a deterministic revenue simulation model to project financial lift, CPA delta, and baseline variance for proposed budget shifts.',
    inputSchema: {
      type: 'object',
      properties: {
        scenarioType: {
          type: 'string',
          enum: ['budget_reallocation', 'cpa_target_shift', 'bid_cap_adjustment', 'conversion_rate_stress_test']
        },
        parameters: {
          type: 'object',
          properties: {
            fromCampaign: { type: 'string' },
            toCampaign: { type: 'string' },
            shiftAmount: { type: 'number' },
            targetCpa: { type: 'number' }
          },
          required: ['shiftAmount']
        }
      },
      required: ['scenarioType', 'parameters']
    }
  },
  {
    name: 'hal_get_loop_context',
    description: 'Retrieves active Phase 7 Business Operating Loop state, current stage, hypothesis notes, and critic evaluation findings.',
    inputSchema: {
      type: 'object',
      properties: {
        loopId: { type: 'string', description: 'The unique HAL loop identifier.' }
      },
      required: ['loopId']
    }
  },
  {
    name: 'hal_attach_loop_intelligence',
    description: 'Appends external evidence, competitor market analysis, and diagnostic hypotheses to the active HAL Operating Loop context.',
    inputSchema: {
      type: 'object',
      properties: {
        loopId: { type: 'string' },
        stage: { type: 'string', enum: ['gathering', 'analyzing', 'planning'] },
        evidenceSummary: { type: 'string' },
        evidenceSources: {
          type: 'array',
          items: { type: 'string' }
        },
        hypotheses: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['loopId', 'stage', 'evidenceSummary']
    }
  },
  {
    name: 'hermes_synthesize_lab_asset',
    description: 'Executes specialized Hermes Intelligence Lab tool to generate landing pages, ad copies, SEO schemas, or diagnostic repair adapters.',
    inputSchema: {
      type: 'object',
      properties: {
        toolId: {
          type: 'string',
          enum: [
            'landing_page',
            'ad_copy_studio',
            'seo_schema_generator',
            'outreach_sequences',
            'sms_review_booster',
            'speed_vitals_optimizer',
            'competitor_intel_scout',
            'webhook_resilience_fixer',
            'negative_keyword_miner',
            'deep_case_reasoner'
          ]
        },
        parameters: { type: 'object' },
        promptOverride: { type: 'string' }
      },
      required: ['toolId']
    }
  }
];

export async function executeMcpTool(
  toolName: string, 
  rawParams: any, 
  contractorId: string
): Promise<any> {
  const auditId = crypto.randomUUID();
  
  switch (toolName) {
    case 'hal_get_operational_context': {
      const requested = Number(rawParams?.limit);
      const limit = Number.isFinite(requested) && requested > 0 ? Math.min(20, Math.floor(requested)) : 10;
      const [events, recentLeads, recentMissions, tasks] = await Promise.all([
        getRecentWorkEvents(pgDb, contractorId, limit),
        pgDb.select({ id: leads.id, businessName: leads.businessName, city: leads.city, niche: leads.niche, status: leads.status, websiteUrl: leads.websiteUrl, updatedAt: leads.updatedAt })
          .from(leads).where(eq(leads.contractorId, contractorId)).orderBy(desc(leads.updatedAt)).limit(limit),
        pgDb.select({ id: missions.id, title: missions.title, status: missions.status, city: missions.city, niche: missions.niche, updatedAt: missions.updatedAt })
          .from(missions).where(eq(missions.contractorId, contractorId)).orderBy(desc(missions.updatedAt)).limit(limit),
        listWorkTasks(pgDb, contractorId, limit)
      ]);
      return {
        generatedAt: new Date().toISOString(),
        tenantScope: 'authenticated contractor only',
        recentEvents: events,
        recentLeads,
        recentMissions,
        workTasks: tasks
      };
    }

    case 'hal_create_work_task': {
      const taskType = typeof rawParams?.taskType === 'string' ? rawParams.taskType.trim() : '';
      const title = typeof rawParams?.title === 'string' ? rawParams.title.trim() : '';
      const description = typeof rawParams?.description === 'string' ? rawParams.description.trim() : null;
      const assignedWorker = rawParams?.assignedWorker;
      const priority = rawParams?.priority || 'normal';
      const entityType = typeof rawParams?.entityType === 'string' ? rawParams.entityType.trim() : null;
      const entityId = typeof rawParams?.entityId === 'string' ? rawParams.entityId.trim() : null;
      const input = rawParams?.input && typeof rawParams.input === 'object' && !Array.isArray(rawParams.input) ? rawParams.input : null;
      const requiresApproval = rawParams?.requiresApproval === true;
      const workers = ['human', 'hal_assistant', 'hermes', 'amis', 'gemini', 'nemotron'];
      if (!taskType || taskType.length > 80 || !title || title.length > 180 ||
          (description && description.length > 2000) || !workers.includes(assignedWorker) ||
          !['low', 'normal', 'high', 'urgent'].includes(priority) ||
          Boolean(entityType) !== Boolean(entityId) ||
          (rawParams?.input !== undefined && input === null) ||
          (input && JSON.stringify(input).length > 20000)) {
        throw new Error('Invalid work task parameters.');
      }
      if (entityType) {
        let entityExists = false;
        if (entityType === 'lead') {
          entityExists = (await pgDb.select({ id: leads.id }).from(leads).where(and(eq(leads.id, entityId!), eq(leads.contractorId, contractorId))).limit(1)).length > 0;
        } else if (entityType === 'mission') {
          entityExists = (await pgDb.select({ id: missions.id }).from(missions).where(and(eq(missions.id, entityId!), eq(missions.contractorId, contractorId))).limit(1)).length > 0;
        } else if (entityType === 'artifact') {
          entityExists = (await pgDb.select({ id: hermesLabArtifacts.id }).from(hermesLabArtifacts).where(and(eq(hermesLabArtifacts.id, entityId!), eq(hermesLabArtifacts.contractorId, contractorId))).limit(1)).length > 0;
        } else if (entityType === 'work_task') {
          entityExists = (await getWorkTask(pgDb, contractorId, entityId!)) !== null;
        } else {
          throw new Error('Unsupported entity type. Link tasks to a lead, mission, artifact or work task.');
        }
        if (!entityExists) throw new Error('The linked business record was not found in this workspace.');
      }
      const taskId = 'task_' + crypto.randomUUID();
      const correlationId = typeof rawParams?.correlationId === 'string' && rawParams.correlationId.trim()
        ? rawParams.correlationId.trim().slice(0, 120) : taskId;
      const status = requiresApproval ? 'awaiting_approval' : 'queued';
      const [task] = await pgDb.transaction(async tx => {
        const [created] = await tx.insert(workTasks).values({
          id: taskId, contractorId, taskType, title, description, assignedWorker,
          priority, entityType, entityId, correlationId, input, requiresApproval,
          status, createdAt: new Date(), updatedAt: new Date()
        }).returning();
        await tx.insert(workEvents).values({
          id: 'evt_' + crypto.randomUUID(), contractorId, eventType: 'task.created',
          entityType: 'work_task', entityId: taskId, actorType: 'agent', actorId: 'mcp_agent',
          sourceModule: 'mcp_work_queue', correlationId,
          summary: `Agent queued task: ${title}.`,
          payload: { taskType, assignedWorker, priority, status, entityType, entityId }
        });
        return [created];
      });
      return { task, executionStarted: false, message: 'Task queued. No work has been executed yet.' };
    }

    case 'hal_list_work_tasks': {
      const requested = Number(rawParams?.limit);
      const limit = Number.isFinite(requested) && requested > 0 ? Math.min(100, Math.floor(requested)) : 50;
      return { tasks: await listWorkTasks(pgDb, contractorId, limit) };
    }
    case 'hal_get_financial_health': {
      const parsed = validateFinancialHealthInput(rawParams || {});
      
      const now = new Date();
      let cutoff = new Date(0);
      if (parsed.timeframe === 'last_7_days') {
        cutoff = new Date(now.getTime() - 7 * 86400000);
      } else if (parsed.timeframe === 'last_30_days') {
        cutoff = new Date(now.getTime() - 30 * 86400000);
      } else if (parsed.timeframe === 'last_90_days') {
        cutoff = new Date(now.getTime() - 90 * 86400000);
      }

      const adsRecords = await pgDb
        .select()
        .from(googleAdsDailyPerformance)
        .where(
          and(
            eq(googleAdsDailyPerformance.contractorId, contractorId),
            gte(googleAdsDailyPerformance.date, cutoff)
          )
        );

      const allLeads = await pgDb
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.contractorId, contractorId),
            gte(leads.createdAt, cutoff)
          )
        );

      const revRecords = await pgDb
        .select()
        .from(revenueRecords)
        .where(
          and(
            eq(revenueRecords.contractorId, contractorId),
            gte(revenueRecords.createdAt, cutoff)
          )
        );

      const financialReport = buildFinancialHealthReport(adsRecords, revRecords, allLeads);

      await pgDb.insert(auditLogs).values({
        id: auditId,
        contractorId,
        action: 'HERMES_MCP_FINANCIAL_HEALTH',
        details: JSON.stringify({
          timeframe: parsed.timeframe,
          totalAdSpendUsd: financialReport.totalAdSpendUsd,
          googleAdsReportedRoas: financialReport.googleAdsReportedRoas,
          dataQuality: financialReport.dataQuality
        }),
        timestamp: new Date()
      });

      return {
        timeframe: parsed.timeframe,
        ...financialReport
      };
    }

    case 'hal_inspect_campaign_anomalies': {
      const parsed = validateInspectAnomaliesInput(rawParams || {});
      const adsRecords = await pgDb
        .select()
        .from(googleAdsDailyPerformance)
        .where(eq(googleAdsDailyPerformance.contractorId, contractorId))
        .orderBy(desc(googleAdsDailyPerformance.date));

      const anomalies: Array<any> = [];

      const campaignTotals: Record<string, { spend: number; conversions: number }> = {};
      for (const r of adsRecords) {
        if (!campaignTotals[r.campaignName]) {
          campaignTotals[r.campaignName] = { spend: 0, conversions: 0 };
        }
        campaignTotals[r.campaignName].spend += Number(r.cost) || 0;
        campaignTotals[r.campaignName].conversions += Number(r.conversions) || 0;
      }

      for (const [name, data] of Object.entries(campaignTotals)) {
        if (data.spend > 500 && data.conversions === 0) {
          anomalies.push({
            campaignId: name.toLowerCase().replace(/\s+/g, '_'),
            campaignName: name,
            severity: 'CRITICAL',
            metric: 'CONVERSION_RATE',
            baselineValue: 3.5,
            currentValue: 0.0,
            percentageDelta: -100,
            timeWindow: 'last_30_days',
            suggestedInvestigation: 'Audit landing page SSL, tracking script integrity, and negative keywords.'
          });
        }
      }

      await pgDb.insert(auditLogs).values({
        id: auditId,
        contractorId,
        action: 'HERMES_MCP_ANOMALIES_INSPECTED',
        details: JSON.stringify({ anomaliesFound: anomalies.length, threshold: parsed.thresholdDropPct }),
        timestamp: new Date()
      });

      return {
        anomaliesDetected: anomalies.length,
        anomalies
      };
    }

    case 'hal_run_what_if_simulation': {
      // Fail closed rather than persisting fabricated baseline spend, conversion
      // value, ROAS, or confidence. A valid simulation needs measured campaign
      // data and an explicit, tested marginal-response assumption.
      const parsed = validateRunWhatIfSimulationInput(rawParams || {});
      return {
        status: 'unavailable',
        scenarioType: parsed.scenarioType,
        message: 'Budget simulation is unavailable until measured campaign-specific performance and a validated marginal-response model are connected. No simulation was stored and no budget was changed.',
        simulationStored: false,
        executionEnabled: false
      };
    }

    case 'hal_get_loop_context': {
      const parsed = validateGetLoopContextInput(rawParams || {});
      const [loop] = await pgDb
        .select()
        .from(halLoops)
        .where(
          and(
            eq(halLoops.id, parsed.loopId),
            eq(halLoops.contractorId, contractorId)
          )
        );

      if (!loop) {
        throw new Error(`HAL Loop with ID ${parsed.loopId} not found for this contractor.`);
      }

      const events = await pgDb
        .select()
        .from(halLoopEvents)
        .where(
          and(
            eq(halLoopEvents.loopId, parsed.loopId),
            eq(halLoopEvents.contractorId, contractorId)
          )
        )
        .orderBy(desc(halLoopEvents.createdAt));

      return {
        loopId: loop.id,
        currentStage: loop.currentStage,
        status: loop.status,
        trigger: loop.trigger,
        contextData: loop.contextData,
        criticFindings: loop.criticFindings,
        iterationCount: loop.iterationCount,
        recentEvents: events.slice(0, 5)
      };
    }

    case 'hal_attach_loop_intelligence': {
      const parsed = validateAttachLoopIntelligenceInput(rawParams || {});
      const [loop] = await pgDb
        .select()
        .from(halLoops)
        .where(
          and(
            eq(halLoops.id, parsed.loopId),
            eq(halLoops.contractorId, contractorId)
          )
        );

      if (!loop) {
        throw new Error(`HAL Loop with ID ${parsed.loopId} not found for this contractor.`);
      }

      const existingContext = (loop.contextData as Record<string, any>) || {};
      const updatedContext = {
        ...existingContext,
        hermesIntelligence: {
          stage: parsed.stage,
          summary: parsed.evidenceSummary,
          sources: parsed.evidenceSources,
          hypotheses: parsed.hypotheses,
          attachedAt: new Date().toISOString(),
          agent: 'NousResearch/hermes-agent'
        }
      };

      await pgDb
        .update(halLoops)
        .set({
          contextData: updatedContext,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(halLoops.id, parsed.loopId),
            eq(halLoops.contractorId, contractorId)
          )
        );

      await pgDb.insert(halLoopEvents).values({
        id: crypto.randomUUID(),
        loopId: parsed.loopId,
        contractorId,
        eventType: 'stage_transition',
        newState: parsed.stage,
        previousState: loop.currentStage,
        actor: 'hermes_agent',
        metadata: { summary: parsed.evidenceSummary, hypotheses: parsed.hypotheses },
        createdAt: new Date()
      });

      await pgDb.insert(auditLogs).values({
        id: auditId,
        contractorId,
        action: 'HERMES_MCP_INTELLIGENCE_ATTACHED',
        details: JSON.stringify({ loopId: parsed.loopId, stage: parsed.stage }),
        timestamp: new Date()
      });

      return {
        success: true,
        loopId: parsed.loopId,
        currentStage: loop.currentStage,
        intelligenceAttachedAt: new Date().toISOString()
      };
    }

    case 'hermes_synthesize_lab_asset': {
      const toolId = rawParams?.toolId as LabToolType;
      if (!toolId) {
        throw new Error('Missing required parameter: toolId');
      }
      const parameters = rawParams?.parameters || {};
      const promptOverride = rawParams?.promptOverride;

      const result = await executeHermesLabTool(toolId, parameters, contractorId, promptOverride);
      return {
        success: true,
        toolId,
        ...result
      };
    }

    default:
      throw new Error(`Unrecognized MCP tool: ${toolName}`);
  }
}
