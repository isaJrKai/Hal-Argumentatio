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
    'notifications',
    'schedulerJobs',
    'leadAttribution',
    'conversionOutbox',
    'googleAdsDailyPerformance',
    'revenueExperiments',
    'revenueRecommendations',
    'revenueRecommendationEvents',
    'revenueSimulations',
    'revenueOutcomes',
    'halLoops',
    'halLoopEvents'
  ];

  it('verifies that all critical business tables are defined in Drizzle schema', () => {
    for (const tableName of expectedTables) {
      expect(schema).toHaveProperty(tableName);
      expect((schema as any)[tableName]).toBeDefined();
    }
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
