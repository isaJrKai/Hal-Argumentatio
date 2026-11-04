import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const commandPalette = readFileSync('src/components/CommandPalette.tsx', 'utf8');
const assistant = readFileSync('src/components/HermesLabPanel.tsx', 'utf8');
const overview = readFileSync('src/components/OverviewPanel.tsx', 'utf8');
const graph = readFileSync('src/components/NeuralPanel.tsx', 'utf8');
const guide = readFileSync('src/components/HalOperatingManualPanel.tsx', 'utf8');
const drive = readFileSync('src/components/GoogleDrivePanel.tsx', 'utf8');
const intelligence = readFileSync('src/components/IntelligencePanel.tsx', 'utf8');
const settings = readFileSync('src/components/SettingsPanel.tsx', 'utf8');
const architecture = readFileSync('src/components/BlueprintViewerPanel.tsx', 'utf8');
const phase4 = readFileSync('src/components/HalRoadmapPhase4View.tsx', 'utf8');
const phase5 = readFileSync('src/components/HalRoadmapPhase5View.tsx', 'utf8');

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

  it('replaces the Claude prompt dossier with a product architecture overview', () => {
    expect(architecture).toContain('Product architecture');
    expect(architecture).not.toContain('Claude');
    expect(architecture).not.toContain('Ready-To-Paste');
    expect(architecture).not.toContain('AutoCAD');
  });

  it('uses plain language for planned model and service modules', () => {
    expect(phase4).toContain('Model comparison preview');
    expect(phase4).not.toContain('Dual-Drive Consensus Sandbox');
    expect(phase4).not.toContain('Strategy Arbitrage');
    expect(phase4).not.toContain('Cognitive Arbitration Sandbox');
    expect(phase5).toContain('Service checks');
    expect(phase5).not.toContain('Unified Business Brain');
    expect(phase5).not.toContain('Multi-Org Hierarchy & RBAC');
    expect(phase5).not.toContain('Unified Business Brain');
  });

  it('describes model selection as a preference, not proof of provider connectivity', () => {
    expect(drive).toContain('Model provider:');
    expect(drive).not.toContain('cognitive pathways');
    expect(intelligence).toContain('Model provider');
    expect(intelligence).not.toContain('ultra-low latency (<400ms)');
  });

  it('uses plain language in workspace settings', () => {
    expect(settings).not.toContain("cognitive intelligence and campaign tracking engines");
    expect(settings).toContain('Sync leads & learning data');
  });

  it('removes aspirational claims and fake actions from the product guide', () => {
    expect(guide).toContain('Contractor sales and operations workspace');
    expect(guide).toContain('HAL Operating Manual');
    expect(guide).not.toContain('Bible');
    expect(guide).not.toContain('AI Business Operating Intelligence System');
    expect(guide).not.toContain('executive partner. Not a tool. Not an assistant.');
    expect(guide).not.toContain('Harvesting Map grounding!');
    expect(guide).not.toContain('PROPOSE ENTERPRISE CONNECT');
    expect(guide).not.toContain('COMMENCE MANDATE');
    expect(guide).not.toContain('zero synthetic hallucinations');
    expect(guide).toContain('Not independently verified');
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
