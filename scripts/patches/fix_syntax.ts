import fs from 'fs';

let content = fs.readFileSync('src/lib/autonomousLearning.ts', 'utf8');

const faultyBlock = `  } catch (e) {
        console.warn('[Autonomous Learning] Failed to persist state to storage:', e);
      }
    }
  }

  public getState(): LearningState {`;

const fixedBlock = `
  public getState(): LearningState {`;

content = content.replace(faultyBlock, fixedBlock);

fs.writeFileSync('src/lib/autonomousLearning.ts', content);
