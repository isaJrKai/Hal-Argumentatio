import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const leadsQuery = `const winLoss = await dbInstance.select().from(winLossRecords).where(eq(winLossRecords.contractorId, contractorId)).limit(30);
    const recentLeads = await dbInstance.select().from(leads).where(eq(leads.contractorId, contractorId)).limit(300);`;

content = content.replace(
  /const winLoss = await dbInstance\.select\(\)\.from\(winLossRecords\)\.where\(eq\(winLossRecords\.contractorId, contractorId\)\)\.limit\(30\);/,
  leadsQuery
);

const leadsMapping = `
    // 5. Raw Leads (The "cells")
    recentLeads.forEach(lead => {
       const nodeId = 'lead_' + lead.id;
       nodes.push({
         id: nodeId,
         label: lead.businessName || 'Target',
         detail: lead.niche + ' in ' + lead.city,
         type: 'lead',
         group: 7,
         size: 3,
         status: lead.status,
         createdAt: lead.createdAt
       });
       
       if (lead.niche) {
         const nicheId = 'niche_' + lead.niche.toLowerCase();
         if (nodes.find(n => n.id === nicheId)) {
           links.push({ source: nodeId, target: nicheId, value: 0.5 });
         } else {
           links.push({ source: nodeId, target: 'core_objection', value: 0.5 });
         }
       }
    });

    res.json({ nodes, links, telemetry: autoState });`;

content = content.replace(
  /res\.json\(\{ nodes, links, telemetry: autoState \}\);/,
  leadsMapping
);

fs.writeFileSync('server.ts', content);
