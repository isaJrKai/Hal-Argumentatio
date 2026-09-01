import fs from 'fs';

let content = fs.readFileSync('src/components/NeuralPanel.tsx', 'utf8');

content = content.replace(
  /const data = await res\.json\(\);/g,
  "const data = await res.json();\n      if (data.error) throw new Error(data.error);"
);

content = content.replace(
  /initSimulation\(data\.nodes, data\.links\);/g,
  "if (data.nodes && data.links) {\n        initSimulation(data.nodes, data.links);\n      }"
);

content = content.replace(
  /const nodeCount = networkData\.nodes\.filter/g,
  "const nodeCount = (networkData.nodes || []).filter"
);

content = content.replace(
  /networkData\.nodes\.length/g,
  "(networkData.nodes || []).length"
);

content = content.replace(
  /networkData\.nodes\.filter\(n => n\.type === 'insight' || n\.type === 'decaying'\)/g,
  "(networkData.nodes || []).filter(n => n.type === 'insight' || n.type === 'decaying')"
);

fs.writeFileSync('src/components/NeuralPanel.tsx', content);
