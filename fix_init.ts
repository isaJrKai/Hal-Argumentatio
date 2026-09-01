import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  /app\.listen\(PORT, '0\.0\.0\.0', \(\) => \{/,
  `
  // Initialize HAL Neural State from Persistent Data Center
  try {
    await autonomousLearning.initializeFromDb();
    console.log('[HAL Neural Engine] Bayes Memory core loaded from persistent storage.');
  } catch(e) {
    console.warn('Could not initialize Neural Engine from DB', e);
  }
  
  app.listen(PORT, '0.0.0.0', () => {`
);
fs.writeFileSync('server.ts', content);
