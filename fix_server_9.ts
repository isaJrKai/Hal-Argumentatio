import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /app\.get\('\/api\/portal\/project\/:token', \(req, res\) => \{\n\s+const \{ token \} = req\.params;\n\s+const project = db\.getProjectByPortalToken\(token\);/,
  `app.get('/api/portal/project/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const [project] = await pgDb.select().from(clientProjects).where(eq(clientProjects.portalAccessToken, token));`
);
content = content.replace(
  /status: project\.status,\n\s+currentScore: project\.currentScore,\n\s+targetScore: project\.targetScore,\n\s+milestones: project\.milestones,\n\s+assets: project\.assets,\n\s+updatedAt: project\.updatedAt\n\s+\}\);\n\}\);/,
  `status: project.status,
    currentScore: project.currentScore,
    targetScore: project.targetScore,
    milestones: project.milestones,
    assets: project.assets,
    updatedAt: project.updatedAt
  });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`
);

content = content.replace(
  /app\.get\('\/api\/financials\/overview', authenticate, \(req, res\) => \{\n\s+const contractorId = \(req as any\)\.contractorId;\n\s+const projects = db\.getClientProjects\(contractorId\);\n\s+const leads = db\.getLeads\(contractorId\);\n\s+const campaigns = db\.getCampaigns\(contractorId\);/,
  `app.get('/api/financials/overview', authenticate, async (req, res) => {
  const contractorId = (req as any).contractorId;
  try {
    const projects = await pgDb.select().from(clientProjects).where(eq(clientProjects.contractorId, contractorId));
    const allLeads = await pgDb.select().from(leads).where(eq(leads.contractorId, contractorId));
    const allCampaigns = await pgDb.select().from(campaigns).where(eq(campaigns.contractorId, contractorId));`
);

content = content.replace(
  /const activeProjects = projects\.filter\(p => p\.status !== 'completed'\);\n\s+const currentMrrUsd = activeProjects\.reduce\(\(sum, p\) => sum \+ \(p\.monthlyRetainerUsd \|\| 0\), 0\);\n\s+const arrUsd = currentMrrUsd \* 12;\n\s+const activeClientCount = activeProjects\.length;\n\s+const totalCampaignSpend = campaigns\.reduce\(\(sum, c\) => sum \+ \(c\.spent \|\| 0\), 0\);\n\s+const convertedCount = Math\.max\(1, leads\.filter\(l => l\.status === 'converted'\)\.length\);/,
  `const activeProjects = projects.filter(p => p.status !== 'completed');
    const currentMrrUsd = activeProjects.reduce((sum, p) => sum + (p.monthlyRetainerUsd || 0), 0);
    const arrUsd = currentMrrUsd * 12;
    const activeClientCount = activeProjects.length;
    const totalCampaignSpend = allCampaigns.reduce((sum, c) => sum + (c.budgetUsd || 0), 0);
    const convertedCount = Math.max(1, allLeads.filter(l => l.status === 'converted').length);`
);

content = content.replace(
  /res\.json\(\{\n\s+mrrUsd: currentMrrUsd,\n\s+arrUsd: arrUsd,\n\s+activeClients: activeClientCount,\n\s+blendedCacUsd: blendedCacUsd,\n\s+averageLtvUsd: averageLtvUsd,\n\s+ltvToCacRatio: ltvToCacRatio\n\s+\}\);\n\}\);/,
  `res.json({
      mrrUsd: currentMrrUsd,
      arrUsd: arrUsd,
      activeClients: activeClientCount,
      blendedCacUsd: blendedCacUsd,
      averageLtvUsd: averageLtvUsd,
      ltvToCacRatio: ltvToCacRatio
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`
);

fs.writeFileSync('server.ts', content);
