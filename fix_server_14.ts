import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /    mrrHistory,\n\s+tierDistribution\n\s+\}\);\n\}\);/,
  `    mrrHistory,
    tierDistribution
  });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`
);

fs.writeFileSync('server.ts', content);
