import fs from 'fs';
let content = fs.readFileSync('src/lib/autonomousLearning.ts', 'utf8');

content = content.replace(
  /import \{ getPgDb \} from '\.\.\/db\/postgres';/,
  "import { getDrizzleDb } from '../db/postgres';"
);

content = content.replace(
  /getPgDb\(\)/g,
  "getDrizzleDb()"
);

fs.writeFileSync('src/lib/autonomousLearning.ts', content);
