import fs from 'fs';
let content = fs.readFileSync('src/lib/autonomousLearning.ts', 'utf8');
content = content.replace(
  /    \} catch\(e\) \{\n      console\.warn\('Failed to persist neural state to DB:', e\);\n    \}\n\n  public getState/,
  `    } catch(e) {
      console.warn('Failed to persist neural state to DB:', e);
    }
  }

  public getState`
);
fs.writeFileSync('src/lib/autonomousLearning.ts', content);
