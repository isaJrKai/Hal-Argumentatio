export interface IndustryMissionBlueprint {
  title: string;
  description: string;
  steps: {
    title: string;
    description: string;
  }[];
}

export interface IndustryProfile {
  id: string;
  name: string;
  category: string;
  iconName: string;
  description: string;
  defaultNiches: string[];
  ltvRange: { min: number; max: number; averageContract: number };
  cplBenchmark: number;
  salesCycle: string;
  auditFocus: {
    key1: string;
    key2: string;
    key3: string;
    key4: string;
  };
  outreachAngle: string;
  nichePainPoints: string[];
  nichePipelineStages: string[];
  nicheMissions: IndustryMissionBlueprint[];
}

export const INDUSTRY_TAXONOMY: IndustryProfile[] = [
  {
    id: 'builders_construction',
    name: 'Construction & Custom Builders',
    category: 'Commercial & Residential Build',
    iconName: 'Hammer',
    description: 'Custom home builders, general contractors, remodeling firms, and framing specialists.',
    defaultNiches: [
      'custom home builders',
      'general contractors',
      'kitchen & bath remodelers',
      'commercial framing & build',
      'deck & patio builders'
    ],
    ltvRange: { min: 45000, max: 250000, averageContract: 125000 },
    cplBenchmark: 180,
    salesCycle: '60 - 120 Days',
    auditFocus: {
      key1: 'High-Res Project Portfolio Speed & Mobile Rendering',
      key2: 'Digital Permit & License Verification Badging',
      key3: 'Instant 3D Estimator & Consultation Scheduling',
      key4: 'Google Review Trust Rating & Architect Endorsements'
    },
    outreachAngle: 'High-ticket custom build leads drop by 68% if mobile portfolio loads slowly or lacks instant consultation scheduling.',
    nichePainPoints: [
      'Slow mobile portfolio image rendering loses high-net-worth home buyers',
      'No interactive 3D floor plan or budget calculator on consultation pages',
      'Inconsistent lead follow-up on $100k+ build inquiries causing prospect leak',
      'Weak Google Maps local pack presence for custom luxury keywords'
    ],
    nichePipelineStages: [
      'Inquiry Received',
      'Site Consult Scheduled',
      '3D Estimator Sent',
      'Contract Signed',
      'Build In-Progress'
    ],
    nicheMissions: [
      {
        title: 'Architect & Subdivision Permit Conquest',
        description: 'Automated multi-agent sequence scanning new luxury housing subdivisions, auditing local builder websites, and dispatching custom 3D portfolio pitch decks.',
        steps: [
          { title: 'Subdivision Registry Scan', description: 'Identifies active building permits and land ownership records in target city.' },
          { title: 'Builder Site Performance Audit', description: 'Evaluates portfolio load speeds, mobile responsiveness, and consultation booking CTAs.' },
          { title: 'Executive Pitch Deck Compilation', description: 'Generates a white-labeled build proposal highlighting mobile lead recovery.' }
        ]
      },
      {
        title: 'High-LTV Custom Builder Retargeting Campaign',
        description: 'Optimizes search ad bids for high-net-worth custom build keywords during peak local real estate query hours.',
        steps: [
          { title: 'Search Query High-LTV Filter', description: 'Extracts luxury custom home build search volume metrics.' },
          { title: 'Automated Bid Multiplier Injection', description: 'Injects 1.5x CPC multiplier on high-intent subdivision search queries.' },
          { title: 'Instant Consultation Trigger Verification', description: 'Verifies calendar availability and instant SMS confirmation routing.' }
        ]
      }
    ]
  },
  {
    id: 'lawn_landscaping',
    name: 'Lawn Care & Mowers',
    category: 'Property Maintenance & Exterior',
    iconName: 'Trees',
    description: 'Lawn mowing services, commercial landscaping, tree care, and seasonal yard maintenance.',
    defaultNiches: [
      'lawn care & mowing',
      'commercial landscaping',
      'tree trimming & removal',
      'irrigation & sprinklers',
      'hardscaping & paving'
    ],
    ltvRange: { min: 1200, max: 8500, averageContract: 2400 },
    cplBenchmark: 18,
    salesCycle: '1 - 3 Days',
    auditFocus: {
      key1: 'Instant Square-Footage Online Quote Estimator',
      key2: 'Recurring Monthly Mowing Subscription Portal',
      key3: 'Route-Density Local Map Radius Optimization',
      key4: 'Seasonal Spring/Fall Maintenance Signup Campaigns'
    },
    outreachAngle: 'Residential & commercial property owners expect 60-second instant lawn quote calculators rather than phone callbacks.',
    nichePainPoints: [
      'Absence of instant square-footage online quote calculator causing instant bounce',
      'Inefficient route density causing excessive fuel burn and crew travel lag',
      'Off-season customer churn due to lack of automated seasonal maintenance upsells',
      'Under-optimized Google Review acquisition compared to regional landscaping competitors'
    ],
    nichePipelineStages: [
      'Inbound Lead',
      'Instant Quote Sent',
      'Trial Mowing Scheduled',
      'Recurring Contract Signed',
      'Annual Renewal'
    ],
    nicheMissions: [
      {
        title: 'Spring Route-Density Neighborhood Blitz',
        description: 'Territory conquest mission mapping high-density residential subdivisions to cluster lawn mowing contracts and maximize crew efficiency.',
        steps: [
          { title: 'Subdivision Geo-Boundary Extraction', description: 'Identifies dense residential clusters with 0.25+ acre properties.' },
          { title: 'Instant Quote Portal Audit', description: 'Checks if competitor sites offer instant satellite lot-size calculators.' },
          { title: 'Neighborhood Direct Outreach Dispatch', description: 'Sends automated route-density discount offers to surrounding homeowners.' }
        ]
      },
      {
        title: 'Commercial Property Landscaping Acquisition',
        description: 'Targets property managers and HOA boards for multi-year commercial lawn and grounds maintenance retainers.',
        steps: [
          { title: 'Commercial Property Registry Scan', description: 'Extracts contact profiles for commercial real estate and HOA managers.' },
          { title: 'Grounds Maintenance Scope Generation', description: 'Pre-calculates property acreage and generates automated grounds maintenance quotes.' }
        ]
      }
    ]
  },
  {
    id: 'plumbing_mechanical',
    name: 'Plumbing & Mechanical',
    category: 'Home & Commercial Services',
    iconName: 'Wrench',
    description: 'Emergency plumbing, HVAC, sump pump installation, and basement waterproofing.',
    defaultNiches: [
      'plumbing',
      'plumbing & heating',
      'basement waterproofing',
      'flood restoration',
      'hvac & air conditioning',
      'emergency pipe repair'
    ],
    ltvRange: { min: 1800, max: 12000, averageContract: 3800 },
    cplBenchmark: 42,
    salesCycle: 'Under 24 Hours',
    auditFocus: {
      key1: '24/7 Emergency Click-to-Call Dispatch Banner',
      key2: 'Google Local Services Ads & Guaranteed Badge',
      key3: 'SSL Security & Rapid Page Load under 2 Seconds',
      key4: 'Seasonal Freeze-Prevention & Pipe Advisory Pages'
    },
    outreachAngle: 'Emergency service calls convert in under 3 minutes; non-responsive or slow sites lose 80% of dispatch leads to competitors.',
    nichePainPoints: [
      'Lack of 24/7 click-to-call emergency dispatch bar on mobile header',
      'Mobile page speed over 3.5 seconds dropping urgent pipe burst searchers',
      'Unverified Google Local Services Guarantee badge reducing call trust',
      'No automated missed-call text-back system when technicians are on jobs'
    ],
    nichePipelineStages: [
      'Dispatch Call',
      'Technician Sent',
      'Quote Approved',
      'Work Completed',
      'Review Requested'
    ],
    nicheMissions: [
      {
        title: 'Emergency Service Rapid Response Audit',
        description: 'Scans regional plumbing firms for mobile click-to-call responsiveness and SSL security gaps.',
        steps: [
          { title: 'Mobile Call Button Benchmark', description: 'Verifies if site header features instant 1-tap phone dispatch.' },
          { title: 'Page Load Speed Under Load Test', description: 'Measures 3G/4G latency for emergency pipe burst queries.' },
          { title: 'Instant Lead-Leak Audit Dispatch', description: 'Delivers technical audit showing missed dispatch revenue.' }
        ]
      }
    ]
  },
  {
    id: 'electrical_solar',
    name: 'Electrical & Solar Energy',
    category: 'Energy & Infrastructure',
    iconName: 'Zap',
    description: 'Solar panel installers, commercial electricians, EV charger installation, and smart grid techs.',
    defaultNiches: [
      'solar panel installation',
      'commercial electricians',
      'ev charger installation',
      'smart home automation',
      'emergency electrical repair'
    ],
    ltvRange: { min: 8500, max: 65000, averageContract: 28000 },
    cplBenchmark: 120,
    salesCycle: '14 - 30 Days',
    auditFocus: {
      key1: 'Solar ROI Savings Calculator Widget',
      key2: 'Government Rebate & Incentive Guide Pages',
      key3: 'Certified Master Electrician Trust Badges',
      key4: 'EV Charger Compatibility & Quote Funnel'
    },
    outreachAngle: 'High-margin solar & EV installations require transparent ROI calculators to convert high-intent homeowners.',
    nichePainPoints: [
      'Absence of interactive Solar ROI & utility rebate calculator on landing page',
      'Homeowner confusion regarding federal/provincial green energy tax credits',
      'Lack of prominent Master Electrician certifications and warranty seals',
      'Weak organic positioning for residential EV charger installation terms'
    ],
    nichePipelineStages: [
      'Roof Audit Request',
      'Utility Savings Analysis',
      'Proposal Delivered',
      'Permits & Install',
      'Grid Commissioned'
    ],
    nicheMissions: [
      {
        title: 'Net-Zero Rebate & Solar ROI Campaign',
        description: 'Targets eco-conscious homeowners and EV owners with custom utility savings calculators and rebate guides.',
        steps: [
          { title: 'Solar Insolation & Roof Area Analysis', description: 'Calculates average solar output for target city residential roofs.' },
          { title: 'Rebate Transparency Audit', description: 'Checks if installer sites explain federal/provincial green incentive steps.' },
          { title: 'Automated Solar Audit Proposal', description: 'Delivers bespoke 25-year energy savings projection deck.' }
        ]
      }
    ]
  },
  {
    id: 'roofing_siding',
    name: 'Roofing & Exterior',
    category: 'Building Envelope & Exterior',
    iconName: 'Home',
    description: 'Roof replacement, storm restoration, gutters, siding, and exterior painting.',
    defaultNiches: [
      'roofing contractors',
      'storm damage restoration',
      'siding & gutters',
      'exterior painting',
      'masonry & chimney repair'
    ],
    ltvRange: { min: 8500, max: 42000, averageContract: 18500 },
    cplBenchmark: 95,
    salesCycle: '7 - 21 Days',
    auditFocus: {
      key1: 'Drone Roof Inspection & Drone Quote Request',
      key2: 'Insurance Claim Assistance & Financing Portal',
      key3: 'Storm Impact Geo-Targeting Landing Pages',
      key4: 'Manufacturer Warranty Certification Badges'
    },
    outreachAngle: 'Roofing prospects convert heavily during post-storm windows when financing and drone inspection booking are prominent.',
    nichePainPoints: [
      'Slow post-storm response window losing storm damage insurance leads',
      'No instant online drone roof inspection scheduling tool',
      'Insurance claim assistance process friction discouraging homeowners',
      'Unoptimized local Google Business profile missing high-gloss roof job photos'
    ],
    nichePipelineStages: [
      'Damage Claim / Inquiry',
      'Drone Inspection Scheduled',
      'Insurance Adjustment',
      'Roof Replacement',
      'Warranty Delivered'
    ],
    nicheMissions: [
      {
        title: 'Post-Storm Rapid Damage Conquest',
        description: 'Monitors severe weather reports and instantly launches targeted inspection booking funnels for affected postal codes.',
        steps: [
          { title: 'Weather Radar Hail / Wind Trigger', description: 'Scans regional weather alerts for hail or wind speeds exceeding 80 km/h.' },
          { title: 'Postal Code Drone Inspection Blitz', description: 'Triggers local ad spending and direct SMS booking for roof inspection.' },
          { title: 'Insurance Claim Deck Dispatch', description: 'Provides homeowners with automated insurance claim documentation templates.' }
        ]
      }
    ]
  },
  {
    id: 'auto_logistics',
    name: 'Auto Detailing & Logistics',
    category: 'Automotive & Fleet Services',
    iconName: 'Car',
    description: 'Mobile auto detailing, fleet maintenance, towing & recovery, and commercial transport.',
    defaultNiches: [
      'mobile auto detailing',
      'commercial fleet repair',
      'towing & roadside assistance',
      'ceramic coating & paint protection',
      'heavy vehicle repair'
    ],
    ltvRange: { min: 800, max: 15000, averageContract: 3200 },
    cplBenchmark: 25,
    salesCycle: '1 - 2 Days',
    auditFocus: {
      key1: 'Mobile Fleet Online Booking Calendar',
      key2: 'Before & After High-Gloss Transformation Gallery',
      key3: 'Package Subscription & Maintenance Membership',
      key4: 'GPS Mobile Service Area Map'
    },
    outreachAngle: 'Mobile detailing clients buy monthly subscriptions when before/after galleries and online calendar booking are frictionless.',
    nichePainPoints: [
      'Lack of recurring monthly maintenance membership packages causing seasonal revenue drops',
      'No mobile 4K before-and-after ceramic coating photo gallery',
      'Phone booking lag instead of instant 1-click calendar scheduling',
      'Unclear mobile service radius map on booking landing page'
    ],
    nichePipelineStages: [
      'Booking Request',
      'Vehicle Inspected',
      'Detailing Completed',
      'Membership Subscribed',
      'Re-booking Reminder'
    ],
    nicheMissions: [
      {
        title: 'Mobile Detailing Membership Acquisition',
        description: 'Builds recurring subscription revenue by converting 1-off detailing clients into monthly maintenance package members.',
        steps: [
          { title: 'Fleet & Luxury Car Owner Audit', description: 'Identifies executive transport and luxury vehicle owners in target city.' },
          { title: 'Subscription Booking Funnel Audit', description: 'Checks competitor sites for recurring auto-pay detailing packages.' },
          { title: 'Automated Membership Offer Campaign', description: 'Dispatches VIP ceramic coating & monthly maintenance proposals.' }
        ]
      }
    ]
  },
  {
    id: 'custom_trade',
    name: 'Custom Niche / Custom Service',
    category: 'B2B & Custom Operations',
    iconName: 'Briefcase',
    description: 'User-defined industry trade, specialized professional services, or custom business verticals.',
    defaultNiches: [
      'custom B2B service',
      'specialty contracting',
      'commercial maintenance',
      'niche consulting'
    ],
    ltvRange: { min: 2500, max: 50000, averageContract: 10000 },
    cplBenchmark: 50,
    salesCycle: '14 - 45 Days',
    auditFocus: {
      key1: 'Custom Technical Competency Audit',
      key2: 'Lead Acquisition Funnel Speed',
      key3: 'Trust & Reputation Proof Signals',
      key4: 'Domain Authority & Organic Search Reach'
    },
    outreachAngle: 'B2B prospects evaluate domain authority, case studies, and rapid consultation scheduling.',
    nichePainPoints: [
      'Weak domain authority for specialized commercial keywords',
      'No automated consultation booking or discovery questionnaire',
      'Unclear value proposition and missing verified case studies',
      'Manual cold outreach bottlenecks limiting predictable pipeline growth'
    ],
    nichePipelineStages: [
      'Inbound Contact',
      'Discovery Call',
      'Custom Scope Sent',
      'Agreement Executed',
      'Onboarding Complete'
    ],
    nicheMissions: [
      {
        title: 'B2B Trade Discovery & Conquest Mission',
        description: 'Custom multi-step outreach sequence targeting decision-makers in specialized trade verticals.',
        steps: [
          { title: 'Target Decision-Maker Discovery', description: 'Identifies business owners and operations directors in target market.' },
          { title: 'Technical Capability Audit', description: 'Evaluates digital presence, lead capture speed, and search authority.' },
          { title: 'Custom Solution Proposal', description: 'Generates bespoke operating intelligence proposal and ROI forecast.' }
        ]
      }
    ]
  }
];

export function getIndustryProfile(industryIdOrNiche: string): IndustryProfile {
  const norm = industryIdOrNiche.toLowerCase().trim();
  
  // Try direct ID match
  const foundById = INDUSTRY_TAXONOMY.find(i => i.id === norm);
  if (foundById) return foundById;

  // Try matching default niches
  const foundByNiche = INDUSTRY_TAXONOMY.find(i => 
    i.defaultNiches.some(n => norm.includes(n.toLowerCase()) || n.toLowerCase().includes(norm))
  );
  if (foundByNiche) return foundByNiche;

  // Default fallback
  return INDUSTRY_TAXONOMY[0];
}
