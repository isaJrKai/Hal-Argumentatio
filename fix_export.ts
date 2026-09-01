import fs from 'fs';
let content = fs.readFileSync('src/components/NeuralPanel.tsx', 'utf8');
content = content.replace(/export function NeuralPanel\(\) \{/, 'export default function NeuralPanel() {');
fs.writeFileSync('src/components/NeuralPanel.tsx', content);
