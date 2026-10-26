import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { db as pgDb } from '../../db/index.ts';
import { 
  contractors,
  leads, 
  missions, 
  forecasts, 
  recommendations, 
  campaigns, 
  clientProjects, 
  outreachSequences, 
  leadEvents, 
  auditLogs, 
  revenueRecords, 
  winLossRecords, 
  halLoops, 
  hermesDiagnosticIncidents, 
  hermesLabArtifacts, 
  schedulerJobs,
  notifications,
  revenueRecommendations
} from '../../db/schema.ts';
import { db as localDb, decrypt } from '../../db/db.ts';
import { eq, and, desc, sql, like, or } from 'drizzle-orm';

// Common annotations required for all read-only MCP tools
const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true as const,
  destructiveHint: false as const,
  idempotentHint: true as const,
  openWorldHint: false as const,
};

// Response formatting with 25,000 character safety limit truncation
function formatMcpResponse(data: unknown) {
  let jsonStr = JSON.stringify(data, null, 2);
  const MAX_CHARS = 25000;
  if (jsonStr.length > MAX_CHARS) {
    jsonStr = jsonStr.slice(0, 24600) + '\n\n... [TRUNCATED: Response exceeded 25,000 character safety limit. Use limit & offset to page through results.]';
  }
  return {
    content: [{ type: 'text' as const, text: jsonStr }]
  };
}

// Error formatting adhering to MCP standard
function formatMcpError(message: string) {
  return {
    isError: true as const,
    content: [{ type: 'text' as const, text: `Error: ${message}` }]
  };
}

// Check if PostgreSQL environment variables are configured
function isPostgresConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL || 
    process.env.NEON_DATABASE_URL || 
    process.env.SQL_HOST
  );
}

// Resolves the contractorId from env or automatically identifies the owner/first account
export async function getEffectiveContractorId(): Promise<string> {
  const envId = process.env.HAL_MCP_CONTRACTOR_ID?.trim();
  if (!envId) {
    throw new Error('HAL_MCP_CONTRACTOR_ID must be explicitly configured before MCP tools can access account data.');
  }
  return envId;
}

// Strips sensitive fields and decrypts PII safely
function sanitizeProspect(lead: any) {
  const email = lead.emailEncrypted ? (decrypt(lead.emailEncrypted) || lead.email) : lead.email;
  const phone = lead.phoneEncrypted ? (decrypt(lead.phoneEncrypted) || lead.phone) : lead.phone;

  return {
    id: lead.id,
    contractorId: lead.contractorId,
    businessName: lead.businessName,
    ownerName: lead.ownerName || null,
    city: lead.city,
    niche: lead.niche || lead.serviceType,
    email: email && !email.includes('[ENCRYPTED]') ? email : (lead.emailEncrypted ? '[DECRYPTED]' : null),
    phone: phone && !phone.includes('[ENCRYPTED]') ? phone : (lead.phoneEncrypted ? '[DECRYPTED]' : null),
    websiteUrl: lead.websiteUrl || null,
    gmbListingUrl: lead.gmbListingUrl || null,
    reviewCount: lead.reviewCount ?? 0,
    reviewScore: lead.reviewScore ?? 0,
    predictedMonthlyLostRevenueUsd: lead.predictedMonthlyLostRevenueUsd ?? 0,
    status: lead.status,
    source: lead.source,
    sourceType: lead.sourceType || 'live_harvest',
    verificationStatus: lead.verificationStatus || 'VERIFIED',
    dnsVerified: Boolean(lead.dnsVerified),
    performanceScore: lead.performanceScore ?? 50,
    sslStatus: lead.sslStatus || 'secured',
    mobileFriendly: lead.mobileFriendly ?? true,
    urgencyScore: lead.urgencyScore ?? 5.0,
    predictedLtv: lead.predictedLtv ?? lead.predictedLtvUsd ?? 5000,
    seoScore: lead.seoScore ?? 50,
    googleRating: lead.googleRating ?? 0,
    sentimentScore: lead.sentimentScore ?? 5.0,
    notes: lead.notes || null,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt
  };
}

/**
 * Builds and returns a fresh, stateless instance of McpServer with all read-only tools registered.
 */
