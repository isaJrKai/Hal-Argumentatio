import { pgTable, text, timestamp, integer, doublePrecision, boolean, jsonb } from 'drizzle-orm/pg-core';

export const contractors = pgTable('contractors', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  city: text('city').notNull(),
  provinceState: text('province_state'),
  serviceType: text('service_type').notNull(),
  currentMonthlyRevenueUsd: integer('current_monthly_revenue_usd').default(0),
  targetMonthlyRevenueUsd: integer('target_monthly_revenue_usd').default(0),
  activeTerritories: text('active_territories').array(),
  role: text('role').default('user').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  businessName: text('business_name').notNull(),
  city: text('city').notNull(),
  niche: text('niche').notNull(),
  ownerName: text('owner_name'),
  phone: text('phone'),
  email: text('email'),
  externalCrmId: text('external_crm_id'),
  externalSource: text('external_source'),
  websiteUrl: text('website_url'),
  gmbListingUrl: text('gmb_listing_url'),
  reviewCount: integer('review_count').default(0),
  reviewScore: doublePrecision('review_score').default(0),
  predictedMonthlyLostRevenueUsd: integer('predicted_monthly_lost_revenue_usd').default(0),
  status: text('status').default('new').notNull(),
  source: text('source').default('territory_harvest').notNull(),
  assignedContractorId: text('assigned_contractor_id'),
  performanceScore: integer('performance_score').default(50),
  sslStatus: text('ssl_status').default('secured'),
  mobileFriendly: boolean('mobile_friendly').default(true),
  urgencyScore: doublePrecision('urgency_score').default(5.0),
  predictedLtv: integer('predicted_ltv').default(5000),
  seoScore: integer('seo_score').default(50),
  googleRating: doublePrecision('google_rating').default(0),
  sentimentScore: doublePrecision('sentiment_score').default(5.0),
  outreachStrategy: text('outreach_strategy'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const missions = pgTable('missions', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  city: text('city').notNull(),
  niche: text('niche').notNull(),
  steps: jsonb('steps').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const forecasts = pgTable('forecasts', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  metric: text('metric').notNull(), // lead_volume | cpl | conversions | revenue
  predicted: doublePrecision('predicted').notNull(),
  confidenceScore: doublePrecision('confidence_score').notNull(),
  targetDate: timestamp('target_date').notNull(),
  modelVersion: text('model_version').notNull(),
  evaluated: boolean('evaluated').default(false).notNull(),
  assumptions: text('assumptions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const recommendations = pgTable('recommendations', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  category: text('category').notNull(),
  action: text('action').notNull(),
  rationale: text('rationale').notNull(),
  confidence: doublePrecision('confidence').notNull(),
  evidence: text('evidence'),
  status: text('status').notNull(), // 'pending' | 'approved' | 'rejected' | 'executed' | 'evaluated'
  outcome: text('outcome'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const predictionOutcomes = pgTable('prediction_outcomes', {
  id: text('id').primaryKey(),
  forecastId: text('forecast_id').notNull(),
  predicted: doublePrecision('predicted').notNull(),
  actual: doublePrecision('actual').notNull(),
  deviation: doublePrecision('deviation').notNull(),
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
});

export const learningInsights = pgTable('learning_insights', {
  id: text('id').primaryKey(),
  metric: text('metric').notNull(),
  lesson: text('lesson').notNull(),
  confidenceShift: doublePrecision('confidence_shift').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  role: text('role').notNull(), // 'user' | 'model'
  text: text('text').notNull(),
  enableGrounding: boolean('enable_grounding').default(false).notNull(),
  sources: jsonb('sources'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const winLossRecords = pgTable('win_loss_records', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  leadId: text('lead_id'),
  businessName: text('business_name').notNull(),
  city: text('city').notNull(),
  niche: text('niche').notNull(),
  outcome: text('outcome').notNull(), // 'won' | 'lost'
  closedValueUsd: integer('closed_value_usd').default(0),
  primaryReason: text('primary_reason'),
  keyLesson: text('key_lesson'),
  outreachChannelUsed: text('outreach_channel_used'),
  closedAt: timestamp('closed_at').defaultNow().notNull(),
});

export const clientProjects = pgTable('client_projects', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  leadId: text('lead_id').notNull(),
  clientName: text('client_name').notNull(),
  businessName: text('business_name').notNull(),
  city: text('city').notNull(),
  serviceType: text('service_type').notNull(),
  packageTier: text('package_tier').notNull(),
  monthlyRetainerUsd: integer('monthly_retainer_usd').notNull(),
  startDate: timestamp('start_date').notNull(),
  status: text('status').notNull(),
  initialAuditScore: integer('initial_audit_score').default(0),
  currentScore: integer('current_score').default(0),
  targetScore: integer('target_score').default(0),
  milestones: jsonb('milestones').notNull(),
  assets: jsonb('assets').notNull(),
  notes: text('notes'),
  portalAccessToken: text('portal_access_token').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const outreachSequences = pgTable('outreach_sequences', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  name: text('name').notNull(),
  niche: text('niche'),
  steps: jsonb('steps').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  key: text('key').notNull(),
  label: text('label').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const schedulerJobs = pgTable('scheduler_jobs', {
  id: text('id').primaryKey(),
  job: text('job').notNull(),
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  error: text('error'),
  result: text('result'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leadEvents = pgTable('lead_events', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull(),
  externalEventId: text('external_event_id'),
  eventType: text('event_type').notNull(), // LeadCreated, Qualified, SalesAccepted, AppointmentBooked, OpportunityCreated, EstimateSent, ClosedWon, ClosedLost, RevenueUpdated, Reopened
  previousStage: text('previous_stage'),
  newStage: text('new_stage').notNull(),
  dealValue: doublePrecision('deal_value'),
  currency: text('currency').default('USD').notNull(),
  metadata: jsonb('metadata'),
  notes: text('notes'),
  createdBy: text('created_by').default('system'),
  occurredAt: timestamp('occurred_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const revenueRecords = pgTable('revenue_records', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  leadId: text('lead_id'),
  amountUsd: integer('amount_usd').notNull(),
  source: text('source').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const performanceSnapshots = pgTable('performance_snapshots', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull(),
  date: timestamp('date').notNull(),
  leads: integer('leads').default(0),
  spend: doublePrecision('spend').default(0),
  cpl: doublePrecision('cpl').default(0),
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  name: text('name').notNull(),
  status: text('status').default('draft').notNull(),
  leadsCount: integer('leads_count').default(0),
  budgetUsd: integer('budget_usd').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const neuralState = pgTable('neural_state', {
  id: text('id').primaryKey(), // Usually "singleton"
  version: text('version').notNull(),
  calibrationEpoch: integer('calibration_epoch').default(0).notNull(),
  totalOutcomesDigested: integer('total_outcomes_digested').default(0).notNull(),
  autonomyReadinessScore: integer('autonomy_readiness_score').default(0).notNull(),
  isOfflineModeActive: boolean('is_offline_mode_active').default(false).notNull(),
  technicalWeights: jsonb('technical_weights').notNull(),
  nicheMap: jsonb('niche_map').notNull(),
  objections: jsonb('objections').notNull(),
  activeNodes: jsonb('active_nodes').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leadAttribution = pgTable('lead_attribution', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull(),
  gclid: text('gclid'),
  gbraid: text('gbraid'),
  wbraid: text('wbraid'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
  landingPage: text('landing_page'),
  touchType: text('touch_type').default('first').notNull(), // 'first' | 'last'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const conversionOutbox = pgTable('conversion_outbox', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  leadId: text('lead_id').notNull(),
  leadEventId: text('lead_event_id').notNull(),
  conversionAction: text('conversion_action').notNull(), // e.g. 'Qualified Lead', 'Closed Won'
  gclid: text('gclid'),
  gbraid: text('gbraid'),
  wbraid: text('wbraid'),
  conversionTime: timestamp('conversion_time').notNull(),
  conversionValue: doublePrecision('conversion_value').notNull(),
  currency: text('currency').default('USD').notNull(),
  hashedEmail: text('hashed_email'),
  hashedPhone: text('hashed_phone'),
  status: text('status').default('pending').notNull(), // 'pending', 'processing', 'succeeded', 'retrying', 'failed', 'dead_letter'
  attempts: integer('attempts').default(0).notNull(),
  nextAttemptAt: timestamp('next_attempt_at'),
  lastAttemptAt: timestamp('last_attempt_at'),
  uploadedAt: timestamp('uploaded_at'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  googleResponse: jsonb('google_response'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const googleAdsDailyPerformance = pgTable('google_ads_daily_performance', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  campaignId: text('campaign_id').notNull(),
  campaignName: text('campaign_name').notNull(),
  adGroupId: text('ad_group_id'),
  adGroupName: text('ad_group_name'),
  keyword: text('keyword'),
  searchTerm: text('search_term'),
  geo: text('geo'),
  device: text('device').default('desktop').notNull(),
  date: timestamp('date').notNull(),
  impressions: integer('impressions').default(0).notNull(),
  clicks: integer('clicks').default(0).notNull(),
  cost: doublePrecision('cost').default(0).notNull(),
  conversions: doublePrecision('conversions').default(0).notNull(),
  conversionValue: doublePrecision('conversion_value').default(0).notNull(),
  landingPage: text('landing_page'),
  assetGroup: text('asset_group'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const revenueExperiments = pgTable('revenue_experiments', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  hypothesis: text('hypothesis').notNull(),
  variable: text('variable').notNull(),
  baseline: text('baseline').notNull(),
  expectedOutcome: text('expected_outcome').notNull(),
  actualOutcome: text('actual_outcome'),
  pipelineImpact: doublePrecision('pipeline_impact').default(0),
  revenueImpact: doublePrecision('revenue_impact').default(0),
  status: text('status').default('active').notNull(), // 'active', 'completed', 'paused'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  decision: text('decision'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const revenueRecommendations = pgTable('revenue_recommendations', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  category: text('category').notNull(), // 'campaign', 'geo', 'search_term', 'budget'
  title: text('title').notNull(),
  rationale: text('rationale').notNull(),
  citationData: jsonb('citation_data').notNull(),
  impactScore: doublePrecision('impact_score').default(0).notNull(),
  status: text('status').default('proposed').notNull(), // 'proposed', 'approved', 'executed', 'rejected', 'expired'
  confidenceScore: doublePrecision('confidence_score').default(85.0),
  expectedImpact: text('expected_impact').default('Positive economic lift'),
  proposedAt: timestamp('proposed_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  approvedBy: text('approved_by'),
  rejectedAt: timestamp('rejected_at'),
  rejectedBy: text('rejected_by'),
  executedAt: timestamp('executed_at'),
  executedBy: text('executed_by'),
  executionReference: text('execution_reference'),
  expiresAt: timestamp('expires_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const revenueSimulations = pgTable('revenue_simulations', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  scenarioType: text('scenario_type').notNull(), // 'budget_reallocation', 'geo_allocation', 'campaign_comparison', 'budget_shift'
  baselineData: jsonb('baseline_data').notNull(),
  scenarioParameters: jsonb('scenario_parameters').notNull(),
  projectedResult: jsonb('projected_result').notNull(),
  delta: jsonb('delta').notNull(),
  confidenceScore: doublePrecision('confidence_score').default(80.0).notNull(),
  assumptions: text('assumptions').notNull(),
  createdBy: text('created_by').default('Operator').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const revenueOutcomes = pgTable('revenue_outcomes', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  recommendationId: text('recommendation_id'),
  experimentId: text('experiment_id'),
  executionReference: text('execution_reference'),
  observationStart: timestamp('observation_start').notNull(),
  observationEnd: timestamp('observation_end').notNull(),
  baselineMetrics: jsonb('baseline_metrics').notNull(),
  expectedMetrics: jsonb('expected_metrics').notNull(),
  actualMetrics: jsonb('actual_metrics').notNull(),
  variance: jsonb('variance').notNull(),
  predictionAccuracy: doublePrecision('prediction_accuracy').notNull(),
  outcomeStatus: text('outcome_status').notNull(), // 'pending_observation', 'observing', 'measured', 'evaluated', 'insufficient_data'
  confidenceScore: doublePrecision('confidence_score').default(80.0).notNull(),
  assumptions: text('assumptions').notNull(),
  outcomeClassification: text('outcome_classification'), // 'successful', 'partially_successful', 'neutral', 'failed', 'insufficient_data'
  learningSignals: jsonb('learning_signals'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const revenueRecommendationEvents = pgTable('revenue_recommendation_events', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  recommendationId: text('recommendation_id').notNull(),
  previousStatus: text('previous_status'),
  newStatus: text('new_status').notNull(),
  actor: text('actor').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const halLoops = pgTable('hal_loops', {
  id: text('id').primaryKey(),
  contractorId: text('contractor_id').notNull(),
  status: text('status').notNull(), // 'initialized', 'gathering', 'analyzing', 'planning', 'simulating', 'awaiting_approval', 'approved', 'executing', 'verifying', 'learning', 'completed', 'failed', 'paused'
  currentStage: text('current_stage').notNull(),
  trigger: text('trigger').notNull(), // 'manual_init', 'scheduled', 'webhook_event', 'anomaly_detected'
  contextData: jsonb('context_data'),
  stateSnapshot: jsonb('state_snapshot'),
  recommendationId: text('recommendation_id'),
  simulationId: text('simulation_id'),
  criticFindings: jsonb('critic_findings'),
  executionReference: text('execution_reference'),
  verificationResult: jsonb('verification_result'),
  learningSignals: jsonb('learning_signals'),
  iterationCount: integer('iteration_count').default(1).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const halLoopEvents = pgTable('hal_loop_events', {
  id: text('id').primaryKey(),
  loopId: text('loop_id').notNull(),
  contractorId: text('contractor_id').notNull(),
  previousState: text('previous_state'),
  newState: text('new_state').notNull(),
  eventType: text('event_type').notNull(), // 'stage_transition', 'critic_evaluation', 'approval_granted', 'execution_dispatched', 'verification_completed'
  actor: text('actor').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});




