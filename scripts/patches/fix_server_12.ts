import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /app\.get\('\/api\/system\/audit-logs', authenticate, \(req, res\) => \{\n\s+const contractorId = \(req as any\)\.contractorId;\n\s+const role = \(req as any\)\.role;\n\n\s+\/\/ Admin sees all audit logs; standard user sees their own\.\n\s+const logs = role === 'admin' \? db\.getAuditLogs\(\) : db\.getAuditLogs\(contractorId\);\n\s+res\.json\(logs\);\n\}\);/,
  `app.get('/api/system/audit-logs', authenticate, async (req, res) => {
  const contractorId = (req as any).contractorId;
  const role = (req as any).role;
  try {
    const logs = role === 'admin' 
      ? await pgDb.select().from(auditLogs).orderBy(desc(auditLogs.timestamp))
      : await pgDb.select().from(auditLogs).where(eq(auditLogs.contractorId, contractorId)).orderBy(desc(auditLogs.timestamp));
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`
);

content = content.replace(
  /app\.post\('\/api\/system\/audit-logs', authenticate, \(req, res\) => \{\n\s+const contractorId = \(req as any\)\.contractorId;\n\s+const \{ action, details \} = req\.body;\n\n\s+if \(!action\) \{\n\s+return res\.status\(400\)\.json\(\{ error: 'Action is required' \}\);\n\s+\}\n\n\s+const log = db\.addAuditLog\(\{\n\s+contractorId,\n\s+action,\n\s+details: details \|\| '',\n\s+ipAddress: req\.ip \|\| req\.socket\.remoteAddress \|\| undefined\n\s+\}\);\n\n\s+res\.status\(201\)\.json\(log\);\n\}\);/,
  `app.post('/api/system/audit-logs', authenticate, async (req, res) => {
  const contractorId = (req as any).contractorId;
  const { action, details } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }
  
  try {
    const [log] = await pgDb.insert(auditLogs).values({
      id: crypto.randomUUID(),
      contractorId,
      action,
      details: details || '',
      ipAddress: req.ip || req.socket.remoteAddress || null
    }).returning();
    res.status(201).json(log);
  } catch(err: any) {
    res.status(500).json({ error: err.message });
  }
});`
);

fs.writeFileSync('server.ts', content);
