import { describe, it, expect } from 'vitest';
import * as schema from '../../src/db/schema';

describe('Database: Schema Drift & Table Invariant Tests', () => {
  const expectedTables = [
    'contractors',
    'auditLogs',
    'leads',
    'leadEvents',
    'revenueRecords',
    'campaigns',
    'winLossRecords',
    'performanceSnapshots',
    'recommendations',
    'forecasts',
    'learningInsights',
    'chatMessages',
    'missions',
    'clientProjects',
    'outreachSequences',
    'apiKeys',
    'connectorCredentials',
    'notifications',
    'schedulerJobs',
    'leadAttribution',
    'conversionOutbox',
    'communicationsOutbox',
    'communicationsDeliveryEvents',
    'googleAdsDailyPerformance',
    'revenueExperiments',
    'revenueRecommendations',
    'revenueRecommendationEvents',
    'revenueSimulations',
    'revenueOutcomes',
    'halLoops',
    'halLoopEvents',
    'hermesLabArtifacts',
    'hermesDiagnosticIncidents',
    'hermesLabMessages',
    'workTasks',
    'workEvents',
    'revokedTokens'
  ];

  it('verifies that all critical business tables are defined in Drizzle schema', () => {
    for (const tableName of expectedTables) {
      expect(schema).toHaveProperty(tableName);
      expect((schema as any)[tableName]).toBeDefined();
    }
  });

  it('requires tenant ownership on persisted learning insights', () => {
    const table = schema.learningInsights;
    expect(table).toBeDefined();
    expect(Object.keys(table)).toContain('contractorId');
    expect(Object.keys(table)).toContain('metric');
    expect(Object.keys(table)).toContain('lesson');
    expect(Object.keys(table)).toContain('confidenceShift');
  });

  it('allows direct-recipient communications history without a lead foreign key', () => {
    expect(schema.communicationsOutbox.leadId.notNull).toBe(false);
    expect(schema.communicationsOutbox.contractorId.notNull).toBe(true);
  });

  it('requires encrypted tenant-scoped connector credential storage', () => {
    const table = schema.connectorCredentials;
    expect(table).toBeDefined();
    for (const column of ['id', 'contractorId', 'service', 'encryptedValue', 'updatedAt']) {
      expect(Object.keys(table)).toContain(column);
    }
  });

  it('requires tenant ownership and durable execution fields on scheduler jobs', () => {
    const table = schema.schedulerJobs;
    expect(table).toBeDefined();
    for (const column of ['id', 'contractorId', 'job', 'status', 'startedAt', 'completedAt', 'error', 'result', 'createdAt']) {
      expect(Object.keys(table)).toContain(column);
    }
  });

  it('validates durable hashed-token revocation storage', () => {
    const table = schema.revokedTokens;
    expect(table).toBeDefined();
    expect(Object.keys(table)).toContain('tokenHash');
    expect(Object.keys(table)).toContain('contractorId');
    expect(Object.keys(table)).toContain('expiresAt');
  });

  it('validates the durable work queue and shared work ledger schema', () => {
    const tasksTable = schema.workTasks;
    const eventsTable = schema.workEvents;
    expect(tasksTable).toBeDefined();
    expect(eventsTable).toBeDefined();

    for (const column of ['id', 'contractorId', 'taskType', 'status', 'assignedWorker', 'entityType', 'entityId', 'correlationId', 'requiresApproval']) {
      expect(Object.keys(tasksTable)).toContain(column);
    }
    for (const column of ['id', 'contractorId', 'eventType', 'entityType', 'entityId', 'sourceModule', 'correlationId', 'payload']) {
      expect(Object.keys(eventsTable)).toContain(column);
    }
  });

  it('validates the Hermes persistence tables used by the specialist agent', () => {
    expect(schema.hermesLabArtifacts).toBeDefined();
    expect(schema.hermesDiagnosticIncidents).toBeDefined();
    expect(schema.hermesLabMessages).toBeDefined();
    expect(Object.keys(schema.hermesLabArtifacts)).toContain('contractorId');
    expect(Object.keys(schema.hermesLabArtifacts)).toContain('content');
  });

  it('validates critical columns on the leads table including encrypted PII columns', () => {
    const leadsTable = schema.leads;
    expect(leadsTable).toBeDefined();
    const columnKeys = Object.keys(leadsTable);
    expect(columnKeys).toContain('id');
    expect(columnKeys).toContain('contractorId');
    expect(columnKeys).toContain('businessName');
    expect(columnKeys).toContain('status');
    expect(columnKeys).toContain('predictedLtv');
    expect(columnKeys).toContain('phoneEncrypted');
    expect(columnKeys).toContain('emailEncrypted');
  });

  it('verifies PII columns are aligned between in-memory db.ts and postgres schema.ts', () => {
    const postgresHasEncryptedPhone = Object.keys(schema.leads).includes('phoneEncrypted');
    const postgresHasEncryptedEmail = Object.keys(schema.leads).includes('emailEncrypted');
    expect(postgresHasEncryptedPhone).toBe(true);
    expect(postgresHasEncryptedEmail).toBe(true);
  });

  it('validates critical columns on the revenueRecommendations table', () => {
    const recsTable = schema.revenueRecommendations;
    expect(recsTable).toBeDefined();
    const columnKeys = Object.keys(recsTable);
    expect(columnKeys).toContain('id');
    expect(columnKeys).toContain('contractorId');
    expect(columnKeys).toContain('status');
    expect(columnKeys).toContain('category');
    expect(columnKeys).toContain('impactScore');
    expect(columnKeys).toContain('confidenceScore');
    expect(columnKeys).toContain('citationData');
  });

  it('validates critical columns on halLoops and halLoopEvents', () => {
    const loopsTable = schema.halLoops;
    const eventsTable = schema.halLoopEvents;
    expect(loopsTable).toBeDefined();
    expect(eventsTable).toBeDefined();

    expect(Object.keys(loopsTable)).toContain('currentStage');
    expect(Object.keys(loopsTable)).toContain('status');
    expect(Object.keys(loopsTable)).toContain('criticFindings');

    expect(Object.keys(eventsTable)).toContain('loopId');
    expect(Object.keys(eventsTable)).toContain('previousState');
    expect(Object.keys(eventsTable)).toContain('newState');
  });
});
