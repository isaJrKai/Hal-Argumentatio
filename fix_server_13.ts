import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const projectRegex = /app\.get\('\/api\/portal\/project\/:token', async \(req, res\) => \{\n\s+const \{ token \} = req\.params;\n\s+try \{\n\s+const \[project\] = await pgDb\.select\(\)\.from\(clientProjects\)\.where\(eq\(clientProjects\.portalAccessToken, token\)\);\n\s+if \(!project\) \{\n\s+return res\.status\(404\)\.json\(\{ error: 'Client portal session not found or invalid token' \}\);\n\s+\}\n\s+res\.json\(\{\n\s+businessName: project\.businessName,\n\s+clientName: project\.clientName,\n\s+city: project\.city,\n\s+serviceType: project\.serviceType,\n\s+packageTier: project\.packageTier,\n\s+startDate: project\.startDate,\n\s+status: project\.status,\n\s+initialAuditScore: project\.initialAuditScore,\n\s+currentScore: project\.currentScore,\n\s+targetScore: project\.targetScore,\n\s+milestones: project\.milestones,\n\s+assets: project\.assets,\n\s+updatedAt: project\.updatedAt\n\s+\}\);\n\}\);/;

const projectReplacement = `app.get('/api/portal/project/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const [project] = await pgDb.select().from(clientProjects).where(eq(clientProjects.portalAccessToken, token));
    if (!project) {
      return res.status(404).json({ error: 'Client portal session not found or invalid token' });
    }
    res.json({
      businessName: project.businessName,
      clientName: project.clientName,
      city: project.city,
      serviceType: project.serviceType,
      packageTier: project.packageTier,
      startDate: project.startDate,
      status: project.status,
      initialAuditScore: project.initialAuditScore,
      currentScore: project.currentScore,
      targetScore: project.targetScore,
      milestones: project.milestones,
      assets: project.assets,
      updatedAt: project.updatedAt
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`;

content = content.replace(projectRegex, projectReplacement);


const overviewRegex = /    tierDistribution\n\s+\}\);\n\}\);/g;
// Replace only the first occurrence after line 2100? Let's just fix it manually.
const overviewMatch = `    tierDistribution\n  });\n});\n\n// ─── AI ENGINE DUAL-DRIVE & AUTONOMOUS ENGINE STATUS`;
const overviewRepl = `    tierDistribution\n  });\n  } catch (err: any) {\n    res.status(500).json({ error: err.message });\n  }\n});\n\n// ─── AI ENGINE DUAL-DRIVE & AUTONOMOUS ENGINE STATUS`;

content = content.replace(overviewMatch, overviewRepl);

fs.writeFileSync('server.ts', content);
