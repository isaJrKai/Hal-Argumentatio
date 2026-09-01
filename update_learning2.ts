import fs from 'fs';

let content = fs.readFileSync('src/lib/autonomousLearning.ts', 'utf8');

// The original signature in the current file:
// private loadState(): LearningState { ... }
// public saveState(): void { ... }

content = content.replace(
  /private loadState\(\): LearningState \{[\s\S]*?  public saveState\(\): void \{[\s\S]*?  \}/,
  `private loadState(): LearningState {
    return {
      version: '2.4-autonomous',
      calibrationEpoch: 14,
      lastUpdated: new Date().toISOString(),
      totalOutcomesDigested: 125,
      autonomyReadinessScore: 92,
      isOfflineModeActive: false,
      technicalWeights: {
        missingSslUrgency: 8.8,
        slowSpeedUrgency: 7.6,
        lowReviewCountWeight: 6.9,
        poorGoogleRatingWeight: 7.4,
        noWebsiteWeight: 9.2,
        phoneChannelMultiplier: 1.38,
        emailChannelMultiplier: 0.92,
        smsChannelMultiplier: 1.18
      },
      nicheMap: DEFAULT_NICHE_PROFILES,
      objections: DEFAULT_OBJECTION_RULES,
      recentLearningLogs: []
    };
  }

  public async initializeFromDb(): Promise<void> {
    try {
      const [record] = await getPgDb().select().from(neuralState).where(eq(neuralState.id, 'singleton'));
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
        await this.saveState();
      }
    } catch (e) {
      console.warn('[Autonomous Learning] DB Init failed, using memory fallback:', e);
    }
  }

  public async saveState(): Promise<void> {
    this.state.lastUpdated = new Date().toISOString();
    try {
      await getPgDb().insert(neuralState).values({
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
