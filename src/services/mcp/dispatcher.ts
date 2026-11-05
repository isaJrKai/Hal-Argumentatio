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
  campaigns,
  clientProjects,
  communicationsOutbox,
  missions,
  workEvents,
  workTasks,
  hermesLabArtifacts,
  leadEvents,
  winLossRecords,
  revenueOutcomes
} from '../../db/schema.ts';
import { eq, and, desc, gte, inArray, or, isNotNull } from 'drizzle-orm';
import crypto from 'crypto';
import {
  McpToolDefinition,
  validateFinancialHealthInput,
  validateInspectAnomaliesInput,
  validateRunWhatIfSimulationInput,
  validateGetLoopContextInput,
  validateAttachLoopIntelligenceInput
} from './types.ts';
import { executeHermesLabTool, chatWithHermesAgent, LabToolType } from '../hermesLab.ts';
import { getRecentWorkEvents, recordWorkEvent } from '../../lib/workLedger';
import { listWorkTasks, getWorkTask, requiresWorkTaskApproval, canExecutorClaimWorkTask } from '../../lib/workTasks';
import { analyzeCampaignPerformance } from '../../lib/campaignAnomaly';
import { classifyHermesToolResult } from '../../lib/hermesExecution';
import { claimHermesWorkTask, heartbeatHermesWorkTask, failExpiredHermesWorkTask } from '../../lib/hermesTaskClaim';
import { validateDomainAndDns } from '../../lib/networkVerification';

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
    description: 'Creates a durable work item assigned to a human or specialist worker. This queues work only; it does not execute the task. For the existing Hermes agent use taskType hermes_agent_task with input.message (and optional artifactId) for Hermes Studio analysis or an explicitly requested artifact revision, or hermes_lab_asset with input.toolId and input.parameters for a registered Lab tool. External communications, spend, contracts and destructive actions require human approval.',
    inputSchema: {
      type: 'object',
      properties: {
        taskType: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        assignedWorker: { type: 'string', enum: ['human', 'hal_assistant', 'hermes', 'gemini', 'nemotron'] },
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
    description: 'Compares recorded campaign conversion rates and cost per conversion across adjacent 30-day windows using stored Google Ads rows. Also returns screening signals for spend above $500 with zero recorded conversions; these are not proof of a tracking fault.',
    inputSchema: {
      type: 'object',
      properties: {
        thresholdDropPct: {
          type: 'number',
          description: 'Minimum percentage change threshold for a conversion-rate decline or cost-per-conversion increase between adjacent 30-day windows (default: 20).'
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
    name: 'hal_execute_hermes_work_task',
    description: 'Executes one queued, non-approval-blocked task assigned to the existing Hermes agent. Supports hermes_lab_asset (registered Lab artifact generation) and hermes_agent_task (Hermes Studio analysis or an explicitly requested artifact revision). It claims the task atomically and stores a receipt. It does not send messages, spend money, publish externally, or execute arbitrary task types.',
    inputSchema: {
      type: 'object',
      properties: { taskId: { type: 'string' } },
      required: ['taskId']
    }
  },
  {
    name: 'hermes_synthesize_lab_asset',
    description: 'Queues and executes a registered Hermes Intelligence Lab draft through the durable Work Queue. Returns the task ID and persisted execution receipt; may return awaiting approval. Does not publish externally or send communications.',
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
  {
    name: 'hal_audit_website_connectivity',
    description: 'Runs a safe, bounded public DNS and pinned HTTP/TLS connectivity audit for a website. Reports only measured connectivity evidence; it does not claim Lighthouse, PageSpeed, SEO, mobile, content, or conversion analysis. Optionally links the result to a lead owned by the authenticated tenant.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Public website domain or HTTP/HTTPS URL.' },
        leadId: { type: 'string', description: 'Optional lead ID from the authenticated workspace.' },
        businessName: { type: 'string' },
        city: { type: 'string' },
        niche: { type: 'string' }
      },
      required: ['url']
    }
  }
];

export async function executeMcpTool(
  toolName: string,
  rawParams: any,
  contractorId: string,
  actor: { actorType: 'human' | 'agent' | 'system' | 'integration'; actorId: string; sourceModule?: string } = {
    actorType: 'agent', actorId: 'mcp_client', sourceModule: 'mcp_gateway'
  }
): Promise<any> {
  const auditId = crypto.randomUUID();
  
  switch (toolName) {
    case 'hal_get_operational_context': {
      const requested = Number(rawParams?.limit);
      const limit = Number.isFinite(requested) && requested > 0 ? Math.min(20, Math.floor(requested)) : 10;
      const [events, recentLeads, recentMissions, tasks, recentCampaigns, recentRevenue, recentProjects, recentMessages, recentLeadEvents, recentWinLoss, recentRevenueOutcomes] = await Promise.all([
        getRecentWorkEvents(pgDb, contractorId, limit),
        pgDb.select({ id: leads.id, businessName: leads.businessName, city: leads.city, niche: leads.niche, status: leads.status, websiteUrl: leads.websiteUrl, updatedAt: leads.updatedAt })
          .from(leads).where(eq(leads.contractorId, contractorId)).orderBy(desc(leads.updatedAt)).limit(limit),
        pgDb.select({ id: missions.id, title: missions.title, status: missions.status, city: missions.city, niche: missions.niche, updatedAt: missions.updatedAt })
          .from(missions).where(eq(missions.contractorId, contractorId)).orderBy(desc(missions.updatedAt)).limit(limit),
        listWorkTasks(pgDb, contractorId, limit),
        pgDb.select({ id: campaigns.id, name: campaigns.name, status: campaigns.status, leadsCount: campaigns.leadsCount, budgetUsd: campaigns.budgetUsd })
          .from(campaigns).where(eq(campaigns.contractorId, contractorId)).orderBy(desc(campaigns.createdAt)).limit(limit),
        pgDb.select({ id: revenueRecords.id, leadId: revenueRecords.leadId, amountUsd: revenueRecords.amountUsd, source: revenueRecords.source, createdAt: revenueRecords.createdAt })
          .from(revenueRecords).where(eq(revenueRecords.contractorId, contractorId)).orderBy(desc(revenueRecords.createdAt)).limit(limit),
        pgDb.select({ id: clientProjects.id, leadId: clientProjects.leadId, businessName: clientProjects.businessName, status: clientProjects.status, monthlyRetainerUsd: clientProjects.monthlyRetainerUsd })
          .from(clientProjects).where(eq(clientProjects.contractorId, contractorId)).orderBy(desc(clientProjects.updatedAt)).limit(limit),
        pgDb.select({ id: communicationsOutbox.id, leadId: communicationsOutbox.leadId, channel: communicationsOutbox.channel, provider: communicationsOutbox.provider, status: communicationsOutbox.status, submittedAt: communicationsOutbox.submittedAt, deliveredAt: communicationsOutbox.deliveredAt })
          .from(communicationsOutbox).where(eq(communicationsOutbox.contractorId, contractorId)).orderBy(desc(communicationsOutbox.createdAt)).limit(limit),
        pgDb.select({ leadId: leadEvents.leadId, eventType: leadEvents.eventType, previousStage: leadEvents.previousStage, newStage: leadEvents.newStage, dealValue: leadEvents.dealValue, occurredAt: leadEvents.occurredAt, createdAt: leadEvents.createdAt })
          .from(leadEvents).innerJoin(leads, eq(leadEvents.leadId, leads.id)).where(eq(leads.contractorId, contractorId)).orderBy(desc(leadEvents.createdAt)).limit(limit),
        pgDb.select({ id: winLossRecords.id, leadId: winLossRecords.leadId, businessName: winLossRecords.businessName, outcome: winLossRecords.outcome, closedValueUsd: winLossRecords.closedValueUsd, primaryReason: winLossRecords.primaryReason, keyLesson: winLossRecords.keyLesson, closedAt: winLossRecords.closedAt })
          .from(winLossRecords).where(eq(winLossRecords.contractorId, contractorId)).orderBy(desc(winLossRecords.closedAt)).limit(limit),
        pgDb.select({ id: revenueOutcomes.id, outcomeStatus: revenueOutcomes.outcomeStatus, outcomeClassification: revenueOutcomes.outcomeClassification, predictionAccuracy: revenueOutcomes.predictionAccuracy, confidenceScore: revenueOutcomes.confidenceScore, observationStart: revenueOutcomes.observationStart, observationEnd: revenueOutcomes.observationEnd, updatedAt: revenueOutcomes.updatedAt })
          .from(revenueOutcomes).where(eq(revenueOutcomes.contractorId, contractorId)).orderBy(desc(revenueOutcomes.updatedAt)).limit(limit)
      ]);
      return {
        generatedAt: new Date().toISOString(),
        tenantScope: 'authenticated contractor only',
        recentEvents: events,
        recentLeads,
        recentMissions,
        workTasks: tasks.map(task => ({ id: task.id, taskType: task.taskType, title: task.title, status: task.status, assignedWorker: task.assignedWorker, priority: task.priority, entityType: task.entityType, entityId: task.entityId })),
        recentCampaigns,
        recentRevenue,
        recentClientProjects: recentProjects,
        recentOutboundMessages: recentMessages,
        recentLeadLifecycleEvents: recentLeadEvents,
        recentWinLossOutcomes: recentWinLoss,
        measuredRevenueOutcomes: recentRevenueOutcomes
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
      const approvalRequiredByPolicy = requiresWorkTaskApproval(taskType, title, description, input);
      const requiresApproval = rawParams?.requiresApproval === true || approvalRequiredByPolicy;
      const workers = ['human', 'hal_assistant', 'hermes', 'gemini', 'nemotron'];
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
      if (entityType && entityId) {
        const [activeDuplicate] = await pgDb.select().from(workTasks).where(and(
          eq(workTasks.contractorId, contractorId), eq(workTasks.taskType, taskType),
          eq(workTasks.entityType, entityType), eq(workTasks.entityId, entityId),
          eq(workTasks.assignedWorker, assignedWorker),
          inArray(workTasks.status, ['queued', 'running', 'awaiting_approval'])
        )).limit(1);
        if (activeDuplicate) return { task: activeDuplicate, duplicate: true, executionStarted: false };
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
    case 'hal_execute_hermes_work_task': {
      const taskId = typeof rawParams?.taskId === 'string' ? rawParams.taskId.trim() : '';
      if (!taskId || taskId.length > 160) throw new Error('A valid taskId is required.');
      const expired = await failExpiredHermesWorkTask(pgDb, taskId, contractorId);
      if (expired) {
        try {
          await recordWorkEvent(pgDb, {
            contractorId, eventType: 'task.execution_lease_expired', entityType: 'work_task', entityId: taskId,
            actorType: 'system', actorId: 'hermes_lease_recovery', sourceModule: 'hermes_work_executor',
            correlationId: expired.correlationId || taskId,
            summary: 'Hermes stopped heartbeating before recording a terminal receipt; the task was marked failed for operator review.',
            payload: { attempt: expired.attemptCount, outcome: 'lease_expired' }
          });
        } catch (ledgerError) {
          console.error('[Hermes Work History] Lease-expiry receipt persisted but event append failed:', ledgerError);
        }
      }
      const task = await getWorkTask(pgDb, contractorId, taskId);
      if (!task) throw new Error('Work task not found in this workspace.');
      if (task.assignedWorker !== 'hermes') throw new Error('This task is not assigned to Hermes.');
      if (!['hermes_lab_asset', 'hermes_agent_task'].includes(task.taskType)) throw new Error('Hermes cannot execute this task type. Supported types: hermes_lab_asset, hermes_agent_task.');
      if (!canExecutorClaimWorkTask(task)) {
        if (task.status === 'awaiting_approval' || (task.requiresApproval && !task.approvedAt)) throw new Error('This task is blocked pending human approval.');
        throw new Error(`Task is ${task.status}; only queued tasks can be claimed.`);
      }
      if (task.attemptCount >= task.maxAttempts) throw new Error('Task has reached its maximum execution attempts.');
      const input = task.input && typeof task.input === 'object' && !Array.isArray(task.input) ? task.input as Record<string, any> : {};
      const allowedToolIds: LabToolType[] = ['landing_page', 'ad_copy_studio', 'seo_schema_generator', 'outreach_sequences', 'sms_review_booster', 'speed_vitals_optimizer', 'competitor_intel_scout', 'webhook_resilience_fixer', 'negative_keyword_miner', 'deep_case_reasoner'];
      const toolId = input.toolId as LabToolType;
      const parameters = input.parameters && typeof input.parameters === 'object' && !Array.isArray(input.parameters) ? input.parameters : null;
      const promptOverride = typeof input.promptOverride === 'string' ? input.promptOverride.slice(0, 12000) : undefined;
      const agentMessage = typeof input.message === 'string' ? input.message.trim() : '';
      const artifactId = typeof input.artifactId === 'string' ? input.artifactId : undefined;
      if (task.taskType === 'hermes_lab_asset' && (!allowedToolIds.includes(toolId) || !parameters || JSON.stringify(parameters).length > 20000)) {
        throw new Error('Hermes Lab task input must contain a registered toolId and a parameters object within 20 KB.');
      }
      if (task.taskType === 'hermes_agent_task' && (!agentMessage || agentMessage.length > 8000 || JSON.stringify(input).length > 12000)) {
        throw new Error('Hermes agent task input must contain a message up to 8,000 characters.');
      }
      if (task.taskType === 'hermes_agent_task' && artifactId) {
        const [artifact] = await pgDb.select({ id: hermesLabArtifacts.id }).from(hermesLabArtifacts)
          .where(and(eq(hermesLabArtifacts.id, artifactId), eq(hermesLabArtifacts.contractorId, contractorId))).limit(1);
        if (!artifact) throw new Error('The target Hermes artifact was not found in this workspace.');
      }

      const claimed = await pgDb.transaction(async tx => {
        const running = await claimHermesWorkTask(tx, taskId, contractorId);
        if (!running) return null;
        await tx.insert(workEvents).values({
          id: 'evt_' + crypto.randomUUID(), contractorId,
          eventType: 'task.execution_started', entityType: 'work_task', entityId: taskId,
          actorType: 'agent', actorId: 'hermes_agent', sourceModule: 'hermes_work_executor',
          correlationId: task.correlationId || taskId,
          summary: `Hermes started: ${task.title}.`,
          payload: { taskType: task.taskType, toolId, attempt: running.attemptCount }
        });
        return running;
      });
      if (!claimed) throw new Error('Task was claimed or changed by another worker. Refresh the queue.');

      const executionStartedAt = new Date();
      let heartbeatLost = false;
      let heartbeatInFlight = false;
      const heartbeatTimer = setInterval(async () => {
        if (heartbeatInFlight || heartbeatLost) return;
        heartbeatInFlight = true;
        try {
          const alive = await heartbeatHermesWorkTask(pgDb, taskId, contractorId, claimed.attemptCount);
          if (!alive) heartbeatLost = true;
        } catch (heartbeatError) {
          heartbeatLost = true;
          console.error('[Hermes] Task heartbeat failed; refusing to record completion:', heartbeatError);
        } finally {
          heartbeatInFlight = false;
        }
      }, 15_000);
      heartbeatTimer.unref?.();

      try {
        const result = task.taskType === 'hermes_lab_asset'
          ? await executeHermesLabTool(toolId, parameters, contractorId, promptOverride, { workTaskId: taskId, correlationId: task.correlationId || taskId })
          : await chatWithHermesAgent(contractorId, agentMessage, artifactId, {
              workTaskId: taskId,
              correlationId: task.correlationId || taskId,
              toolRuntime: {
                tools: HAL_MCP_TOOLS.filter(tool => [
                  'hal_get_operational_context',
                  'hal_get_financial_health',
                  'hal_inspect_campaign_anomalies',
                  'hal_run_what_if_simulation',
                  'hal_get_loop_context'
                ].includes(tool.name)),
                execute: async (toolName, toolArgs) => {
                  try {
                    const toolResult = await executeMcpTool(toolName, toolArgs, contractorId, {
                      actorType: 'agent', actorId: 'hermes_agent', sourceModule: 'hermes_studio'
                    });
                    const outcome = classifyHermesToolResult(toolResult);
                    try {
                      await recordWorkEvent(pgDb, {
                        contractorId,
                        eventType: outcome === 'succeeded' ? 'agent.tool_succeeded' : outcome === 'unavailable' ? 'agent.tool_unavailable' : 'agent.tool_failed',
                        entityType: 'work_task', entityId: taskId,
                        actorType: 'agent', actorId: 'hermes_agent', sourceModule: 'hermes_studio',
                        correlationId: task.correlationId || taskId,
                        summary: outcome === 'succeeded'
                          ? `Hermes completed workspace inspection using ${toolName}.`
                          : outcome === 'unavailable'
                            ? `Hermes requested ${toolName}, but the capability reported it was unavailable.`
                            : `Hermes tool ${toolName} returned a failed result.`,
                        payload: {
                          toolName,
                          outcome,
                          resultStatus: typeof toolResult?.status === 'string' ? toolResult.status : null,
                          executionEnabled: typeof toolResult?.executionEnabled === 'boolean' ? toolResult.executionEnabled : null
                        }
                      });
                    } catch (ledgerError) {
                      console.error('[Hermes Work History] Could not append tool result event:', ledgerError);
                    }
                    return toolResult;
                  } catch (toolError: any) {
                    try {
                      await recordWorkEvent(pgDb, {
                        contractorId, eventType: 'agent.tool_failed', entityType: 'work_task', entityId: taskId,
                        actorType: 'agent', actorId: 'hermes_agent', sourceModule: 'hermes_studio',
                        correlationId: task.correlationId || taskId,
                        summary: `Hermes could not complete workspace inspection using ${toolName}.`,
                        payload: { toolName, success: false, error: String(toolError?.message || 'Tool failed.').slice(0, 500) }
                      });
                    } catch (ledgerError) {
                      console.error('[Hermes Work History] Could not append tool failure event:', ledgerError);
                    }
                    throw toolError;
                  }
                }
              }
            });
        if (task.taskType === 'hermes_agent_task' && (result as any).executionStatus === 'provider_unavailable') {
          throw new Error('Hermes providers are unavailable. No analysis or artifact update was completed.');
        }
        if (heartbeatLost) throw new Error('Hermes lost ownership of this task attempt before completion; no success receipt was written.');
        clearInterval(heartbeatTimer);
        const completedAt = new Date();
        const resultReceipt = task.taskType === 'hermes_lab_asset'
          ? {
              artifactId: (result as any).artifactId, title: (result as any).title, category: (result as any).category,
              status: (result as any).status, executionSummary: (result as any).executionSummary
            }
          : {
              replyMessageId: (result as any).replyMessageId,
              replyText: (result as any).replyText,
              updatedArtifactId: (result as any).updatedArtifact?.id || null,
              toolCalls: ((result as any).toolCalls || []).map((call: any) => ({
                name: call.name,
                outcome: classifyHermesToolResult(call.result),
                success: classifyHermesToolResult(call.result) === 'succeeded',
                resultStatus: typeof call.result?.status === 'string' ? call.result.status : null
              }))
            };
        const receipt = {
          schemaVersion: 1, outcome: 'completed', success: true, worker: 'hermes',
          taskId, taskType: task.taskType, attempt: claimed.attemptCount,
          startedAt: executionStartedAt.toISOString(), completedAt: completedAt.toISOString(),
          durationMs: Math.max(0, completedAt.getTime() - executionStartedAt.getTime()),
          ...resultReceipt,
          result: resultReceipt
        };
        const [completed] = await pgDb.update(workTasks).set({
          status: 'completed', output: receipt, completedAt, updatedAt: completedAt
        }).where(and(
          eq(workTasks.id, taskId), eq(workTasks.contractorId, contractorId),
          eq(workTasks.status, 'running'), eq(workTasks.assignedWorker, 'hermes'),
          eq(workTasks.attemptCount, claimed.attemptCount)
        )).returning();
        if (!completed) throw new Error('Task state changed before Hermes could record its execution receipt.');
        // The task receipt is the authoritative completion record. A secondary
        // timeline append must not roll it back or make a completed action retryable.
        try {
          await pgDb.insert(workEvents).values({
            id: 'evt_' + crypto.randomUUID(), contractorId,
            eventType: 'task.execution_completed', entityType: 'work_task', entityId: taskId,
            actorType: 'agent', actorId: 'hermes_agent', sourceModule: 'hermes_work_executor',
            correlationId: task.correlationId || taskId,
            summary: `Hermes completed: ${task.title}.`,
            payload: task.taskType === 'hermes_lab_asset'
              ? { artifactId: (result as any).artifactId, artifactTitle: (result as any).title, toolId }
              : { replyMessageId: (result as any).replyMessageId, updatedArtifactId: (result as any).updatedArtifact?.id || null }
          });
        } catch (ledgerError) {
          console.error('[Hermes Work History] Task completed but completion event append failed:', ledgerError);
        }
        return { success: true, task: completed, receipt, executionStarted: true };
      } catch (executionError: any) {
        clearInterval(heartbeatTimer);
        const failedAt = new Date();
        const message = String(executionError?.message || 'Hermes execution failed.').slice(0, 1000);
        const failureReceipt = {
          schemaVersion: 1, outcome: 'failed', success: false, worker: 'hermes',
          taskId, taskType: task.taskType, attempt: claimed.attemptCount,
          startedAt: executionStartedAt.toISOString(), completedAt: failedAt.toISOString(),
          durationMs: Math.max(0, failedAt.getTime() - executionStartedAt.getTime()),
          error: message
        };
        await pgDb.update(workTasks).set({
          status: 'failed', errorMessage: message, output: failureReceipt, completedAt: failedAt, updatedAt: failedAt
        }).where(and(
          eq(workTasks.id, taskId), eq(workTasks.contractorId, contractorId),
          eq(workTasks.status, 'running'), eq(workTasks.attemptCount, claimed.attemptCount)
        ));
        try {
          await pgDb.insert(workEvents).values({
            id: 'evt_' + crypto.randomUUID(), contractorId,
            eventType: 'task.execution_failed', entityType: 'work_task', entityId: taskId,
            actorType: 'agent', actorId: 'hermes_agent', sourceModule: 'hermes_work_executor',
            correlationId: task.correlationId || taskId,
            summary: `Hermes failed: ${task.title}.`,
            payload: { toolId, error: message }
          });
        } catch (ledgerError) {
          console.error('[Hermes Work History] Could not append failed execution event:', ledgerError);
        }
        return { success: false, taskId, status: 'failed', error: message, retryAvailable: claimed.attemptCount < claimed.maxAttempts };
      }
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
        .select({
          campaignName: googleAdsDailyPerformance.campaignName,
          date: googleAdsDailyPerformance.date,
          cost: googleAdsDailyPerformance.cost,
          clicks: googleAdsDailyPerformance.clicks,
          conversions: googleAdsDailyPerformance.conversions
        })
        .from(googleAdsDailyPerformance)
        .where(eq(googleAdsDailyPerformance.contractorId, contractorId))
        .orderBy(desc(googleAdsDailyPerformance.date))
        .limit(5000);

      const analysis = analyzeCampaignPerformance(adsRecords, parsed.thresholdDropPct);
      await pgDb.insert(auditLogs).values({
        id: auditId,
        contractorId,
        action: 'HERMES_MCP_ANOMALIES_INSPECTED',
        details: JSON.stringify({
          anomaliesFound: analysis.anomalies.length,
          screeningSignals: analysis.screeningSignals.length,
          thresholdDropPct: parsed.thresholdDropPct,
          comparisonWindow: analysis.window
        }),
        timestamp: new Date()
      });

      return {
        comparisonWindow: analysis.window,
        anomaliesDetected: analysis.anomalies.length,
        anomalies: analysis.anomalies,
        screeningSignals: analysis.screeningSignals,
        evidenceRows: adsRecords.length
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

    case 'hal_audit_website_connectivity': {
      const rawUrl = typeof rawParams?.url === 'string' ? rawParams.url.trim() : '';
      const leadId = typeof rawParams?.leadId === 'string' ? rawParams.leadId.trim() : '';
      if (!rawUrl || rawUrl.length > 2048 || (leadId && leadId.length > 128)) {
        throw new Error('A website URL up to 2048 characters and an optional valid lead ID are required.');
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(/^https?:\\/\\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl);
      } catch {
        throw new Error('Target website URL is invalid.');
      }
      if ((parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') || parsedUrl.username || parsedUrl.password) {
        throw new Error('Only public HTTP/HTTPS domain names without embedded credentials are supported.');
      }

      const [linkedLead] = leadId
        ? await pgDb.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.contractorId, contractorId))).limit(1)
        : [];
      if (leadId && !linkedLead) throw new Error('Lead not found or inaccessible in this workspace.');

      const targetUrl = parsedUrl.origin + parsedUrl.pathname;
      const probe = await validateDomainAndDns(targetUrl, { probeHttp: true, timeoutMs: 5000 });
      const vulnerabilities: string[] = [];
      const recommendedFixes: string[] = [];
      if (!probe.dnsResolved) {
        vulnerabilities.push(probe.rejectionReason || 'Public DNS resolution could not be confirmed.');
        recommendedFixes.push('Confirm the domain registration and public DNS records point to the intended web host.');
      } else if (!probe.httpReachable) {
        vulnerabilities.push('Public DNS resolved, but the pinned HTTP/TLS HEAD probe did not receive a usable response.');
        recommendedFixes.push('Check web-server availability, firewall rules, and support for HEAD requests.');
      }
      if (probe.dnsResolved && probe.httpReachable && !probe.sslSecured) {
        vulnerabilities.push('HTTPS/TLS could not be confirmed; an HTTP response was reachable.');
        recommendedFixes.push('Install or repair a valid TLS certificate and redirect HTTP traffic to HTTPS.');
      }
      if (probe.httpReachable) recommendedFixes.push('Run a full Lighthouse or PageSpeed Insights audit before making performance or SEO claims.');

      const report = {
        targetUrl,
        businessName: typeof rawParams?.businessName === 'string' ? rawParams.businessName.slice(0, 200) : linkedLead?.businessName || null,
        city: typeof rawParams?.city === 'string' ? rawParams.city.slice(0, 120) : linkedLead?.city || null,
        niche: typeof rawParams?.niche === 'string' ? rawParams.niche.slice(0, 120) : linkedLead?.niche || null,
        sslStatus: probe.sslSecured ? 'secured' : probe.httpReachable ? 'missing' : 'unknown',
        dnsResolved: probe.dnsResolved,
        httpReachable: probe.httpReachable,
        httpStatus: probe.httpStatus ?? null,
        ipAddresses: probe.ipAddresses || [],
        measurementStatus: probe.httpReachable ? 'partial' : 'unreachable',
        pageSpeedStatus: 'not_configured',
        measurementSource: 'HAL public DNS lookup and pinned, non-redirecting HTTP/TLS HEAD probe',
        measurementLimitations: [
          'No PageSpeed or Lighthouse measurement was run.',
          'No SEO crawler or Google Business Profile lookup was run.',
          'No lead-loss, conversion, or revenue estimate was calculated.',
          'TLS certificate expiry was not measured.'
        ],
        identifiedVulnerabilities: vulnerabilities,
        recommendedFixes,
        generatedAt: new Date().toISOString()
      };

      if (linkedLead) {
        await pgDb.update(leads).set({ sslStatus: report.sslStatus, updatedAt: new Date() })
          .where(and(eq(leads.id, linkedLead.id), eq(leads.contractorId, contractorId)));
        await pgDb.insert(leadEvents).values({
          id: crypto.randomUUID(), leadId: linkedLead.id, eventType: 'WebsiteConnectivityAuditCompleted',
          newStage: linkedLead.status,
          notes: JSON.stringify({ targetUrl, measurementStatus: report.measurementStatus, dnsResolved: report.dnsResolved, httpReachable: report.httpReachable, sslStatus: report.sslStatus, pageSpeedStatus: report.pageSpeedStatus })
        });
      }

      const auditId = crypto.randomUUID();
      await recordWorkEvent(pgDb, {
        contractorId,
        eventType: 'website_audit.completed',
        entityType: linkedLead ? 'lead' : 'website_audit',
        entityId: linkedLead?.id || auditId,
        actorType: 'agent',
        actorId: 'hal_assistant',
        sourceModule: 'website_audit',
        correlationId: linkedLead?.id || auditId,
        summary: `Completed DNS/HTTP/TLS connectivity check for ${report.businessName || targetUrl}.`,
        payload: { targetUrl, measurementStatus: report.measurementStatus, dnsResolved: report.dnsResolved, httpReachable: report.httpReachable, sslStatus: report.sslStatus, pageSpeedStatus: report.pageSpeedStatus }
      });
      return { success: true, report };
    }

    case 'hermes_synthesize_lab_asset': {
      const toolId = rawParams?.toolId as LabToolType;
      const allowedToolIds: LabToolType[] = [
        'landing_page', 'ad_copy_studio', 'seo_schema_generator', 'outreach_sequences',
        'sms_review_booster', 'speed_vitals_optimizer', 'competitor_intel_scout',
        'webhook_resilience_fixer', 'negative_keyword_miner', 'deep_case_reasoner'
      ];
      const parameters = rawParams?.parameters && typeof rawParams.parameters === 'object' && !Array.isArray(rawParams.parameters)
        ? rawParams.parameters as Record<string, any>
        : {};
      const promptOverride = typeof rawParams?.promptOverride === 'string'
        ? rawParams.promptOverride.slice(0, 12000)
        : undefined;

      if (!allowedToolIds.includes(toolId) || JSON.stringify(parameters).length > 20000) {
        throw new Error('A registered Hermes Lab tool and parameters object within 20 KB are required.');
      }

      // Keep the legacy MCP tool compatible, but never let it bypass the durable
      // queue, approval policy, atomic claim, or persisted execution receipt.
      const created = await executeMcpTool('hal_create_work_task', {
        taskType: 'hermes_lab_asset',
        title: `Hermes: ${toolId.replace(/_/g, ' ')}`,
        description: 'Create a local draft Hermes Lab artifact from supplied parameters. External actions are out of scope.',
        assignedWorker: 'hermes',
        priority: 'normal',
        input: { toolId, parameters, ...(promptOverride ? { promptOverride } : {}) }
      }, contractorId, { actorType: 'agent', actorId: 'mcp_client', sourceModule: 'hermes_lab' });

      const task = created?.task;
      if (!task?.id) throw new Error('Hermes work task could not be created.');
      if (task.status === 'awaiting_approval') {
        return { success: false, pendingApproval: true, taskId: task.id, status: task.status, message: 'Human approval is required before Hermes can execute this task.' };
      }

      const execution = await executeMcpTool('hal_execute_hermes_work_task', { taskId: task.id }, contractorId, {
        actorType: 'agent', actorId: 'mcp_client', sourceModule: 'hermes_lab'
      });
      if (!execution?.success || !execution?.receipt?.artifactId) {
        return { success: false, taskId: task.id, status: execution?.status || execution?.task?.status || 'failed', error: execution?.error || 'Hermes did not return a verified artifact receipt.' };
      }

      const [artifact] = await pgDb.select().from(hermesLabArtifacts).where(and(
        eq(hermesLabArtifacts.id, execution.receipt.artifactId),
        eq(hermesLabArtifacts.contractorId, contractorId)
      )).limit(1);
      if (!artifact) {
        throw new Error('Hermes execution completed, but its saved artifact could not be reloaded.');
      }

      return { success: true, taskId: task.id, toolId, receipt: execution.receipt, artifact };
    }

    default:
      throw new Error(`Unrecognized MCP tool: ${toolName}`);
  }
}
