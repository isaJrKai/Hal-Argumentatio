import fs from 'fs';
let content = fs.readFileSync('src/lib/autonomousLearning.ts', 'utf8');

content = content.replace(
  /import \{ pgDb \} from '\.\.\/db\/db';/,
  "import { getPgDb } from '../db/postgres';"
);

content = content.replace(
  /await pgDb\.select/g,
  "await getPgDb().select"
);

content = content.replace(
  /await pgDb\.insert/g,
  "await getPgDb().insert"
);

fs.writeFileSync('src/lib/autonomousLearning.ts', content);
