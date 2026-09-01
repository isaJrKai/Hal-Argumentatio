import { Skill } from './types';
import { websiteAuditSkill } from './website-audit';
import { outreachSkill } from './outreach';
import { geoSkill } from './geo';
import { researchSkill } from './research';
import { seoSkill } from './seo';
import { geoMapSkill } from './geo-map';
import { adSpendOptimizerSkill } from './ad-spend-optimizer';
import { seoSchemaGeneratorSkill } from './seo-schema-generator';
import { reviewBoosterSkill } from './review-booster';
import { securityAuditorSkill } from './security-auditor';
import { competitorAnalyzerSkill } from './competitor-analyzer';
import { talentArbitrageBridgeSkill } from './talent-arbitrage-bridge';
import { verifiedLeadListsSkill } from './verified-lead-lists';
import { automationOpsProductSkill } from './automation-ops-product';
import { pricingMarginCalculatorSkill } from './pricing-margin-calculator';
import { adSpendBreakevenSkill } from './ad-spend-breakeven';
import { listSubscriptionPricingSkill } from './list-subscription-pricing';
import { jupyterLiveKernelSkill } from './jupyter-live-kernel';
import { xurlSkill } from './xurl';
import { dueDiligenceUnderwritingSkill } from './due-diligence-underwriting';
import { complianceScreenerSkill } from './compliance-screener';
import { maTargetIntelSkill } from './ma-target-intel';
import { patentLandscapeSkill } from './patent-landscape';

const SKILLS_REGISTRY: Record<string, Skill> = {
  [websiteAuditSkill.id]: websiteAuditSkill,
  [outreachSkill.id]: outreachSkill,
  [geoSkill.id]: geoSkill,
  [researchSkill.id]: researchSkill,
  [seoSkill.id]: seoSkill,
  [geoMapSkill.id]: geoMapSkill,
  [adSpendOptimizerSkill.id]: adSpendOptimizerSkill,
  [seoSchemaGeneratorSkill.id]: seoSchemaGeneratorSkill,
  [reviewBoosterSkill.id]: reviewBoosterSkill,
  [securityAuditorSkill.id]: securityAuditorSkill,
  [competitorAnalyzerSkill.id]: competitorAnalyzerSkill,
  [talentArbitrageBridgeSkill.id]: talentArbitrageBridgeSkill,
  [verifiedLeadListsSkill.id]: verifiedLeadListsSkill,
  [automationOpsProductSkill.id]: automationOpsProductSkill,
  [pricingMarginCalculatorSkill.id]: pricingMarginCalculatorSkill,
  [adSpendBreakevenSkill.id]: adSpendBreakevenSkill,
  [listSubscriptionPricingSkill.id]: listSubscriptionPricingSkill,
  [jupyterLiveKernelSkill.id]: jupyterLiveKernelSkill,
  [xurlSkill.id]: xurlSkill,
  [dueDiligenceUnderwritingSkill.id]: dueDiligenceUnderwritingSkill,
  [complianceScreenerSkill.id]: complianceScreenerSkill,
  [maTargetIntelSkill.id]: maTargetIntelSkill,
  [patentLandscapeSkill.id]: patentLandscapeSkill,
};

let DYNAMIC_SKILLS: Record<string, Skill> = { ...SKILLS_REGISTRY };

export function getAllSkills(): Skill[] {
  return Object.values(DYNAMIC_SKILLS);
}

export function getSkillById(id: string): Skill | undefined {
  return DYNAMIC_SKILLS[id];
}

export function registerCustomSkill(skill: Skill) {
  DYNAMIC_SKILLS[skill.id] = skill;
}

export function unregisterCustomSkill(id: string): boolean {
  if (SKILLS_REGISTRY[id]) {
    // Cannot delete standard core skills
    return false;
  }
  if (DYNAMIC_SKILLS[id]) {
    delete DYNAMIC_SKILLS[id];
    return true;
  }
  return false;
}

export async function executeSkill(id: string, inputs: Record<string, any>, contractorId: string): Promise<any> {
  const skill = getSkillById(id);
  if (!skill) {
    throw new Error(`Skill with ID "${id}" is not registered in HALBiz.`);
  }

  // Validate inputs
  const resolvedInputs: Record<string, any> = {};
  for (const inputDef of skill.inputs) {
    const value = inputs[inputDef.name] ?? inputDef.defaultValue;
    if (inputDef.required && (value === undefined || value === null || value === '')) {
      throw new Error(`Missing required input "${inputDef.name}" (${inputDef.label}) for skill "${skill.name}".`);
    }
    resolvedInputs[inputDef.name] = value;
  }

  return await skill.execute(resolvedInputs, contractorId);
}
