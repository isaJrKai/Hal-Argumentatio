import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const commandPalette = readFileSync('src/components/CommandPalette.tsx', 'utf8');
const assistant = readFileSync('src/components/HermesLabPanel.tsx', 'utf8');
const overview = readFileSync('src/components/OverviewPanel.tsx', 'utf8');
const graph = readFileSync('src/components/NeuralPanel.tsx', 'utf8');
const guide = readFileSync('src/components/HalBiblePanel.tsx', 'utf8');

describe('HAL product language and truthful controls', () => {
  it('uses plain labels in navigation and the command palette', () => {
    expect(commandPalette).toContain('Go to Overview');
    expect(commandPalette).toContain('Analysis tools');
    expect(commandPalette).not.toContain('Synaptic Tool:');
    expect(commandPalette).not.toContain('Neural Node:');
    expect(commandPalette).not.toContain('13,000+ Associative Mesh');
  });

  it('does not advertise graph pruning that cannot be persisted', () => {
    expect(graph).not.toContain('Manual Pruning');
    expect(graph).not.toContain('Confirm Prune');
    expect(graph).not.toContain('CLICK TO MANUAL PRUNE');
  });

  it('removes aspirational claims and fake actions from the product guide', () => {
    expect(guide).toContain('Contractor sales and operations workspace');
    expect(guide).not.toContain('AI Business Operating Intelligence System');
    expect(guide).not.toContain('executive partner. Not a tool. Not an assistant.');
    expect(guide).not.toContain('Harvesting Map grounding!');
    expect(guide).not.toContain('PROPOSE ENTERPRISE CONNECT');
    expect(guide).not.toContain('COMMENCE MANDATE');
    expect(guide).toContain('This is a sample dialog only. No outreach was scheduled.');
  });

  it('removes inflated assistant and dashboard labels', () => {
    expect(assistant).toContain('Business assistant & tools');
    expect(assistant).not.toContain('Hermes Cognitive Lab');
    expect(assistant).not.toContain('self-healing diagnostics');
    expect(overview).toContain('Welcome back,');
    expect(overview).not.toContain('Good morning,');
    expect(overview).not.toContain('MISSION CONTROL');
  });
});
