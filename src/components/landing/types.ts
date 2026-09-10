export type TradeType = 
  | 'plumbing' 
  | 'hvac' 
  | 'roofing' 
  | 'electrical' 
  | 'landscaping' 
  | 'renovation' 
  | 'general';

export type ColorPreset = 
  | 'emergency_amber' 
  | 'trust_navy' 
  | 'modern_slate' 
  | 'eco_green' 
  | 'electric_gold' 
  | 'custom';

export interface TrustBadgeItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  priceEstimate?: string;
  badge?: string;
  icon?: string;
}

export interface BeforeAfterItem {
  id: string;
  title: string;
  location: string;
  beforeImg: string;
  afterImg: string;
  challenge: string;
  solution: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  location: string;
  date: string;
  stars: number;
  text: string;
  avatarUrl?: string;
  verified: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface LandingPageConfig {
  id: string;
  contractorId?: string;
  title: string;
  trade: TradeType;
  businessName: string;
  city: string;
  phone: string;
  licenseNumber: string;
  emergencyService: boolean;
  dispatchWindow: string;
  
  // Branding
  branding: {
    colorPreset: ColorPreset;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontStyle: 'modern_sans' | 'impact_bold' | 'classic_authority';
    logoText?: string;
    logoUrl?: string;
  };

  // Section Order (array of section keys)
  sectionOrder: string[];

  // Section Definitions
  sections: {
    announcement_bar: {
      active: boolean;
      text: string;
      urgencyBadge: string;
    };
    header: {
      active: boolean;
      ctaText: string;
    };
    hero: {
      active: boolean;
      headline: string;
      subheadline: string;
      badgeText: string;
      heroImageUrl?: string;
    };
    lead_form: {
      active: boolean;
      title: string;
      subtitle: string;
      buttonText: string;
      dispatchNote: string;
    };
    trust_bar: {
      active: boolean;
      badges: TrustBadgeItem[];
    };
    services: {
      active: boolean;
      title: string;
      subtitle: string;
      items: ServiceItem[];
    };
    seasonal_alert: {
      active: boolean;
      tag: string;
      title: string;
      description: string;
      bulletPoints: string[];
    };
    before_after: {
      active: boolean;
      title: string;
      subtitle: string;
      items: BeforeAfterItem[];
    };
    reviews: {
      active: boolean;
      title: string;
      subtitle: string;
      rating: number;
      totalReviews: number;
      items: ReviewItem[];
    };
    service_areas: {
      active: boolean;
      title: string;
      subtitle: string;
      cities: string[];
      guaranteeText: string;
    };
    guarantee: {
      active: boolean;
      badgeText: string;
      title: string;
      description: string;
      ctaText: string;
    };
    online_booking: {
      active: boolean;
      title: string;
      description: string;
      bookingUrl: string;
      buttonText: string;
    };
    faq: {
      active: boolean;
      title: string;
      items: FaqItem[];
    };
    sticky_mobile_call: {
      active: boolean;
      crewStatus: string;
      buttonText: string;
    };
    footer: {
      active: boolean;
      address: string;
      copyright: string;
    };
  };

  // Local SEO & Metadata
  seo: {
    metaTitle: string;
    metaDescription: string;
    schemaType: string;
    geoCoordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export interface PageVersionSnapshot {
  id: string;
  timestamp: string;
  title: string;
  config: LandingPageConfig;
}
