import fs from 'fs';

let content = fs.readFileSync('src/lib/autonomousLearning.ts', 'utf8');

// We need to inject pgDb import and change saveState / loadState
content = `import { pgDb } from '../db/db';
import { neuralState } from '../db/schema';
import { eq } from 'drizzle-orm';
` + content;

content = content.replace(
  /private loadState\(\): LearningState \{[\s\S]*?totalOutcomesDigested: 125,/,
  `private loadState(): LearningState {
    return {
      version: '2.4-autonomous',
      calibrationEpoch: 14,
      lastUpdated: new Date().toISOString(),
      totalOutcomesDigested: 125,`
);

content = content.replace(
  /  private saveState\(\): void \{\n\s+this\.state\.lastUpdated = new Date\(\)\.toISOString\(\);\n\s+if \(typeof localStorage !== 'undefined'\) \{\n\s+localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(this\.state\)\);\n\s+\}\n\s+\}/,
  `  public async initializeFromDb(): Promise<void> {
    try {
      const [record] = await pgDb.select().from(neuralState).where(eq(neuralState.id, 'singleton'));
      if (record) {
        this.state = {
          version: record.version,
          calibrationEpoch: record.calibrationEpoch,
          lastUpdated: record.updatedAt.toISOString(),
          totalOutcomesDigested: record.totalOutcomesDigested,
          autonomyReadinessScore: record.autonomyReadinessScore,
          isOfflineModeActive: record.isOfflineModeActive,
          technicalWeights: record.technicalWeights as TechnicalWeights,
          nicheMap: record.nicheMap as Record<string, NicheCalibration>,
          objections: record.objections as ObjectionRule[],
          recentLearningLogs: this.state.recentLearningLogs || []
        };
      } else {
        // Seed default DB state
        await this.saveState();
      }
    } catch (e) {
      console.warn('[Autonomous Learning] DB Init failed, using memory fallback:', e);
    }
  }

  private async saveState(): Promise<void> {
    this.state.lastUpdated = new Date().toISOString();
    try {
      await pgDb.insert(neuralState).values({
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
  }`
);

fs.writeFileSync('src/lib/autonomousLearning.ts', content);
