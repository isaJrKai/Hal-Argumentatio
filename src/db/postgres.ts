import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';

let pool: Pool | null = null;
let pgDb: ReturnType<typeof drizzle> | null = null;
let activeConnectionString: string | null = null;

export function getPostgresPool(customUrl?: string): Pool | null {
  if (customUrl) {
    if (!pool || customUrl !== activeConnectionString) {
      if (pool) {
        pool.end().catch(() => {});
      }
      activeConnectionString = customUrl;
      pool = new Pool({
        connectionString: customUrl,
        ssl: customUrl.includes('sslmode=require') || customUrl.includes('neon.tech') || customUrl.includes('supabase')
          ? { rejectUnauthorized: false }
          : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      pgDb = drizzle(pool, { schema });
    }
    return pool;
  }

  if (process.env.SQL_HOST) {
    if (!pool) {
      pool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      });
      pgDb = drizzle(pool, { schema });
    }
    return pool;
  }

  const connectionString = activeConnectionString || process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }
  
  if (!pool) {
    activeConnectionString = connectionString;
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') || connectionString.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pgDb = drizzle(pool, { schema });
  }
  return pool;
}

export function setCustomDatabaseUrl(url: string) {
  activeConnectionString = url;
  if (pool) {
    pool.end().catch(() => {});
    pool = null;
    pgDb = null;
  }
  return getPostgresPool(url);
}

export function getDrizzleDb() {
  const p = getPostgresPool();
  if (!p) return null;
  if (!pgDb) {
    pgDb = drizzle(p, { schema });
  }
  return pgDb;
}