export function buildHalMcpServer(): McpServer {
  const server = new McpServer({
    name: 'hal-mcp-server',
    version: '1.0.0'
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. hal_status: Confirms DB connection & row counts across main tables
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_status', {
    title: 'HAL System & Database Status',
    description: 'Confirms database connectivity, active configuration, and returns row counts for all primary business tables. Clearly indicates when database environment variables are missing.',
    annotations: READ_ONLY_ANNOTATIONS
  }, async () => {
    try {
      const contractorId = await getEffectiveContractorId();
      const hasDbEnv = isPostgresConfigured();

      let dbConnected = false;
      let dbErrorMessage: string | null = null;
      let counts: Record<string, number> = {};

      if (hasDbEnv) {
        try {
          await pgDb.execute(sql`SELECT 1`);
          dbConnected = true;

          // Gather live counts scoped to contractor
          const [
            leadCount,
            missionCount,
            campaignCount,
            sequenceCount,
            projectCount,
            eventCount,
            auditCount,
            revenueCount,
            forecastCount,
            recCount,
            debriefCount,
            loopCount,
            incidentCount,
            artifactCount,
            jobCount
          ] = await Promise.all([
            pgDb.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(missions).where(eq(missions.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(campaigns).where(eq(campaigns.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(outreachSequences).where(eq(outreachSequences.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(clientProjects).where(eq(clientProjects.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(leadEvents),
            pgDb.select({ count: sql<number>`count(*)` }).from(auditLogs).where(eq(auditLogs.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(revenueRecords).where(eq(revenueRecords.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(forecasts).where(eq(forecasts.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(revenueRecommendations).where(eq(revenueRecommendations.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(winLossRecords).where(eq(winLossRecords.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(halLoops).where(eq(halLoops.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(hermesDiagnosticIncidents).where(eq(hermesDiagnosticIncidents.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(hermesLabArtifacts).where(eq(hermesLabArtifacts.contractorId, contractorId)),
            pgDb.select({ count: sql<number>`count(*)` }).from(schedulerJobs)
          ]);

          counts = {
            prospects: Number(leadCount[0]?.count || 0),
            missions: Number(missionCount[0]?.count || 0),
            campaigns: Number(campaignCount[0]?.count || 0),
            outreach_sequences: Number(sequenceCount[0]?.count || 0),
            client_projects: Number(projectCount[0]?.count || 0),
            lead_events: Number(eventCount[0]?.count || 0),
            audit_logs: Number(auditCount[0]?.count || 0),
            revenue_records: Number(revenueCount[0]?.count || 0),
            forecasts: Number(forecastCount[0]?.count || 0),
            recommendations: Number(recCount[0]?.count || 0),
            win_loss_debriefs: Number(debriefCount[0]?.count || 0),
            operating_loops: Number(loopCount[0]?.count || 0),
            diagnostic_incidents: Number(incidentCount[0]?.count || 0),
            lab_artifacts: Number(artifactCount[0]?.count || 0),
            scheduled_tasks: Number(jobCount[0]?.count || 0)
          };
        } catch (err: any) {
          dbConnected = false;
          dbErrorMessage = err.message || 'Postgres query failed';
        }
      }

      // Fallback row counts if postgres is not connected or env vars missing
      if (!dbConnected) {
        const localLeads = localDb.getLeads(contractorId) || [];
        const localCampaigns = localDb.getCampaigns(contractorId) || [];
        const localForecasts = localDb.getForecasts(contractorId) || [];
        const localRecs = localDb.getRecommendations(contractorId) || [];
        const localMissions = localDb.getMissions(contractorId) || [];

        counts = {
          prospects: localLeads.length,
          campaigns: localCampaigns.length,
          forecasts: localForecasts.length,
          recommendations: localRecs.length,
          missions: localMissions.length,
          client_projects: 0,
          outreach_sequences: 0,
          audit_logs: 0,
          revenue_records: 0,
          win_loss_debriefs: 0,
          operating_loops: 0,
          diagnostic_incidents: 0,
          lab_artifacts: 0,
          scheduled_tasks: 0
        };
      }

      return formatMcpResponse({
        status: dbConnected ? 'connected' : 'degraded',
        database_connected: dbConnected,
        database_engine: dbConnected ? 'postgresql' : 'local_encrypted_store',
        database_env_configured: hasDbEnv,
        missing_env_vars: hasDbEnv ? [] : ['DATABASE_URL', 'NEON_DATABASE_URL', 'SQL_HOST'],
        database_error: dbErrorMessage,
        contractor_id_scoped: contractorId,
        mcp_env_contractor_id_set: Boolean(process.env.HAL_MCP_CONTRACTOR_ID),
        table_row_counts: counts,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return formatMcpError(err.message || 'Failed to determine status');
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. hal_list_prospects: Pagination, contains search filter, returns stats
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_prospects', {
    title: 'List Prospects',
    description: 'Lists prospects and territory leads for the current contractor. Supports text search across company name, city, niche, and pagination.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25).describe('Max prospects to return (1-100, default 25)'),
      offset: z.number().min(0).default(0).describe('Zero-based pagination offset (default 0)'),
      contains: z.string().optional().describe('Optional search string to filter by business name, owner, city, niche, or notes')
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0, contains }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let allLeads: any[] = [];

      try {
        allLeads = await pgDb
          .select()
          .from(leads)
          .where(eq(leads.contractorId, contractorId))
          .orderBy(desc(leads.createdAt));
      } catch {
        allLeads = localDb.getLeads(contractorId) || [];
      }

      let sanitized = allLeads.map(sanitizeProspect);

      if (contains && contains.trim().length > 0) {
        const query = contains.trim().toLowerCase();
        sanitized = sanitized.filter(l => 
          (l.businessName && l.businessName.toLowerCase().includes(query)) ||
          (l.ownerName && l.ownerName.toLowerCase().includes(query)) ||
          (l.city && l.city.toLowerCase().includes(query)) ||
          (l.niche && l.niche.toLowerCase().includes(query)) ||
          (l.notes && l.notes.toLowerCase().includes(query))
        );
      }

      const total = sanitized.length;
      const paginated = sanitized.slice(offset, offset + limit);
      const has_more = offset + limit < total;

      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more,
        prospects: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list prospects: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. hal_get_prospect: Retrieve full prospect details by ID
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_get_prospect', {
    title: 'Get Prospect Details',
    description: 'Retrieves the complete record and diagnostic deficit scores for a single prospect by their unique ID.',
    inputSchema: z.object({
      id: z.string().describe('The unique ID of the prospect')
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ id }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let target: any = null;

      try {
        const [found] = await pgDb
          .select()
          .from(leads)
          .where(
            and(
              eq(leads.id, id),
              eq(leads.contractorId, contractorId)
            )
          )
          .limit(1);
        target = found;
      } catch {
        const localLeads = localDb.getLeads(contractorId) || [];
        target = localLeads.find(l => l.id === id);
      }

      if (!target) {
        return formatMcpError(`Prospect with ID '${id}' was not found for contractor '${contractorId}'.`);
      }

      return formatMcpResponse(sanitizeProspect(target));
    } catch (err: any) {
      return formatMcpError(`Failed to get prospect: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. hal_pipeline_summary: Grouped counts & value by status, niche, city, etc.
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_pipeline_summary', {
    title: 'Pipeline Summary',
    description: 'Computes aggregated metrics, breakdown counts, and total projected pipeline value grouped by status, niche, city, or verification status.',
    inputSchema: z.object({
      group_by: z.enum(['status', 'niche', 'city', 'source', 'verification_status']).default('status').describe('Field to group prospects by (default: "status")')
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ group_by = 'status' }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let allLeads: any[] = [];

      try {
        allLeads = await pgDb
          .select()
          .from(leads)
          .where(eq(leads.contractorId, contractorId));
      } catch {
        allLeads = localDb.getLeads(contractorId) || [];
      }

      const counts: Record<string, number> = {};
      let totalValueUsd = 0;
      let totalLostRevenueUsd = 0;

      for (const lead of allLeads) {
        let key = 'unknown';
        if (group_by === 'status') key = lead.status || 'new';
        else if (group_by === 'niche') key = lead.niche || lead.serviceType || 'general';
        else if (group_by === 'city') key = lead.city || 'unspecified';
        else if (group_by === 'source') key = lead.source || 'manual';
        else if (group_by === 'verification_status') key = lead.verificationStatus || 'VERIFIED';

        counts[key] = (counts[key] || 0) + 1;
        totalValueUsd += Number(lead.predictedLtv || lead.predictedLtvUsd || 0);
        totalLostRevenueUsd += Number(lead.predictedMonthlyLostRevenueUsd || 0);
      }

      return formatMcpResponse({
        group_by,
        total_prospects: allLeads.length,
        total_projected_ltv_usd: totalValueUsd,
        total_predicted_monthly_lost_revenue_usd: totalLostRevenueUsd,
        breakdown: counts
      });
    } catch (err: any) {
      return formatMcpError(`Failed to generate pipeline summary: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. hal_list_outreach: Sequences and cadence steps
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_outreach', {
    title: 'List Outreach Sequences',
    description: 'Lists cold outreach cadences, multi-channel templates, and messaging sequences.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(outreachSequences)
          .where(eq(outreachSequences.contractorId, contractorId))
          .orderBy(desc(outreachSequences.createdAt));
      } catch {
        records = [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        sequences: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list outreach sequences: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. hal_list_campaigns: Ad and outreach campaigns
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_campaigns', {
    title: 'List Campaigns',
    description: 'Lists all marketing, outbound, and ad campaigns along with budgets and lead counts.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(campaigns)
          .where(eq(campaigns.contractorId, contractorId))
          .orderBy(desc(campaigns.createdAt));
      } catch {
        records = localDb.getCampaigns(contractorId) || [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        campaigns: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list campaigns: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. hal_list_missions: Territory operations and launch missions
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_missions', {
    title: 'List Missions',
    description: 'Lists automated territory acquisition missions and operation pipelines.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(missions)
          .where(eq(missions.contractorId, contractorId))
          .orderBy(desc(missions.createdAt));
      } catch {
        records = localDb.getMissions(contractorId) || [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        missions: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list missions: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. hal_list_client_projects: Client work orders and retainer deliveries
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_client_projects', {
    title: 'List Client Projects & Work Orders',
    description: 'Lists retained clients, milestone progress, service tiers, and monthly retainer amounts.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(clientProjects)
          .where(eq(clientProjects.contractorId, contractorId))
          .orderBy(desc(clientProjects.createdAt));
      } catch {
        records = [];
      }

      // Safe projection: remove sensitive portal access tokens
      const safeRecords = records.map(r => ({
        id: r.id,
        clientName: r.clientName,
        businessName: r.businessName,
        city: r.city,
        serviceType: r.serviceType,
        packageTier: r.packageTier,
        monthlyRetainerUsd: r.monthlyRetainerUsd,
        status: r.status,
        initialAuditScore: r.initialAuditScore,
        currentScore: r.currentScore,
        targetScore: r.targetScore,
        milestones: r.milestones,
        startDate: r.startDate,
        createdAt: r.createdAt
      }));

      const total = safeRecords.length;
      const paginated = safeRecords.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        client_projects: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list client projects: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. hal_list_events: Timeline events, replies, stage transitions, and notes
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_events', {
    title: 'List Lead Events & Timeline',
    description: 'Lists lead status changes, inbound responses, bookings, and audit transitions.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(leadEvents)
          .orderBy(desc(leadEvents.createdAt));
      } catch {
        records = [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        events: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list lead events: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. hal_list_audits: Tamper-evident operational and security audit log
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_audits', {
    title: 'List Audit Logs',
    description: 'Lists operational and security audit log events recorded by HAL services.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(auditLogs)
          .where(eq(auditLogs.contractorId, contractorId))
          .orderBy(desc(auditLogs.timestamp));
      } catch {
        records = [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        audit_logs: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list audit logs: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. hal_list_tasks: Scheduled tasks, recurring jobs, and scanner runs
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_tasks', {
    title: 'List Scheduled Tasks',
    description: 'Lists automated recurring background tasks, daily sweeps, and health monitors.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(schedulerJobs)
          .orderBy(desc(schedulerJobs.createdAt));
      } catch {
        records = [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        tasks: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list scheduled tasks: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. hal_list_recommendations: AI revenue recommendations and proposed actions
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_recommendations', {
    title: 'List Recommendations',
    description: 'Lists AI-generated strategic revenue recommendations, impact projections, and rationales.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(revenueRecommendations)
          .where(eq(revenueRecommendations.contractorId, contractorId))
          .orderBy(desc(revenueRecommendations.createdAt));
      } catch {
        records = localDb.getRecommendations(contractorId) || [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        recommendations: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list recommendations: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. hal_list_forecasts: Forward-looking business predictions
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_forecasts', {
    title: 'List Forecasts',
    description: 'Lists predictive financial forecasts (leads, CPL, revenue) and confidence ratings.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(forecasts)
          .where(eq(forecasts.contractorId, contractorId))
          .orderBy(desc(forecasts.createdAt));
      } catch {
        records = localDb.getForecasts(contractorId) || [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        forecasts: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list forecasts: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 14. hal_list_revenue: Closed deal revenue and transaction logs
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_revenue', {
    title: 'List Revenue Records',
    description: 'Lists actual closed revenue transactions, sources, and dollar amounts.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(revenueRecords)
          .where(eq(revenueRecords.contractorId, contractorId))
          .orderBy(desc(revenueRecords.createdAt));
      } catch {
        records = [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        revenue_records: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list revenue records: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 15. hal_list_debriefs: Win/Loss deal debriefs and lessons
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_debriefs', {
    title: 'List Win/Loss Debriefs',
    description: 'Lists debrief records on won and lost deals, primary reasons, and strategic lessons.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(winLossRecords)
          .where(eq(winLossRecords.contractorId, contractorId))
          .orderBy(desc(winLossRecords.closedAt));
      } catch {
        records = [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        win_loss_records: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list win/loss debriefs: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 16. hal_list_loops: HAL 10-stage operating loop instances
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_loops', {
    title: 'List Operating Loops',
    description: 'Lists 10-stage autonomous business operating loop instances, triggers, and stages.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(halLoops)
          .where(eq(halLoops.contractorId, contractorId))
          .orderBy(desc(halLoops.createdAt));
      } catch {
        records = [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        loops: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list operating loops: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 17. hal_list_incidents: Diagnostic deficits, speed vitals, and website audits
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_incidents', {
    title: 'List Diagnostic Incidents',
    description: 'Lists discovered technical deficits, website speed bottlenecks, and automated fix recommendations.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(hermesDiagnosticIncidents)
          .where(eq(hermesDiagnosticIncidents.contractorId, contractorId))
          .orderBy(desc(hermesDiagnosticIncidents.createdAt));
      } catch {
        records = [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        incidents: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list diagnostic incidents: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 18. hal_list_artifacts: Hermes Lab generated assets (landing pages, ads, scripts)
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_artifacts', {
    title: 'List Lab Artifacts',
    description: 'Lists generated marketing assets, anti-AI landing pages, ad copies, and SEO schemas.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(hermesLabArtifacts)
          .where(eq(hermesLabArtifacts.contractorId, contractorId))
          .orderBy(desc(hermesLabArtifacts.createdAt));
      } catch {
        records = [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        artifacts: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list lab artifacts: ${err.message}`);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 19. hal_list_notifications: Operational alerts and notifications
  // ─────────────────────────────────────────────────────────────────────────────
  server.registerTool('hal_list_notifications', {
    title: 'List Notifications',
    description: 'Lists system notifications, pipeline alerts, and inbound response signals.',
    inputSchema: z.object({
      limit: z.number().min(1).max(100).default(25),
      offset: z.number().min(0).default(0)
    }),
    annotations: READ_ONLY_ANNOTATIONS
  }, async ({ limit = 25, offset = 0 }) => {
    try {
      const contractorId = await getEffectiveContractorId();
      let records: any[] = [];
      try {
        records = await pgDb
          .select()
          .from(notifications)
          .where(eq(notifications.contractorId, contractorId))
          .orderBy(desc(notifications.createdAt));
      } catch {
        records = [];
      }

      const total = records.length;
      const paginated = records.slice(offset, offset + limit);
      return formatMcpResponse({
        total,
        count: paginated.length,
        offset,
        has_more: offset + limit < total,
        notifications: paginated
      });
    } catch (err: any) {
      return formatMcpError(`Failed to list notifications: ${err.message}`);
    }
  });

  return server;
}
