import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /totalLeadsManaged: leads\.length,\n\s+verifiedPhoneRatio: leads\.length > 0 \? Math\.round\(\(leads\.filter\(l => !!l\.phone\)\.length \/ leads\.length\) \* 100\) : 100,/,
  `totalLeadsManaged: allLeads.length,
        verifiedPhoneRatio: allLeads.length > 0 ? Math.round((allLeads.filter(l => !!l.phone).length / allLeads.length) * 100) : 100,`
);

fs.writeFileSync('server.ts', content);
