import { Skill } from './types';

export const seoSchemaGeneratorSkill: Skill = {
  id: 'seo_schema_generator',
  name: 'Local SEO Schema Generator',
  description: 'Builds JSON-LD LocalBusiness structured data only from supplied business details. It does not claim ranking improvements or invent missing contact, location, image, or website data.',
  category: 'seo',
  icon: 'Search',
  inputs: [
    { name: 'businessName', label: 'Business Name', type: 'string', required: true, defaultValue: '' },
    { name: 'serviceType', label: 'Business Category / Niche', type: 'string', required: true, defaultValue: '' },
    { name: 'city', label: 'City / Locality', type: 'string', required: true, defaultValue: '' },
    { name: 'phone', label: 'Business Telephone', type: 'string', required: false, defaultValue: '' },
    { name: 'websiteUrl', label: 'Official Website URL', type: 'string', required: false, defaultValue: '' },
    { name: 'country', label: 'Country', type: 'string', required: false, defaultValue: '' },
    { name: 'streetAddress', label: 'Street Address', type: 'string', required: false, defaultValue: '' },
    { name: 'postalCode', label: 'Postal Code', type: 'string', required: false, defaultValue: '' }
  ],
  execute: async (inputs) => {
    const businessName = String(inputs.businessName || '').trim();
    const serviceType = String(inputs.serviceType || '').trim();
    const city = String(inputs.city || '').trim();
    const phone = String(inputs.phone || '').trim();
    const websiteUrl = String(inputs.websiteUrl || '').trim();
    const country = String(inputs.country || '').trim();
    const streetAddress = String(inputs.streetAddress || '').trim();
    const postalCode = String(inputs.postalCode || '').trim();

    if (!businessName || !serviceType || !city) {
      throw new Error('Business Name, Category, and City are required.');
    }

    let normalizedWebsite: string | undefined;
    if (websiteUrl) {
      let parsed: URL;
      try {
        parsed = new URL(websiteUrl);
      } catch {
        throw new Error('Enter a valid official website URL or leave the field blank.');
      }
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
        throw new Error('The official website must be a public HTTP(S) URL without embedded credentials.');
      }
      normalizedWebsite = parsed.toString();
    }

    const normalizedCategory = serviceType.toLowerCase();
    const schemaType = normalizedCategory.includes('plumb')
      ? 'Plumber'
      : normalizedCategory.includes('hvac') || normalizedCategory.includes('air conditioning')
        ? 'HVACBusiness'
        : 'LocalBusiness';

    const address: Record<string, string> = {
      '@type': 'PostalAddress',
      addressLocality: city
    };
    if (streetAddress) address.streetAddress = streetAddress;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.addressCountry = country;

    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: businessName,
      address
    };
    if (phone) schema.telephone = phone;
    if (normalizedWebsite) schema.url = normalizedWebsite;

    const report = [
      '### JSON-LD LocalBusiness schema',
      '',
      '```json',
      JSON.stringify(schema, null, 2),
      '```',
      '',
      '### Deployment notes',
      '- Confirm every supplied business detail against the official business source before publishing.',
      '- Add a real logo/image only when the business owns or is authorized to use that image.',
      '- Do not add coordinates, opening hours, prices, ratings, reviews, or service areas unless those values are verified.',
      '- Validate the final page and structured data with an appropriate schema validator after deployment.',
      '',
      '**Evidence boundary:** This markup contains only the information supplied to HAL. Structured data does not guarantee Google Maps placement, search ranking, traffic, or a ranking uplift.'
    ].join('\n');

    return {
      success: true,
      businessName,
      serviceType,
      city,
      schema,
      evidenceStatus: 'user_supplied_business_details',
      report,
      executedAt: new Date().toISOString()
    };
  }
};
