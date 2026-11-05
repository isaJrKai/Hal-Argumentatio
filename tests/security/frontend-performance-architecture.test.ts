import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const app = readFileSync('src/App.tsx', 'utf8');
const entry = readFileSync('src/main.tsx', 'utf8');
const vite = readFileSync('vite.config.ts', 'utf8');
const mapWrapper = readFileSync('src/components/MapPanelWithProvider.tsx', 'utf8');
const styles = readFileSync('src/index.css', 'utf8');

describe('frontend loading and accessibility architecture', () => {
  it('keeps the Google Maps provider out of the application entry point', () => {
    expect(entry).not.toContain("@vis.gl/react-google-maps");
    expect(entry).not.toContain('<APIProvider');
    expect(app).toContain("lazy(() => import('./components/MapPanelWithProvider'))");
    expect(mapWrapper).toContain('<APIProvider');
  });

  it('separates map and chart dependencies from the initial application bundle', () => {
    expect(vite).toContain("return 'maps'");
    expect(vite).toContain("return 'charts'");
  });

  it('provides visible keyboard focus and reduced-motion support', () => {
    expect(styles).toContain(':focus-visible');
    expect(styles).toContain('prefers-reduced-motion: reduce');
  });

  it('exposes the mobile navigation as a labelled dialog', () => {
    expect(app).toContain('aria-modal="true"');
    expect(app).toContain('aria-label="Main navigation"');
  });
});
