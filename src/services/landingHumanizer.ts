import { LandingPageConfig } from '../components/landing/types';

export interface AntiSlopViolation {
  field: string;
  word: string;
  context: string;
  suggestion: string;
  category: 'banned_ai_word' | 'binary_contrast' | 'throat_clearing' | 'weak_cta';
}

export interface HumanizerDiff {
  field: string;
  before: string;
  after: string;
  reason: string;
}

export interface HumanizerScanResult {
  score: number; // 0 - 100% human score
  violations: AntiSlopViolation[];
  hasThroatClearing: boolean;
  hasBinaryContrast: boolean;
  bannedWordCount: number;
}

// Banned AI vocabulary mandated by Landing Page Builder Rules Section 2
export const BANNED_AI_WORDS: { [word: string]: string } = {
  'delve': 'examine',
  'landscape': 'market',
  'tapestry': 'variety',
  'pivotal': 'essential',
  'showcase': 'feature',
  'leverage': 'use',
  'robust': 'heavy-duty',
  'cutting-edge': 'modern commercial-grade',
  'cutting edge': 'modern commercial-grade',
  'seamless': 'straightforward',
  'game-changer': 'major improvement',
  'game changer': 'major improvement',
  'next-level': 'certified',
  'next level': 'certified',
  'unlock': 'gain access to',
  'empower': 'enable',
  'foster': 'build',
  'utilize': 'use',
  'paradigm': 'model',
  'transformative': 'dramatic',
  'revolutionize': 'modernize',
  'elevate': 'raise',
  'supercharge': 'speed up',
  'unleash': 'deploy',
  'synergy': 'coordination'
};

export const THROAT_CLEARING_PATTERNS = [
  /in today'?s fast-paced world[,\s]*/gi,
  /here'?s the thing[,\s:]*/gi,
  /what nobody tells you (is|about)[,\s]*/gi,
  /at the end of the day[,\s]*/gi,
  /it goes without saying that[,\s]*/gi,
  /when it comes to[,\s]*/gi,
  /needless to say[,\s]*/gi
];

export const BINARY_CONTRAST_PATTERNS = [
  /it'?s not (about|just) [^.]+?[.,;]\s*it'?s (about|just)?/gi,
  /the question isn'?t [^.]+?[.,;]\s*the question is/gi,
  /not just [^.]+?[.,;]\s*but also/gi
];

export const WEAK_CTA_WORDS = [
  'learn more',
  'click here',
  'submit',
  'read more',
  'find out more',
  'get started'
];

/**
 * Scans a single string value for slop violations
 */
export function scanTextForSlop(text: string, fieldName: string): AntiSlopViolation[] {
  if (!text || typeof text !== 'string') return [];
  const violations: AntiSlopViolation[] = [];
  const lower = text.toLowerCase();

  // 1. Check Banned AI Words
  for (const [word, replacement] of Object.entries(BANNED_AI_WORDS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - 24);
      const end = Math.min(text.length, match.index + word.length + 24);
      violations.push({
        field: fieldName,
        word: match[0],
        context: `..."${text.substring(start, end)}"`,
        suggestion: replacement,
        category: 'banned_ai_word'
      });
    }
  }

  // 2. Check Throat Clearing
  for (const pattern of THROAT_CLEARING_PATTERNS) {
    let match;
    const patCopy = new RegExp(pattern.source, 'gi');
    while ((match = patCopy.exec(text)) !== null) {
      violations.push({
        field: fieldName,
        word: match[0],
        context: `Opening throat-clearing: "${match[0]}"`,
        suggestion: 'Lead directly with the primary claim or number',
        category: 'throat_clearing'
      });
    }
  }

  // 3. Check Binary Contrast Theater
  for (const pattern of BINARY_CONTRAST_PATTERNS) {
    let match;
    const patCopy = new RegExp(pattern.source, 'gi');
    while ((match = patCopy.exec(text)) !== null) {
      violations.push({
        field: fieldName,
        word: match[0],
        context: `Binary contrast theater: "${match[0]}"`,
        suggestion: 'State the concrete fact or benefit directly without rhetorical contrast',
        category: 'binary_contrast'
      });
    }
  }

  // 4. Check Weak CTAs if this is a button or CTA field
  if (fieldName.toLowerCase().includes('cta') || fieldName.toLowerCase().includes('button')) {
    for (const weak of WEAK_CTA_WORDS) {
      if (lower === weak || lower.startsWith(weak)) {
        violations.push({
          field: fieldName,
          word: text,
          context: `Weak generic CTA: "${text}"`,
          suggestion: 'Action + Concrete Outcome (e.g. "Book Emergency Dispatch", "Request Flat-Rate Quote")',
          category: 'weak_cta'
        });
      }
    }
  }

  return violations;
}

