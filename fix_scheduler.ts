import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /app\.get\('\/api\/scheduler\/jobs', authenticate, \(req, res\) => \{\n\s+res\.json\(db\.getSchedulerJobs\(\)\);\n\}\);/,
  `app.get('/api/scheduler/jobs', authenticate, async (req, res) => {
  try {
    const jobs = await pgDb.select().from(schedulerJobs).orderBy(desc(schedulerJobs.createdAt));
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`
);

fs.writeFileSync('server.ts', content);
