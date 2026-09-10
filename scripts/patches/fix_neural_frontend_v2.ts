import fs from 'fs';

let content = fs.readFileSync('src/components/NeuralPanel.tsx', 'utf8');

content = content.replace(/\(networkData\.nodes \|\| \[\]\)\.filter\(n => n\.type === 'insight' \|\| n\.type === 'decaying'\)/g, "networkData.nodes.filter(n => n.type === 'insight' || n.type === 'decaying')");

fs.writeFileSync('src/components/NeuralPanel.tsx', content);