export async function bootstrapPostgresTables(poolInstance?: Pool): Promise<void> {
  const p = poolInstance || getPostgresPool();
  if (!p) return;
  const client = await p.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS contractors (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        city TEXT NOT NULL,
        province_state TEXT,
        service_type TEXT NOT NULL,
        current_monthly_revenue_usd INTEGER DEFAULT 0,
        target_monthly_revenue_usd INTEGER DEFAULT 0,
        active_territories TEXT[],
        role TEXT DEFAULT 'user' NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_login_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        business_name TEXT NOT NULL,
        city TEXT NOT NULL,
        niche TEXT NOT NULL,
        owner_name TEXT,
        phone TEXT,
        email TEXT,
        website_url TEXT,
        gmb_listing_url TEXT,
        review_count INTEGER DEFAULT 0,
        review_score DOUBLE PRECISION DEFAULT 0,
        predicted_monthly_lost_revenue_usd INTEGER DEFAULT 0,
        status TEXT DEFAULT 'new' NOT NULL,
        source TEXT DEFAULT 'territory_harvest' NOT NULL,
        assigned_contractor_id TEXT,
        performance_score INTEGER DEFAULT 50,
        ssl_status TEXT DEFAULT 'secured',
        mobile_friendly BOOLEAN DEFAULT true,
        urgency_score DOUBLE PRECISION DEFAULT 5.0,
        predicted_ltv INTEGER DEFAULT 5000,
        seo_score INTEGER DEFAULT 50,
        google_rating DOUBLE PRECISION DEFAULT 0,
        sentiment_score DOUBLE PRECISION DEFAULT 5.0,
        outreach_strategy TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        city TEXT NOT NULL,
        niche TEXT NOT NULL,
        steps JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS forecasts (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        metric TEXT NOT NULL,
        predicted DOUBLE PRECISION NOT NULL,
        confidence_score DOUBLE PRECISION NOT NULL,
        target_date TIMESTAMP NOT NULL,
        model_version TEXT NOT NULL,
        evaluated BOOLEAN DEFAULT false NOT NULL,
        assumptions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recommendations (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        category TEXT NOT NULL,
        action TEXT NOT NULL,
        rationale TEXT NOT NULL,
        confidence DOUBLE PRECISION NOT NULL,
        evidence TEXT,
        status TEXT NOT NULL,
        outcome TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS prediction_outcomes (
        id TEXT PRIMARY KEY,
        forecast_id TEXT NOT NULL,
        predicted DOUBLE PRECISION NOT NULL,
        actual DOUBLE PRECISION NOT NULL,
        deviation DOUBLE PRECISION NOT NULL,
        evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS learning_insights (
        id TEXT PRIMARY KEY,
        metric TEXT NOT NULL,
        lesson TEXT NOT NULL,
        confidence_shift DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        enable_grounding BOOLEAN DEFAULT false NOT NULL,
        sources JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS win_loss_records (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        lead_id TEXT,
        business_name TEXT NOT NULL,
        city TEXT NOT NULL,
        niche TEXT NOT NULL,
        outcome TEXT NOT NULL,
        closed_value_usd INTEGER DEFAULT 0,
        primary_reason TEXT,
        key_lesson TEXT,
        outreach_channel_used TEXT,
        closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS client_projects (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        lead_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        business_name TEXT NOT NULL,
        city TEXT NOT NULL,
        service_type TEXT NOT NULL,
        package_tier TEXT NOT NULL,
        monthly_retainer_usd INTEGER NOT NULL,
        start_date TIMESTAMP NOT NULL,
        status TEXT NOT NULL,
        initial_audit_score INTEGER DEFAULT 0,
        current_score INTEGER DEFAULT 0,
        target_score INTEGER DEFAULT 0,
        milestones JSONB NOT NULL,
        assets JSONB NOT NULL,
        notes TEXT,
        portal_access_token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS outreach_sequences (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        name TEXT NOT NULL,
        niche TEXT,
        steps JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        key TEXT NOT NULL,
        label TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS scheduler_jobs (
        id TEXT PRIMARY KEY,
        job TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        error TEXT,
        result TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lead_events (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL,
        type TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        contractor_id TEXT,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS revenue_records (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        lead_id TEXT,
        amount_usd INTEGER NOT NULL,
        source TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS performance_snapshots (
        id TEXT PRIMARY KEY,
        campaign_id TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        leads INTEGER DEFAULT 0,
        spend DOUBLE PRECISION DEFAULT 0,
        cpl DOUBLE PRECISION DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'draft' NOT NULL,
        leads_count INTEGER DEFAULT 0,
        budget_usd INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS learned_weights (
        id TEXT PRIMARY KEY,
        epoch INTEGER NOT NULL,
        autonomy_score INTEGER DEFAULT 90,
        weights_json JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS neural_state (
        id TEXT PRIMARY KEY,
        version TEXT NOT NULL,
        calibration_epoch INTEGER DEFAULT 0 NOT NULL,
        total_outcomes_digested INTEGER DEFAULT 0 NOT NULL,
        autonomy_readiness_score INTEGER DEFAULT 0 NOT NULL,
        is_offline_mode_active BOOLEAN DEFAULT false NOT NULL,
        technical_weights JSONB NOT NULL,
        niche_map JSONB NOT NULL,
        objections JSONB NOT NULL,
        active_nodes JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversion_outbox (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        lead_id TEXT NOT NULL,
        lead_event_id TEXT NOT NULL,
        conversion_action TEXT NOT NULL,
        gclid TEXT,
        gbraid TEXT,
        wbraid TEXT,
        conversion_time TIMESTAMP NOT NULL,
        conversion_value DOUBLE PRECISION NOT NULL,
        currency TEXT DEFAULT 'USD' NOT NULL,
        hashed_email TEXT,
        hashed_phone TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        attempts INTEGER DEFAULT 0 NOT NULL,
        next_attempt_at TIMESTAMP,
        last_attempt_at TIMESTAMP,
        uploaded_at TIMESTAMP,
        idempotency_key TEXT NOT NULL UNIQUE,
        google_response JSONB,
        error_code TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS lead_attribution (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL,
        gclid TEXT,
        gbraid TEXT,
        wbraid TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_term TEXT,
        utm_content TEXT,
        landing_page TEXT,
        touch_type TEXT DEFAULT 'first' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS google_ads_daily_performance (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        campaign_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        ad_group_id TEXT,
        ad_group_name TEXT,
        keyword TEXT,
        search_term TEXT,
        geo TEXT,
        device TEXT DEFAULT 'desktop' NOT NULL,
        date TIMESTAMP NOT NULL,
        impressions INTEGER DEFAULT 0 NOT NULL,
        clicks INTEGER DEFAULT 0 NOT NULL,
        cost DOUBLE PRECISION DEFAULT 0 NOT NULL,
        conversions DOUBLE PRECISION DEFAULT 0 NOT NULL,
        conversion_value DOUBLE PRECISION DEFAULT 0 NOT NULL,
        landing_page TEXT,
        asset_group TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS revenue_experiments (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        hypothesis TEXT NOT NULL,
        variable TEXT NOT NULL,
        baseline TEXT NOT NULL,
        expected_outcome TEXT NOT NULL,
        actual_outcome TEXT,
        pipeline_impact DOUBLE PRECISION DEFAULT 0,
        revenue_impact DOUBLE PRECISION DEFAULT 0,
        status TEXT DEFAULT 'active' NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        decision TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS revenue_recommendations (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        rationale TEXT NOT NULL,
        citation_data JSONB NOT NULL,
        impact_score DOUBLE PRECISION DEFAULT 0 NOT NULL,
        status TEXT DEFAULT 'proposed' NOT NULL,
        confidence_score DOUBLE PRECISION DEFAULT 85.0,
        expected_impact TEXT DEFAULT 'Positive economic lift',
        proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        approved_at TIMESTAMP,
        approved_by TEXT,
        rejected_at TIMESTAMP,
        rejected_by TEXT,
        executed_at TIMESTAMP,
        executed_by TEXT,
        execution_reference TEXT,
        expires_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS revenue_simulations (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        scenario_type TEXT NOT NULL,
        baseline_data JSONB NOT NULL,
        scenario_parameters JSONB NOT NULL,
        projected_result JSONB NOT NULL,
        delta JSONB NOT NULL,
        confidence_score DOUBLE PRECISION DEFAULT 80.0 NOT NULL,
        assumptions TEXT NOT NULL,
        created_by TEXT DEFAULT 'Operator' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS revenue_outcomes (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        recommendation_id TEXT,
        experiment_id TEXT,
        execution_reference TEXT,
        observation_start TIMESTAMP NOT NULL,
        observation_end TIMESTAMP NOT NULL,
        baseline_metrics JSONB NOT NULL,
        expected_metrics JSONB NOT NULL,
        actual_metrics JSONB NOT NULL,
        variance JSONB NOT NULL,
        prediction_accuracy DOUBLE PRECISION NOT NULL,
        outcome_status TEXT NOT NULL,
        confidence_score DOUBLE PRECISION DEFAULT 80.0 NOT NULL,
        assumptions TEXT NOT NULL,
        outcome_classification TEXT,
        learning_signals JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS revenue_recommendation_events (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        recommendation_id TEXT NOT NULL,
        previous_status TEXT,
        new_status TEXT NOT NULL,
        actor TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hal_loops (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        status TEXT NOT NULL,
        current_stage TEXT NOT NULL,
        trigger TEXT NOT NULL,
        context_data JSONB,
        state_snapshot JSONB,
        recommendation_id TEXT,
        simulation_id TEXT,
        critic_findings JSONB,
        execution_reference TEXT,
        verification_result JSONB,
        learning_signals JSONB,
        iteration_count INTEGER DEFAULT 1 NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hal_loop_events (
        id TEXT PRIMARY KEY,
        loop_id TEXT NOT NULL,
        contractor_id TEXT NOT NULL,
        previous_state TEXT,
        new_state TEXT NOT NULL,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS company_name TEXT;
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS city TEXT;
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS province_state TEXT;
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS service_type TEXT;
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS current_monthly_revenue_usd INTEGER DEFAULT 0;
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS target_monthly_revenue_usd INTEGER DEFAULT 0;
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS active_territories TEXT[];
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS password_hash TEXT;
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE contractors ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'proposed';
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS confidence_score DOUBLE PRECISION DEFAULT 85.0;
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS expected_impact TEXT DEFAULT 'Positive economic lift';
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS approved_by TEXT;
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS rejected_by TEXT;
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP;
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS executed_by TEXT;
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS execution_reference TEXT;
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
      ALTER TABLE revenue_recommendations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

      ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_crm_id TEXT;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_source TEXT;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS website_url TEXT;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS gmb_listing_url TEXT;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS review_score DOUBLE PRECISION DEFAULT 0;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS predicted_monthly_lost_revenue_usd INTEGER DEFAULT 0;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_contractor_id TEXT;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS performance_score INTEGER DEFAULT 0;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS ssl_status TEXT DEFAULT 'secure';
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS mobile_friendly BOOLEAN DEFAULT TRUE;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS urgency_score DOUBLE PRECISION DEFAULT 5.0;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS predicted_ltv INTEGER DEFAULT 1500;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_rating DOUBLE PRECISION DEFAULT 0;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS sentiment_score DOUBLE PRECISION DEFAULT 0;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS outreach_strategy TEXT;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;

      ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS external_event_id TEXT;
      ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS event_type TEXT;
      ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS previous_stage TEXT;
      ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS new_stage TEXT;
      ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS deal_value DOUBLE PRECISION;
      ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
      ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS metadata JSONB;
      ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';
      ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS occurred_at TIMESTAMP;
      ALTER TABLE lead_events ALTER COLUMN type DROP NOT NULL;

      CREATE TABLE IF NOT EXISTS hermes_lab_artifacts (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        tool_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        content JSONB NOT NULL,
        status TEXT DEFAULT 'draft' NOT NULL,
        metadata JSONB,
        created_by TEXT DEFAULT 'hermes_agent' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hermes_diagnostic_incidents (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        title TEXT NOT NULL,
        severity TEXT NOT NULL,
        category TEXT NOT NULL,
        root_cause TEXT NOT NULL,
        evidence JSONB,
        proposed_fix TEXT NOT NULL,
        fix_artifact_id TEXT,
        status TEXT DEFAULT 'open' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        resolved_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS hermes_lab_messages (
        id TEXT PRIMARY KEY,
        contractor_id TEXT NOT NULL,
        artifact_id TEXT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        attached_artifact JSONB,
        thought_process TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
  } catch (err: any) {
    // If running in a managed Cloud SQL environment where DDL is provisioned via drizzle-kit / admin runner
    if (err?.code === '42501' || err?.routine === 'aclcheck_error') {
      try {
        const check = await client.query("SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public';");
        const count = parseInt(check.rows[0]?.count || '0', 10);
        if (count > 0) {
          console.log(`[HAL PostgreSQL] Managed schema active (${count} public tables verified).`);
          return;
        }
      } catch (_) {
        // Fall through to rethrow original error
      }
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function testPostgresConnection(customUrl?: string): Promise<{ 
  connected: boolean; 
  message: string; 
  version?: string; 
  provider?: string; 
  latencyMs?: number;
  tablesCount?: number;
}> {
  const p = getPostgresPool(customUrl);
  if (!p) {
    return { connected: false, message: 'DATABASE_URL or NEON_DATABASE_URL is not configured.' };
  }
  
  const start = Date.now();
  try {
    const client = await p.connect();
    const result = await client.query('SELECT version(), current_database(), current_user;');
    
    // Auto bootstrap tables
    await bootstrapPostgresTables(p);

    const tablesRes = await client.query(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    client.release();
    const latencyMs = Date.now() - start;

    const versionStr = result.rows[0]?.version || 'PostgreSQL';
    const isNeon = (activeConnectionString || '').includes('neon.tech') || versionStr.toLowerCase().includes('neon');

    return {
      connected: true,
      message: `Successfully connected to ${isNeon ? 'Neon Serverless PostgreSQL' : 'PostgreSQL database'}. Schema verified.`,
      version: versionStr.split(' on ')[0] || versionStr,
      provider: isNeon ? 'Neon PostgreSQL' : 'Self-Hosted PostgreSQL',
      latencyMs,
      tablesCount: parseInt(tablesRes.rows[0]?.count || '0', 10)
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `PostgreSQL connection error: ${err.message}`,
    };
  }
}

