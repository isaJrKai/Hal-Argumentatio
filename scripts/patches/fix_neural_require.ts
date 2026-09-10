import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const importStatement = "import { getDrizzleDb } from './src/db/postgres';";
if (!content.includes(importStatement)) {
    content = importStatement + '\n' + content;
}

content = content.replace(
  /const \{ getDrizzleDb \} = require\('\.\/src\/db\/postgres'\);\n    const \{ desc, eq \} = require\('drizzle-orm'\);/,
  ""
);

fs.writeFileSync('server.ts', content);
