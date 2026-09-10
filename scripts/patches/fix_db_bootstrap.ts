import fs from 'fs';

let content = fs.readFileSync('src/db/postgres.ts', 'utf8');
content = content.replace(
  /urgency_score DOUBLE PRECISION DEFAULT 5\.0,\n        predicted_ltv INTEGER DEFAULT 5000,\n        notes TEXT,/,
  `urgency_score DOUBLE PRECISION DEFAULT 5.0,
        predicted_ltv INTEGER DEFAULT 5000,
        seo_score INTEGER DEFAULT 50,
        google_rating DOUBLE PRECISION DEFAULT 0,
        sentiment_score DOUBLE PRECISION DEFAULT 5.0,
        outreach_strategy TEXT,
        notes TEXT,`
);
fs.writeFileSync('src/db/postgres.ts', content);
