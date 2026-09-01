import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /app\.get\('\/api\/ai\/engine-status', authenticate, async \(req, res\) => \{\n\s+const contractorId = \(req as any\)\.contractorId;\n\s+const geminiKeySet = !!process\.env\.GEMINI_API_KEY;\n\s+const nvidiaKeySet = !!process\.env\.NVIDIA_API_KEY;\n\s+const activeAiPreference = process\.env\.HAL_ACTIVE_AI \|\| \(geminiKeySet && nvidiaKeySet \? 'dual' : 'gemini'\);\n\s+const learningState = autonomousLearning\.getState\(\);\n\s+const leads = db\.getLeads\(contractorId\);/,
  `app.get('/api/ai/engine-status', authenticate, async (req, res) => {
  const contractorId = (req as any).contractorId;
  const geminiKeySet = !!process.env.GEMINI_API_KEY;
  const nvidiaKeySet = !!process.env.NVIDIA_API_KEY;
  const activeAiPreference = process.env.HAL_ACTIVE_AI || (geminiKeySet && nvidiaKeySet ? 'dual' : 'gemini');
  const learningState = autonomousLearning.getState();
  const allLeads = await pgDb.select().from(leads).where(eq(leads.contractorId, contractorId));`
);

content = content.replace(
  /metrics: \{\n\s+leadsInPipeline: leads\.length,\n\s+liveMissionsCount: learningState\.observationsCount,\n\s+confidenceGlobal: Math\.round\(learningState\.globalConfidenceBase \* 100\),\n\s+lessonsLearned: learningState\.lessonsCount\n\s+\}\n\s+\}\);\n\}\);/,
  `metrics: {
        leadsInPipeline: allLeads.length,
        liveMissionsCount: learningState.observationsCount,
        confidenceGlobal: Math.round(learningState.globalConfidenceBase * 100),
        lessonsLearned: learningState.lessonsCount
      }
  });
});`
);

fs.writeFileSync('server.ts', content);
