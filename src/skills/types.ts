export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'website' | 'outreach' | 'seo' | 'research' | 'geo' | 'forecast' | 'general';
  icon: string; // Lucide icon name
  inputs: Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    required: boolean;
    options?: string[];
    defaultValue?: any;
  }>;
  execute: (inputs: Record<string, any>, contractorId: string) => Promise<any>;
}
