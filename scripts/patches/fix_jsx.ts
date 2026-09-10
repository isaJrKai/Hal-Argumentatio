import fs from 'fs';

let content = fs.readFileSync('src/components/NeuralPanel.tsx', 'utf8');

content = content.replace(
  /<p>> Calibrating/g,
  '<p>{">"} Calibrating'
);
content = content.replace(
  /<p>> Backpropagating/g,
  '<p>{">"} Backpropagating'
);
content = content.replace(
  /<p>> Detected local/g,
  '<p>{">"} Detected local'
);
content = content.replace(
  /<p>> Re-evaluating/g,
  '<p>{">"} Re-evaluating'
);

fs.writeFileSync('src/components/NeuralPanel.tsx', content);
