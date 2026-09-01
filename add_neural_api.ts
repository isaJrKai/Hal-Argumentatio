import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const apiEndpoint = `
// ─── NEURAL NETWORK TOPOLOGY API ──────────────────────────────────────────────
app.get('/api/neural/network', authenticate, async (req, res) => {
  try {
    const contractorId = (req as any).contractorId;
    
    // Fetch live data from PostgreSQL DB
    const insights = await db.pgDb.select().from(db.schema.learningInsights).orderBy(db.desc(db.schema.learningInsights.createdAt)).limit(50);
    const winLoss = await db.pgDb.select().from(db.schema.winLossRecords).where(db.eq(db.schema.winLossRecords.contractorId, contractorId)).limit(30);
    
    // Get autonomous state memory
    const autoState = autonomousLearning.getState();

    const nodes: any[] = [];
    const links: any[] = [];

    // 1. Core Subsystems
    const cores = [
      { id: 'core_bayes', label: 'Bayesian Base', type: 'core', group: 1, size: 25 },
      { id: 'core_objection', label: 'Objection Graph', type: 'core', group: 2, size: 20 },
      { id: 'core_niche', label: 'Niche Calibration', type: 'core', group: 3, size: 20 },
      { id: 'core_timesfm', label: 'TimesFM Prediction', type: 'core', group: 4, size: 22 }
    ];
    nodes.push(...cores);

    // Link cores together
    links.push({ source: 'core_bayes', target: 'core_objection', value: 5 });
    links.push({ source: 'core_bayes', target: 'core_niche', value: 8 });
    links.push({ source: 'core_bayes', target: 'core_timesfm', value: 4 });

    // 2. Niche Nodes from Autonomous Learning state
    if (autoState.nicheMap) {
      Object.keys(autoState.nicheMap).forEach(nicheKey => {
        const niche = autoState.nicheMap[nicheKey];
        const nodeId = 'niche_' + nicheKey;
        nodes.push({
          id: nodeId,
          label: nicheKey.toUpperCase(),
          type: 'niche',
          group: 3,
          size: 10 + (niche.confidenceScore * 10),
          confidence: niche.confidenceScore
        });
        links.push({ source: 'core_niche', target: nodeId, value: niche.confidenceScore * 10 });
      });
    }

    // 3. Learning Insights (The "Lessons Learnt")
    // "one lesson learnt equals one node to another"
    insights.forEach((insight, idx) => {
      const nodeId = 'insight_' + insight.id;
      // High confidence = strong node, low confidence = weak/broken node
      const isWeak = insight.confidenceShift < 0.05 && Math.random() > 0.5; 
      
      nodes.push({
        id: nodeId,
        label: insight.metric || 'Insight',
        detail: insight.lesson,
        type: isWeak ? 'decaying' : 'insight',
        group: 5,
        size: isWeak ? 4 : 8 + (insight.confidenceShift * 50)
      });
      
      // Connect to a core or niche
      // Try to map metric to a niche, else connect to core bayes
      const targetCore = insight.metric.toLowerCase().includes('cpl') ? 'core_timesfm' : 'core_bayes';
      
      // Broken node means the link is weak or non-existent
      if (!isWeak) {
        links.push({ source: nodeId, target: targetCore, value: 2 + insight.confidenceShift * 20 });
        
        // Also connect to a random niche to simulate cross-wiring if high confidence
        if (insight.confidenceShift > 0.1 && autoState.nicheMap) {
           const niches = Object.keys(autoState.nicheMap);
           if (niches.length > 0) {
             const randNiche = niches[Math.floor(Math.random() * niches.length)];
             links.push({ source: nodeId, target: 'niche_' + randNiche, value: 1 });
           }
        }
      }
    });

    // 4. Win/Loss Events (Recent real-world outcomes)
    winLoss.forEach(record => {
       const nodeId = 'outcome_' + record.id;
       nodes.push({
         id: nodeId,
         label: record.outcome === 'won' ? 'WIN' : 'LOSS',
         detail: record.businessName,
         type: record.outcome === 'won' ? 'win' : 'loss',
         group: 6,
         size: 6
       });
       
       // Connect outcome to its niche
       if (record.niche) {
         const nicheId = 'niche_' + record.niche.toLowerCase();
         // If niche node exists
         if (nodes.find(n => n.id === nicheId)) {
            links.push({ source: nodeId, target: nicheId, value: record.outcome === 'won' ? 5 : 1 });
         } else {
            links.push({ source: nodeId, target: 'core_bayes', value: 2 });
         }
       }
    });

    res.json({ nodes, links, telemetry: autoState });
  } catch (err: any) {
    console.error('Failed to fetch neural network:', err);
    res.status(500).json({ error: err.message });
  }
});
`;

content = content.replace(
  /\/\/ ─── AI ENGINE DUAL-DRIVE & AUTONOMOUS ENGINE STATUS ─────────────────────────/,
  apiEndpoint + '\n// ─── AI ENGINE DUAL-DRIVE & AUTONOMOUS ENGINE STATUS ─────────────────────────'
);

fs.writeFileSync('server.ts', content);
