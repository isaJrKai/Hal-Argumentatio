import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const topBar = readFileSync('src/components/TopTelemetryBar.tsx', 'utf8');

describe('Top navigation product language and real actions', () => {
  it('uses plain navigation labels rather than invented command-centre language', () => {
    expect(topBar).toContain("label: 'Overview'");
    expect(topBar).toContain("label: 'Prospects'");
    expect(topBar).not.toContain('Mission Control');
    expect(topBar).not.toContain('Prospect Finder');
    expect(topBar).not.toContain('Map Intelligence');
    expect(topBar).not.toContain('HAL Copilot');
  });

  it('does not present placeholder actions as working controls', () => {
    expect(topBar).not.toContain('CONTEXTUAL ACTION RIBBON');
    expect(topBar).not.toContain('triggerRibbonAction');
    expect(topBar).not.toContain('Find New Prospects');
    expect(topBar).not.toContain('Recalculate Values');
    expect(topBar).not.toContain('AI Operating Assistant active');
  });
});