/**
 * Scans an entire landing page configuration for all rule violations
 */
export function scanLandingPageConfig(config: LandingPageConfig): HumanizerScanResult {
  const violations: AntiSlopViolation[] = [];

  // Hero
  if (config.sections.hero) {
    violations.push(...scanTextForSlop(config.sections.hero.headline, 'Hero Headline'));
    violations.push(...scanTextForSlop(config.sections.hero.subheadline, 'Hero Subheadline'));
    violations.push(...scanTextForSlop(config.sections.hero.badgeText, 'Hero Badge'));
  }

  // Lead Form
  if (config.sections.lead_form) {
    violations.push(...scanTextForSlop(config.sections.lead_form.title, 'Lead Form Title'));
    violations.push(...scanTextForSlop(config.sections.lead_form.subtitle, 'Lead Form Subtitle'));
    violations.push(...scanTextForSlop(config.sections.lead_form.buttonText, 'Lead Form CTA Button'));
  }

  // Services
  if (config.sections.services) {
    violations.push(...scanTextForSlop(config.sections.services.title, 'Services Section Title'));
    violations.push(...scanTextForSlop(config.sections.services.subtitle, 'Services Subtitle'));
    config.sections.services.items.forEach((item, idx) => {
      violations.push(...scanTextForSlop(item.title, `Service #${idx + 1} Title`));
      violations.push(...scanTextForSlop(item.description, `Service #${idx + 1} Description`));
    });
  }

  // Seasonal Alert
  if (config.sections.seasonal_alert) {
    violations.push(...scanTextForSlop(config.sections.seasonal_alert.title, 'Seasonal Alert Title'));
    violations.push(...scanTextForSlop(config.sections.seasonal_alert.description, 'Seasonal Alert Description'));
    config.sections.seasonal_alert.bulletPoints?.forEach((pt, idx) => {
      violations.push(...scanTextForSlop(pt, `Seasonal Bullet #${idx + 1}`));
    });
  }

  // Guarantee
  if (config.sections.guarantee) {
    violations.push(...scanTextForSlop(config.sections.guarantee.title, 'Guarantee Title'));
    violations.push(...scanTextForSlop(config.sections.guarantee.description, 'Guarantee Description'));
    violations.push(...scanTextForSlop(config.sections.guarantee.ctaText, 'Guarantee CTA Button'));
  }

  // FAQ
  if (config.sections.faq) {
    config.sections.faq.items?.forEach((item, idx) => {
      violations.push(...scanTextForSlop(item.question, `FAQ #${idx + 1} Question`));
      violations.push(...scanTextForSlop(item.answer, `FAQ #${idx + 1} Answer`));
    });
  }

  // Reviews
  if (config.sections.reviews) {
    config.sections.reviews.items?.forEach((rev, idx) => {
      violations.push(...scanTextForSlop(rev.text, `Review #${idx + 1} Text`));
    });
  }

  const bannedWordCount = violations.filter(v => v.category === 'banned_ai_word').length;
  const hasThroatClearing = violations.some(v => v.category === 'throat_clearing');
  const hasBinaryContrast = violations.some(v => v.category === 'binary_contrast');

  // Human Score Calculation: starts at 100, deducted per violation
  let penalty = (bannedWordCount * 12) + (hasThroatClearing ? 15 : 0) + (hasBinaryContrast ? 15 : 0);
  const weakCtaCount = violations.filter(v => v.category === 'weak_cta').length;
  penalty += weakCtaCount * 10;
  const score = Math.max(0, 100 - penalty);

  return {
    score,
    violations,
    hasThroatClearing,
    hasBinaryContrast,
    bannedWordCount
  };
}

/**
 * Cleans a piece of text by replacing banned AI words and cleaning throat clearing
 */
export function sanitizeText(text: string): { cleaned: string; changed: boolean } {
  if (!text || typeof text !== 'string') return { cleaned: text, changed: false };
  let result = text;
  let changed = false;

  // 1. Strip throat clearing
  for (const pattern of THROAT_CLEARING_PATTERNS) {
    const pat = new RegExp(pattern.source, 'gi');
    if (pat.test(result)) {
      result = result.replace(pat, '');
      changed = true;
    }
  }

  // 2. Replace banned words
  for (const [word, replacement] of Object.entries(BANNED_AI_WORDS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, (match) => {
        // preserve casing
        if (match[0] === match[0].toUpperCase()) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
      });
      changed = true;
    }
  }

  // Capitalize first character if stripping throat clearing left it lowercase
  result = result.trim();
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return { cleaned: result, changed };
}

