import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /app\.get\('\/api\/ai\/agent-reach\/pulse', authenticate, \(req, res\) => \{\n\s+const contractorId = \(req as any\)\.contractorId;\n\s+const \{ city, niche \} = req\.query as \{ city: string; niche: string \};/,
  `app.get('/api/ai/agent-reach/pulse', authenticate, async (req, res) => {
  const contractorId = (req as any).contractorId;
  const { city, niche } = req.query as { city: string; niche: string };`
);

content = content.replace(
  /const leads = db\.getLeads\(contractorId\);\n\s+const matchingLeads = leads\.filter\(l => l\.city\.toLowerCase\(\)\.includes\(targetCity\.toLowerCase\(\)\) \|\| l\.serviceType\.toLowerCase\(\)\.includes\(targetNiche\.toLowerCase\(\)\)\);\n\s+db\.addAuditLog\(\{/,
  `const allLeads = await pgDb.select().from(leads).where(eq(leads.contractorId, contractorId));
  const matchingLeads = allLeads.filter(l => l.city.toLowerCase().includes(targetCity.toLowerCase()) || l.niche.toLowerCase().includes(targetNiche.toLowerCase()));

  await pgDb.insert(auditLogs).values({
    id: crypto.randomUUID(),`
);

fs.writeFileSync('server.ts', content);
