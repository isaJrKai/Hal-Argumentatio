import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const queryBlockRegex = /lead\.id,\n\s+contractorId,\n\s+lead\.businessName,\n\s+lead\.city,\n\s+lead\.niche \|\| 'general',\n\s+lead\.ownerName \|\| null,\n\s+lead\.phone \|\| null,\n\s+lead\.email \|\| null,\n\s+lead\.websiteUrl \|\| null,\n\s+lead\.reviewCount \|\| 0,\n\s+lead\.googleRating \|\| 0,\n\s+lead\.predictedLtvUsd \? Math\.round\(lead\.predictedLtvUsd \* 0\.4\) : 1800,\n\s+lead\.status,\n\s+lead\.performanceScore \|\| 50,\n\s+lead\.sslStatus \|\| 'secured',\n\s+lead\.urgencyScore \|\| 5\.0,/;

const newQueryBlock = `lead.id,
          contractorId,
          lead.businessName,
          lead.city,
          (lead as any).niche || lead.serviceType || 'general',
          lead.ownerName || null,
          (lead as any).phone || null,
          (lead as any).email || null,
          (lead as any).websiteUrl || null,
          (lead as any).reviewCount || 0,
          (lead as any).googleRating || 0,
          lead.predictedLtvUsd ? Math.round(lead.predictedLtvUsd * 0.4) : 1800,
          lead.status,
          (lead as any).performanceScore || 50,
          (lead as any).sslStatus || 'secured',
          lead.urgencyScore || 5.0,`;

content = content.replace(queryBlockRegex, newQueryBlock);

fs.writeFileSync('server.ts', content);