/**
 * Automatically applies the Anti-Slop Humanizer pass to an entire LandingPageConfig,
 * producing a cleaned config and a detailed diff log of changes.
 */
export function applyHumanizerPass(config: LandingPageConfig): {
  cleanedConfig: LandingPageConfig;
  diffs: HumanizerDiff[];
  previousScore: number;
  newScore: number;
} {
  const initialScan = scanLandingPageConfig(config);
  const cloned: LandingPageConfig = JSON.parse(JSON.stringify(config));
  const diffs: HumanizerDiff[] = [];

  const checkAndReplace = (current: string, path: string, reason: string): string => {
    const { cleaned, changed } = sanitizeText(current);
    if (changed) {
      diffs.push({
        field: path,
        before: current,
        after: cleaned,
        reason
      });
      return cleaned;
    }
    return current;
  };

  // Hero
  if (cloned.sections.hero) {
    cloned.sections.hero.headline = checkAndReplace(
      cloned.sections.hero.headline,
      'Hero Headline',
      'Purged banned AI words & throat clearing'
    );
    cloned.sections.hero.subheadline = checkAndReplace(
      cloned.sections.hero.subheadline,
      'Hero Subheadline',
      'Purged banned AI words & throat clearing'
    );
    cloned.sections.hero.badgeText = checkAndReplace(
      cloned.sections.hero.badgeText,
      'Hero Badge',
      'Replaced AI buzzword'
    );
  }

  // Lead form
  if (cloned.sections.lead_form) {
    cloned.sections.lead_form.title = checkAndReplace(
      cloned.sections.lead_form.title,
      'Lead Form Title',
      'Direct human phrasing'
    );
    cloned.sections.lead_form.subtitle = checkAndReplace(
      cloned.sections.lead_form.subtitle,
      'Lead Form Subtitle',
      'Concrete value statement'
    );
    // Replace weak CTA
    if (['submit', 'click here', 'learn more'].includes(cloned.sections.lead_form.buttonText.toLowerCase().trim())) {
      const before = cloned.sections.lead_form.buttonText;
      cloned.sections.lead_form.buttonText = cloned.emergencyService 
        ? 'Book Emergency Dispatch Now' 
        : 'Request Fast Estimate';
      diffs.push({
        field: 'Lead Form CTA Button',
        before,
        after: cloned.sections.lead_form.buttonText,
        reason: 'Converted generic CTA into Action + Concrete Outcome'
      });
    }
  }

  // Services
  if (cloned.sections.services) {
    cloned.sections.services.title = checkAndReplace(cloned.sections.services.title, 'Services Title', 'Anti-slop');
    cloned.sections.services.subtitle = checkAndReplace(cloned.sections.services.subtitle, 'Services Subtitle', 'Anti-slop');
    cloned.sections.services.items.forEach((item, idx) => {
      item.title = checkAndReplace(item.title, `Service #${idx + 1} Title`, 'Direct trade terminology');
      item.description = checkAndReplace(item.description, `Service #${idx + 1} Description`, 'Concrete scope description');
    });
  }

  // Seasonal Alert
  if (cloned.sections.seasonal_alert) {
    cloned.sections.seasonal_alert.title = checkAndReplace(cloned.sections.seasonal_alert.title, 'Seasonal Title', 'Anti-slop');
    cloned.sections.seasonal_alert.description = checkAndReplace(cloned.sections.seasonal_alert.description, 'Seasonal Description', 'Direct warning');
    if (cloned.sections.seasonal_alert.bulletPoints) {
      cloned.sections.seasonal_alert.bulletPoints = cloned.sections.seasonal_alert.bulletPoints.map((pt, idx) =>
        checkAndReplace(pt, `Seasonal Bullet #${idx + 1}`, 'Actionable outcome')
      );
    }
  }

  // Guarantee
  if (cloned.sections.guarantee) {
    cloned.sections.guarantee.title = checkAndReplace(cloned.sections.guarantee.title, 'Guarantee Title', 'Ironclad risk reversal');
    cloned.sections.guarantee.description = checkAndReplace(cloned.sections.guarantee.description, 'Guarantee Description', 'Concrete terms');
  }

  // FAQ
  if (cloned.sections.faq && cloned.sections.faq.items) {
    cloned.sections.faq.items.forEach((item, idx) => {
      item.question = checkAndReplace(item.question, `FAQ #${idx + 1} Question`, 'Natural homeowner phrasing');
      item.answer = checkAndReplace(item.answer, `FAQ #${idx + 1} Answer`, 'Concrete explanation');
    });
  }

  const finalScan = scanLandingPageConfig(cloned);

  return {
    cleanedConfig: cloned,
    diffs,
    previousScore: initialScan.score,
    newScore: finalScan.score
  };
}
