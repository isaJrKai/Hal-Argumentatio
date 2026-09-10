import { LandingPageConfig } from './types';

export const DEFAULT_SECTION_ORDER = [
  'announcement_bar',
  'header',
  'hero',
  'trust_bar',
  'seasonal_alert',
  'services',
  'before_after',
  'reviews',
  'service_areas',
  'guarantee',
  'online_booking',
  'faq',
  'footer',
  'sticky_mobile_call'
];

export const TRADE_TEMPLATES: Record<string, LandingPageConfig> = {
  plumbing: {
    id: 'template-plumbing',
    title: 'Emergency Plumbing & Rapid Drain Services',
    trade: 'plumbing',
    businessName: 'Apex Precision Plumbing & Drains',
    city: 'Calgary',
    phone: '(403) 555-0199',
    licenseNumber: 'Master Plumber Lic #MP-88402',
    emergencyService: true,
    dispatchWindow: '30-Minute Dispatch Window Guaranteed',
    branding: {
      colorPreset: 'emergency_amber',
      primaryColor: '#0284c7', // Sky 600
      secondaryColor: '#0f172a', // Slate 900
      accentColor: '#f59e0b', // Amber 500
      fontStyle: 'modern_sans',
      logoText: 'APEX PLUMBING'
    },
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sections: {
      announcement_bar: {
        active: true,
        text: '⚡ Active Emergency Crews On-Duty in Calgary • Guaranteed 30-Minute Response Window',
        urgencyBadge: '24/7 EMERGENCY DISPATCH'
      },
      header: {
        active: true,
        ctaText: 'Call (403) 555-0199'
      },
      hero: {
        active: true,
        headline: 'Burst Pipe or Sewer Backup? We Arrive in Under 30 Minutes.',
        subheadline: 'Master journeyman plumbers equipped with heavy-duty diagnostic cameras, hydro-jetters, and replacement inventory for single-trip resolution.',
        badgeText: 'Licensed, Bonded & Insured Master Plumbers',
        heroImageUrl: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1200&q=80'
      },
      lead_form: {
        active: true,
        title: 'Request Priority Emergency Dispatch',
        subtitle: 'Immediate intake. Our on-duty dispatcher confirms technician ETA within 60 seconds.',
        buttonText: '⚡ Dispatch Technician Now',
        dispatchNote: 'Zero trip surcharge in Calgary. 100% upfront quote before tools come out.'
      },
      trust_bar: {
        active: true,
        badges: [
          { id: 'b1', icon: 'ShieldCheck', title: 'Red Seal Certified', subtitle: 'Master Journeymen Only' },
          { id: 'b2', icon: 'Clock', title: '30-Min Arrival', subtitle: 'Priority Emergency Response' },
          { id: 'b3', icon: 'DollarSign', title: 'Upfront Fixed Rate', subtitle: 'No Hidden Surprise Fees' },
          { id: 'b4', icon: 'Award', title: '1-Year Warranty', subtitle: '100% Labor & Parts Backed' }
        ]
      },
      seasonal_alert: {
        active: true,
        tag: 'WINTER FREEZE WARNING',
        title: 'Frozen Pipes & Burst Line Prevention',
        description: 'Sub-zero temperatures create catastrophic hydrostatic pipe pressure. If your water pressure suddenly dropped or faucets are sputtering, shut off main valve and call immediately.',
        bulletPoints: [
          'Non-destructive electronic acoustic line locator & freeze thaw equipment',
          'Trenchless water main line replacement with zero lawn destruction',
          'Insurance claim documentation package with photo proof'
        ]
      },
      services: {
        active: true,
        title: 'Complete Residential & Commercial Solutions',
        subtitle: 'Heavy-duty industrial grade plumbing tools ready on every dispatched service vehicle.',
        items: [
          {
            id: 's1',
            title: 'Emergency Burst Pipe Repair',
            description: 'Immediate shut-off, high-pressure line clamping, PEX/copper replacement, and drying barrier placement.',
            priceEstimate: 'From $189 flat',
            badge: 'Most Urgent',
            icon: 'Droplets'
          },
          {
            id: 's2',
            title: 'Hydro-Jet Sewer & Main Drain Clearing',
            description: '4,000 PSI hydro-jetting blasts tree roots, grease buildup, and foreign obstructions completely clear.',
            priceEstimate: 'From $249 flat',
            badge: 'Includes Video Inspection',
            icon: 'Activity'
          },
          {
            id: 's3',
            title: 'Hot Water Tank & Tankless Installs',
            description: 'Same-day water heater replacement. High-efficiency gas, electric, and on-demand Navien tankless units.',
            priceEstimate: 'From $850 installed',
            badge: 'Same-Day Install',
            icon: 'Flame'
          }
        ]
      },
      before_after: {
        active: true,
        title: 'Real Home Transformations',
        subtitle: 'Authentic photos of recent plumbing restorations completed in local neighborhoods.',
        items: [
          {
            id: 'ba1',
            title: 'Complete Basement Sewer Backup Restoration',
            location: 'Altadore, SW Calgary',
            beforeImg: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
            afterImg: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=80',
            challenge: '4-inch cast iron sewer line crushed by mature poplar root infiltration, causing raw backflow.',
            solution: 'Excavated without disturbing foundation, installed heavy PVC line with cleanout and backwater valve.'
          }
        ]
      },
      reviews: {
        active: true,
        title: 'Verified Homeowner Reviews',
        subtitle: 'Real customer feedback verified directly through Google Local Services.',
        rating: 4.9,
        totalReviews: 247,
        items: [
          {
            id: 'r1',
            name: 'Marcus Henderson',
            location: 'Mount Royal, Calgary',
            date: '3 days ago',
            stars: 5,
            text: 'Called them on a Sunday evening at 9:30 PM when our water main fitting ruptured. Mike arrived in 25 minutes, had the exact replacement valve on his truck, and fixed it cleanly without price gouging.',
            verified: true
          },
          {
            id: 'r2',
            name: 'Elena Rostova',
            location: 'Bridgeland, Calgary',
            date: '1 week ago',
            stars: 5,
            text: 'Super professional. Camera inspection showed us exactly where the tree root clogged our sewer line. They walked us through the cost before touching anything. Highly recommend.',
            verified: true
          },
          {
            id: 'r3',
            name: 'David Tremblay',
            location: 'Signal Hill, Calgary',
            date: '2 weeks ago',
            stars: 5,
            text: 'Replaced our 15-year-old leaking water heater on the same afternoon. Neat plumbing work and left the mechanical room cleaner than they found it.',
            verified: true
          }
        ]
      },
      service_areas: {
        active: true,
        title: 'Service Coverage In Your Neighborhood',
        subtitle: 'Our mobile trucks are distributed across all quadrants to meet our 30-minute dispatch guarantee.',
        cities: [
          'Downtown Calgary', 'Beltline', 'Mount Royal', 'Kensington', 
          'Altadore', 'Signal Hill', 'Airdrie', 'Cochrane', 'Okotoks', 'Chestermere'
        ],
        guaranteeText: 'Don\'t see your neighborhood? Call us — we service within 45km of city center with zero additional mileage fees.'
      },
      guarantee: {
        active: true,
        badgeText: '100% IRONCLAD RISK REVERSAL',
        title: 'Fixed Right The First Trip, Or Your Diagnostic Fee Is Waived',
        description: 'We respect your time and hard-earned money. If our technician cannot diagnose and propose a code-compliant solution on the initial visit, you pay exactly $0. No arguments, no fine print.',
        ctaText: 'Speak With On-Duty Dispatch'
      },
      online_booking: {
        active: true,
        title: 'Prefer To Schedule Ahead?',
        description: 'Book non-emergency consultations, annual plumbing inspections, and backflow testing directly onto our master schedule.',
        bookingUrl: '#lead-form',
        buttonText: 'Check Calendar Availability'
      },
      faq: {
        active: true,
        title: 'Frequently Asked Questions',
        items: [
          {
            id: 'f1',
            question: 'How quickly do you actually arrive during an emergency?',
            answer: 'Our average arrival window across Calgary is 26 minutes from dispatch call to our truck pulling up at your property.'
          },
          {
            id: 'f2',
            question: 'Do you charge extra for nights, weekends, or statutory holidays?',
            answer: 'No. Our standard emergency diagnostic rate stays consistent 24 hours a day, 365 days a year.'
          },
          {
            id: 'f3',
            question: 'Are all your technicians licensed journeymen?',
            answer: 'Yes. Every dispatched technician holds an active Provincial Red Seal Journeyman certificate and is covered by our $5,000,000 commercial liability policy.'
          }
        ]
      },
      sticky_mobile_call: {
        active: true,
        crewStatus: '⚡ 24/7 Crew On-Duty in Calgary',
        buttonText: '📞 Call (403) 555-0199'
      },
      footer: {
        active: true,
        address: '840 7th Ave SW, Calgary, AB T2P 3G2',
        copyright: '© 2026 Apex Precision Plumbing & Drains. All Rights Reserved.'
      }
    },
    seo: {
      metaTitle: '24/7 Emergency Plumber in Calgary | 30-Min Rapid Dispatch',
      metaDescription: 'Burst pipes, clogged sewer backups, and leaking water heaters repaired fast. Master certified journeyman plumbers with upfront pricing across Calgary.',
      schemaType: 'PlumbingService'
    }
  },

  hvac: {
    id: 'template-hvac',
    title: 'Emergency Heating, AC & Furnace Repair',
    trade: 'hvac',
    businessName: 'Vanguard Climate & Furnace Pros',
    city: 'Calgary',
    phone: '(403) 555-0188',
    licenseNumber: 'HVAC Journeyman Lic #HV-49210',
    emergencyService: true,
    dispatchWindow: 'Same-Day Service Guaranteed',
    branding: {
      colorPreset: 'trust_navy',
      primaryColor: '#2563eb', // Blue 600
      secondaryColor: '#0f172a', // Slate 900
      accentColor: '#38bdf8', // Sky 400
      fontStyle: 'modern_sans',
      logoText: 'VANGUARD HVAC'
    },
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sections: {
      announcement_bar: {
        active: true,
        text: '❄️ No Heat Emergency? Our On-Call Techs Are In Your Area Now • Same-Day Furnace Diagnostics',
        urgencyBadge: 'NO HEAT EMERGENCY'
      },
      header: {
        active: true,
        ctaText: 'Call (403) 555-0188'
      },
      hero: {
        active: true,
        headline: 'No Heat? Furnace Blowing Cold? We Restore Warmth Fast.',
        subheadline: 'Certified gasfitters carrying OEM igniters, pressure switches, draft blowers, and control boards for fast first-trip repairs.',
        badgeText: 'Licensed Gasfitters & Refrigeration Mechanics',
        heroImageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80'
      },
      lead_form: {
        active: true,
        title: 'Schedule Priority Heating Diagnostic',
        subtitle: 'Enter your phone number below for immediate technician callout.',
        buttonText: '🔥 Dispatch Heating Specialist',
        dispatchNote: 'Upfront flat-rate diagnostic pricing. No surprise travel surcharges.'
      },
      trust_bar: {
        active: true,
        badges: [
          { id: 'b1', icon: 'ShieldCheck', title: 'Licensed Gasfitters', subtitle: 'Class A & B Certified' },
          { id: 'b2', icon: 'Clock', title: '2-Hour Windows', subtitle: 'Guaranteed Arrival Time' },
          { id: 'b3', icon: 'DollarSign', title: 'Upfront Pricing', subtitle: 'Written Quote First' },
          { id: 'b4', icon: 'Award', title: '10-Yr Parts & Labor', subtitle: 'Available On New Installs' }
        ]
      },
      seasonal_alert: {
        active: true,
        tag: 'WINTER NO-HEAT CHECKLIST',
        title: 'Crucial Checks Before Calling For Repair',
        description: 'Before our tech drives out, verify your thermostat battery is fresh, the emergency wall switch is in the "ON" position, and your intake vent outside is free from snow and ice.',
        bulletPoints: [
          'Thermostat display check & breaker switch verification',
          'Exterior intake/exhaust frost blockage inspection',
          'Filter airflow restriction diagnostic'
        ]
      },
      services: {
        active: true,
        title: 'Comprehensive Climate & Air Services',
        subtitle: 'Full support for gas furnaces, high-efficiency heat pumps, ductless splits, and AC.',
        items: [
          {
            id: 's1',
            title: 'Emergency Furnace Repair',
            description: 'Flame sensor cleaning, hot surface igniters, gas valve replacement, and full combustion safety test.',
            priceEstimate: 'From $149 diagnostic',
            badge: '24/7 Available',
            icon: 'Flame'
          },
          {
            id: 's2',
            title: 'High-Efficiency Furnace Replacements',
            description: '96%+ AFUE two-stage and modulating furnaces. Energy rebates up to $1,200 eligible.',
            priceEstimate: 'From $3,400 installed',
            badge: 'Rebate Eligible',
            icon: 'Zap'
          },
          {
            id: 's3',
            title: 'AC Diagnostics & Compressor Service',
            description: 'Refrigerant leak detection, capacitor replacement, coil cleaning, and airflow balancing.',
            priceEstimate: 'From $169 flat',
            badge: 'Summer Ready',
            icon: 'Wind'
          }
        ]
      },
      before_after: {
        active: true,
        title: 'Recent Heating System Upgrades',
        subtitle: 'Transforming noisy, inefficient mechanical rooms into clean, whisper-quiet setups.',
        items: [
          {
            id: 'ba1',
            title: '30-Year Old Low-Efficiency Furnace Conversion',
            location: 'Varsity, Calgary',
            beforeImg: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
            afterImg: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
            challenge: 'Cracked heat exchanger leaking minor carbon monoxide into living quarters. System red-tagged.',
            solution: 'Permitted same-day install of 97% variable-speed ECM furnace with twin intake venting.'
          }
        ]
      },
      reviews: {
        active: true,
        title: 'Homeowner Feedback',
        subtitle: 'Ranked 4.9 stars across 180+ verified Google local reviews.',
        rating: 4.9,
        totalReviews: 184,
        items: [
          {
            id: 'r1',
            name: 'Brenda Campbell',
            location: 'Edgemont, Calgary',
            date: '4 days ago',
            stars: 5,
            text: 'Furnace stopped working during a -28°C cold snap. Vanguard dispatched a tech within an hour, diagnosed a faulty pressure switch, replaced it from stock on his truck, and had the heat back on in 40 minutes.',
            verified: true
          },
          {
            id: 'r2',
            name: 'Jason Wu',
            location: 'Tuscany, Calgary',
            date: '2 weeks ago',
            stars: 5,
            text: 'Transparent pricing. The tech showed me the worn igniter before doing anything. Clean work, fair price, and zero pressure sales tactics.',
            verified: true
          }
        ]
      },
      service_areas: {
        active: true,
        title: 'Calgary & Surrounding Service Radius',
        subtitle: 'Technicians on standby across Northwest, Northeast, Southwest, and Southeast.',
        cities: ['NW Calgary', 'SW Calgary', 'SE Calgary', 'NE Calgary', 'Airdrie', 'Cochrane', 'Okotoks'],
        guaranteeText: 'Guaranteed 2-hour arrival windows for all confirmed emergency calls.'
      },
      guarantee: {
        active: true,
        badgeText: 'COMFORT SATISFACTION GUARANTEE',
        title: '100% Warmth Restored Or You Owe Nothing',
        description: 'If our certified gasfitter does not restore functional heating or provide a clear path forward, your emergency call fee is completely refunded.',
        ctaText: 'Speak With Dispatcher'
      },
      online_booking: {
        active: true,
        title: 'Book An Annual Maintenance Tune-Up',
        description: 'Prevent costly mid-winter breakdowns with a comprehensive 26-point furnace & safety inspection.',
        bookingUrl: '#lead-form',
        buttonText: 'Book Tune-Up ($99)'
      },
      faq: {
        active: true,
        title: 'HVAC FAQs',
        items: [
          {
            id: 'f1',
            question: 'What is a furnace emergency?',
            answer: 'Any situation where outdoor temperatures are below freezing and your indoor heating cannot maintain 15°C, or if you smell gas or suspect carbon monoxide.'
          },
          {
            id: 'f2',
            question: 'How often should I change my furnace filter?',
            answer: 'Standard 1-inch filters should be inspected monthly and replaced every 60-90 days. High-efficiency 4-inch media filters last 6 to 9 months.'
          }
        ]
      },
      sticky_mobile_call: {
        active: true,
        crewStatus: '🔥 On-Call Gasfitters Standing By',
        buttonText: '📞 Call (403) 555-0188'
      },
      footer: {
        active: true,
        address: '1240 20th Ave NW, Calgary, AB T2M 1G3',
        copyright: '© 2026 Vanguard Climate & Furnace Pros. All Rights Reserved.'
      }
    },
    seo: {
      metaTitle: 'Emergency Furnace & Heating Repair Calgary | 24/7 HVAC Service',
      metaDescription: 'Fast 24/7 emergency furnace repair in Calgary. Certified gasfitters, upfront pricing, and same-day heat restoration.',
      schemaType: 'HVACBusiness'
    }
  },

  roofing: {
    id: 'template-roofing',
    title: 'Storm Damage & Architectural Roofing',
    trade: 'roofing',
    businessName: 'Ironclad Exterior & Roof Restoration',
    city: 'Calgary',
    phone: '(403) 555-0177',
    licenseNumber: 'Roofing Master Lic #RF-32984',
    emergencyService: true,
    dispatchWindow: 'Same-Day Tarping & Inspection',
    branding: {
      colorPreset: 'modern_slate',
      primaryColor: '#0f172a', // Slate 900
      secondaryColor: '#334155', // Slate 700
      accentColor: '#3b82f6', // Blue 500
      fontStyle: 'impact_bold',
      logoText: 'IRONCLAD ROOFING'
    },
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sections: {
      announcement_bar: {
        active: true,
        text: '⛈️ Active Storm Hail & Leak Response • Free Aerial Drone Damage Assessment',
        urgencyBadge: 'STORM DISPATCH'
      },
      header: {
        active: true,
        ctaText: 'Call (403) 555-0177'
      },
      hero: {
        active: true,
        headline: 'Roof Leak or Hail Damage? We Protect Your Home Today.',
        subheadline: 'Emergency dry-in tarping within hours, followed by forensic hail damage reports engineered specifically for insurance claim approval.',
        badgeText: 'GAF Master Elite & IKO Certified Installers',
        heroImageUrl: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=1200&q=80'
      },
      lead_form: {
        active: true,
        title: 'Request Free Drone Roof Inspection',
        subtitle: 'High-resolution thermal and zoom photography delivered within 24 hours.',
        buttonText: '🛡️ Request Free Inspection',
        dispatchNote: 'Zero obligation. Free comprehensive insurance estimate package.'
      },
      trust_bar: {
        active: true,
        badges: [
          { id: 'b1', icon: 'ShieldCheck', title: 'GAF Master Elite', subtitle: 'Top 2% Of All Roofers' },
          { id: 'b2', icon: 'Clock', title: '4-Hour Tarping', subtitle: 'Prevent Ceiling Collapse' },
          { id: 'b3', icon: 'FileText', title: 'Insurance Assist', subtitle: 'Xactimate Certified' },
          { id: 'b4', icon: 'Award', title: '50-Year Warranty', subtitle: 'Non-Prorated Coverage' }
        ]
      },
      seasonal_alert: {
        active: true,
        tag: 'HAIL INSURANCE DEADLINE',
        title: 'Don\'t Miss Your Policy Claim Window',
        description: 'Most homeowners insurance policies require hail and wind damage claims to be filed within 12 to 24 months of the storm event. Latent shingle bruising causes catastrophic leaks years later if left unaddressed.',
        bulletPoints: [
          'High-definition drone footage documenting granule loss and soft-metal dents',
          'Certified Xactimate line-item cost estimates matched to insurance standards',
          'Direct adjustor walkthrough to guarantee no legitimate damage is denied'
        ]
      },
      services: {
        active: true,
        title: 'Roofing & Exterior Systems',
        subtitle: 'Engineered for extreme temperature swings, high wind gusts, and golf ball-sized hail.',
        items: [
          {
            id: 's1',
            title: 'Emergency Leak Tarping',
            description: 'Fast mobilization to stop ongoing water intrusion into insulation and drywall ceilings.',
            priceEstimate: 'From $250 flat',
            badge: 'Same-Day',
            icon: 'Umbrella'
          },
          {
            id: 's2',
            title: 'Class 4 Impact Resistant Shingles',
            description: 'SBS-modified asphalt shingles rated to withstand 2-inch hail impact. Eligible for up to 15% insurance premium discounts.',
            priceEstimate: 'Custom Quote',
            badge: 'Hail Resistant',
            icon: 'Shield'
          },
          {
            id: 's3',
            title: 'Complete Soffit, Fascia & Eavestrough',
            description: 'Seamless 5-inch and 6-inch aluminum gutters with Alu-Rex leaf guard systems to prevent ice damming.',
            priceEstimate: 'From $8/ft',
            badge: 'Ice Dam Protection',
            icon: 'Droplets'
          }
        ]
      },
      before_after: {
        active: true,
        title: 'Storm Recovery Case Studies',
        subtitle: 'Before and after restoration of wind-ravaged and hail-damaged local roofs.',
        items: [
          {
            id: 'ba1',
            title: 'Hail Storm Shingle Tear-Off & Class 4 Upgrade',
            location: 'Saddle Ridge, Calgary',
            beforeImg: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=600&q=80',
            afterImg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
            challenge: 'Golf ball hail bruised 60% of shingles and split vinyl siding, leading to water staining in attic.',
            solution: 'Assisted homeowner with full insurance claim approval. Installed Class 4 impact shingles with 50-year warranty.'
          }
        ]
      },
      reviews: {
        active: true,
        title: 'What Homeowners Say',
        subtitle: 'Over 140 five-star reviews on Google and BBB A+ accredited.',
        rating: 5.0,
        totalReviews: 142,
        items: [
          {
            id: 'r1',
            name: 'Scott MacIntyre',
            location: 'Rocky Ridge, Calgary',
            date: '1 week ago',
            stars: 5,
            text: 'Ironclad handled our entire insurance claim after the June storm. Their drone photos were so clear that the insurance adjustor approved full replacement on the spot. The crew finished in one day and left our yard spotless.',
            verified: true
          }
        ]
      },
      service_areas: {
        active: true,
        title: 'Communities We Protect',
        subtitle: 'Rapid deployment across Southern Alberta.',
        cities: ['Calgary', 'Airdrie', 'Cochrane', 'Okotoks', 'High River', 'Strathmore'],
        guaranteeText: 'Complete clean-up guarantee: we run rolling magnetic sweepers across your entire lawn to collect every stray nail.'
      },
      guarantee: {
        active: true,
        badgeText: '50-YEAR SYSTEM WARRANTY',
        title: 'Zero Leak Guarantee Backed By Manufacturer Warranty',
        description: 'Our installations are certified by major shingle manufacturers, giving you full coverage for materials and workmanship.',
        ctaText: 'Claim Your Free Inspection'
      },
      online_booking: {
        active: true,
        title: 'Schedule Your Free Drone Inspection',
        description: 'Choose a convenient day and time. You don\'t even need to be home for our aerial inspection.',
        bookingUrl: '#lead-form',
        buttonText: 'Select Inspection Date'
      },
      faq: {
        active: true,
        title: 'Roofing FAQs',
        items: [
          {
            id: 'f1',
            question: 'How do I know if my roof has hail damage if I can\'t see missing shingles?',
            answer: 'Hail damage usually appears as bruised asphalt or cracked fiberglass backing that can only be identified up close or via high-resolution drone zoom.'
          },
          {
            id: 'f2',
            question: 'Will you meet my insurance adjustor on-site?',
            answer: 'Yes! We attend the adjustor walkthrough to ensure every legitimate area of damage is counted in the claim scope.'
          }
        ]
      },
      sticky_mobile_call: {
        active: true,
        crewStatus: '🛡️ Free Storm Inspections Available',
        buttonText: '📞 Call (403) 555-0177'
      },
      footer: {
        active: true,
        address: '4200 46th Ave SE, Calgary, AB T2B 3N7',
        copyright: '© 2026 Ironclad Exterior & Roof Restoration. All Rights Reserved.'
      }
    },
    seo: {
      metaTitle: 'Calgary Roof Repair & Storm Hail Damage | Free Drone Inspection',
      metaDescription: 'Emergency roof leak repair, storm damage tarping, and insurance claim assistance. GAF Master Elite certified installers in Calgary.',
      schemaType: 'RoofingContractor'
    }
  },

  electrical: {
    id: 'template-electrical',
    title: 'Certified Master Electrician Services',
    trade: 'electrical',
    businessName: 'VoltCraft Master Electricians',
    city: 'Calgary',
    phone: '(403) 555-0166',
    licenseNumber: 'Master Electrician Lic #EC-90124',
    emergencyService: true,
    dispatchWindow: '45-Minute Emergency Response',
    branding: {
      colorPreset: 'electric_gold',
      primaryColor: '#eab308', // Yellow 500
      secondaryColor: '#09090b', // Zinc 950
      accentColor: '#f97316', // Orange 500
      fontStyle: 'modern_sans',
      logoText: 'VOLTCRAFT ELECTRIC'
    },
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sections: {
      announcement_bar: {
        active: true,
        text: '⚡ 24/7 Power Outage & Sparking Panel Dispatch • Certified Master Electricians',
        urgencyBadge: 'ELECTRICAL HAZARD DISPATCH'
      },
      header: {
        active: true,
        ctaText: 'Call (403) 555-0166'
      },
      hero: {
        active: true,
        headline: 'Flickering Lights or Breakers Tripping? We Diagnose Safely.',
        subheadline: 'Don\'t risk electrical fires. Master certified journeymen technicians carrying full breaker inventories, surge suppressors, and thermal imaging gear.',
        badgeText: 'Licensed, Bonded & Insured Master Electricians',
        heroImageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80'
      },
      lead_form: {
        active: true,
        title: 'Request Emergency Electrician',
        subtitle: 'Direct dispatch intake. Fast arrival with thermal hazard diagnostic tools.',
        buttonText: '⚡ Dispatch Electrician Now',
        dispatchNote: 'Safety first. Upfront binding pricing on all troubleshooting.'
      },
      trust_bar: {
        active: true,
        badges: [
          { id: 'b1', icon: 'ShieldCheck', title: 'Master Electrician', subtitle: 'Code Compliance Guaranteed' },
          { id: 'b2', icon: 'Clock', title: '45-Min Arrival', subtitle: 'Rapid Hazard Mitigation' },
          { id: 'b3', icon: 'DollarSign', title: 'Fixed Rate Pricing', subtitle: 'No Running Clocks' },
          { id: 'b4', icon: 'Award', title: 'Lifetime Labor', subtitle: 'On All Panel Upgrades' }
        ]
      },
      seasonal_alert: {
        active: true,
        tag: 'WINTER ELECTRICAL LOAD ALERT',
        title: 'Is Your 100-Amp Panel Overheating?',
        description: 'Running space heaters, hot tubs, and EV chargers simultaneously on aging breaker boxes creates severe thermal stress and arcing hazard. Our infrared cameras expose hotspots instantly.',
        bulletPoints: [
          'Infrared thermal imaging inspection of main service lugs and bus bars',
          'Clean 200-amp service upgrade permits pulled with city within 24 hours',
          'Whole-home surge protection to protect valuable smart home appliances'
        ]
      },
      services: {
        active: true,
        title: 'Residential & Commercial Electrical',
        subtitle: 'From simple lighting retrofits to full 200A service disconnect overhauls.',
        items: [
          {
            id: 's1',
            title: '200-Amp Electrical Panel Upgrades',
            description: 'Replace obsolete fuse boxes or Federal Pacific panels with clean, modern Square D or Siemens 200-amp service.',
            priceEstimate: 'From $2,400 installed',
            badge: 'Includes Permit',
            icon: 'Zap'
          },
          {
            id: 's2',
            title: 'Level 2 EV Charger Installations',
            description: 'Dedicated 50A circuit run for Tesla Wall Connectors, ChargePoint, and universal Level 2 electric vehicle chargers.',
            priceEstimate: 'From $650 flat',
            badge: 'Fast Turnaround',
            icon: 'BatteryCharging'
          },
          {
            id: 's3',
            title: 'Emergency Troubleshooting & Short Circuit Repair',
            description: 'Locate underground broken conduits, mystery tripping breakers, and neutral wire faults with precision meters.',
            priceEstimate: 'From $165 diagnostic',
            badge: '24/7 Available',
            icon: 'Activity'
          }
        ]
      },
      before_after: {
        active: true,
        title: 'Panel Hazard Transformations',
        subtitle: 'Before and after replacements of dangerous, outdated electrical panels.',
        items: [
          {
            id: 'ba1',
            title: 'Messy 60-Amp Fuse Box to Modern 200-Amp Breaker Center',
            location: 'Sunnyside, Calgary',
            beforeImg: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
            afterImg: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
            challenge: 'Fire hazard caused by double-tapped breakers and aluminum-copper splices.',
            solution: 'Permitted full copper rewiring, 200-amp Siemens panel, and whole-home type 2 surge suppressor.'
          }
        ]
      },
      reviews: {
        active: true,
        title: 'Customer Experiences',
        subtitle: 'Certified 5.0 stars with over 90 verified local Google reviews.',
        rating: 5.0,
        totalReviews: 94,
        items: [
          {
            id: 'r1',
            name: 'Travis Miller',
            location: 'Marda Loop, Calgary',
            date: '5 days ago',
            stars: 5,
            text: 'Called VoltCraft when our main breaker started buzzing and tripping during dinner. Tech arrived in 35 minutes, showed me the burnt bus bar connection on his thermal camera, and replaced the breaker safely. Superb service.',
            verified: true
          }
        ]
      },
      service_areas: {
        active: true,
        title: 'Calgary Wide Electrical Response',
        subtitle: 'Mobile service trucks stocked with certified electrical components.',
        cities: ['Calgary', 'Airdrie', 'Cochrane', 'Okotoks', 'Chestermere'],
        guaranteeText: 'City electrical permit guarantee: we handle all municipal paperwork and arrange final city inspection.'
      },
      guarantee: {
        active: true,
        badgeText: 'CANADIAN ELECTRICAL CODE GUARANTEE',
        title: '100% Code Compliant Work Or We Correct It For Free',
        description: 'Every circuit, wire gauge, and breaker installed by VoltCraft adheres strictly to CSA and Provincial Electrical Safety codes.',
        ctaText: 'Schedule Electrical Audit'
      },
      online_booking: {
        active: true,
        title: 'Book An EV Charger Or Panel Assessment',
        description: 'Schedule a certified Master Electrician to review your electrical load and provide a written flat-rate quote.',
        bookingUrl: '#lead-form',
        buttonText: 'Book Free Assessment'
      },
      faq: {
        active: true,
        title: 'Electrical FAQs',
        items: [
          {
            id: 'f1',
            question: 'Why does my breaker trip repeatedly when I reset it?',
            answer: 'Repeated tripping indicates a direct ground fault or overloaded circuit. Do not hold the breaker in the ON position as this bypasses critical fire protection.'
          }
        ]
      },
      sticky_mobile_call: {
        active: true,
        crewStatus: '⚡ Master Electricians On Call',
        buttonText: '📞 Call (403) 555-0166'
      },
      footer: {
        active: true,
        address: '510 5th Ave SW, Calgary, AB T2P 0L3',
        copyright: '© 2026 VoltCraft Master Electricians. All Rights Reserved.'
      }
    },
    seo: {
      metaTitle: '24/7 Master Electrician in Calgary | Panel Upgrades & EV Chargers',
      metaDescription: 'Fast emergency electrician service in Calgary. Certified Master Electricians specializing in 200A panel upgrades, EV chargers, and safety troubleshooting.',
      schemaType: 'Electrician'
    }
  }
};
