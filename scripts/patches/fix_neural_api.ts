import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /const insights = await db\.pgDb\.select\(\)\.from\(db\.schema\.learningInsights\)\.orderBy\(db\.desc\(db\.schema\.learningInsights\.createdAt\)\)\.limit\(50\);/,
  "const { getDrizzleDb } = require('./src/db/postgres');\n    const { desc, eq } = require('drizzle-orm');\n    const dbInstance = getDrizzleDb();\n    if (!dbInstance) throw new Error('Database not initialized');\n    const insights = await dbInstance.select().from(learningInsights).orderBy(desc(learningInsights.createdAt)).limit(50);"
);

content = content.replace(
  /const winLoss = await db\.pgDb\.select\(\)\.from\(db\.schema\.winLossRecords\)\.where\(db\.eq\(db\.schema\.winLossRecords\.contractorId, contractorId\)\)\.limit\(30\);/,
  "const winLoss = await dbInstance.select().from(winLossRecords).where(eq(winLossRecords.contractorId, contractorId)).limit(30);"
);

fs.writeFileSync('server.ts', content);
