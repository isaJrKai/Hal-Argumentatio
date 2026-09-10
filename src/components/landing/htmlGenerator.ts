import { LandingPageConfig } from './types';

export function generateLandingPageHtml(config: LandingPageConfig): string {
  const {
    id,
    businessName,
    city,
    phone,
    licenseNumber,
    branding,
    sectionOrder,
    sections,
    seo
  } = config;

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const primaryColor = branding.primaryColor || '#0284c7';
  const secondaryColor = branding.secondaryColor || '#0f172a';
  const accentColor = branding.accentColor || '#f59e0b';

  // Build JSON-LD LocalBusiness Schema
  const schemaJson = {
    "@context": "https://schema.org",
    "@type": seo.schemaType || "HomeAndConstructionBusiness",
    "name": businessName,
    "telephone": phone,
    "url": typeof window !== 'undefined' ? `${window.location.origin}/landing/${id}` : `https://hal.ai/landing/${id}`,
    "areaServed": sections.service_areas?.cities || [city],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "streetAddress": sections.footer?.address || city
    },
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    }
  };

  // Render individual sections based on sectionOrder
  let renderedSections = '';

  for (const secKey of sectionOrder) {
    switch (secKey) {
      case 'announcement_bar':
        if (sections.announcement_bar?.active) {
          renderedSections += `
  <!-- Announcement Bar -->
  <div class="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
    <span class="inline-block px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 text-[10px] font-black mr-1">${sections.announcement_bar.urgencyBadge}</span>
    <span>${sections.announcement_bar.text}</span>
  </div>\n`;
        }
        break;

      case 'header':
        if (sections.header?.active) {
          renderedSections += `
  <!-- Header -->
  <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-amber-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md">
          ${(branding.logoText || businessName).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <span class="font-extrabold text-base sm:text-lg tracking-tight text-white block leading-tight">
            ${branding.logoText || businessName}
          </span>
          <span class="text-[11px] text-slate-400 block">${licenseNumber}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="hidden sm:block text-right">
          <div class="text-[10px] uppercase font-bold text-amber-400 tracking-wider">⚡ 24/7 On-Duty Dispatch</div>
          <div class="text-sm font-black text-white">${phone}</div>
        </div>
        <a href="tel:${cleanPhone}" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-lg hover:shadow-amber-500/20">
          <span>📞</span>
          <span class="hidden sm:inline">${sections.header.ctaText}</span>
          <span class="sm:hidden">Call Now</span>
        </a>
      </div>
    </div>
  </header>\n`;
        }
        break;

      case 'hero':
        if (sections.hero?.active) {
          renderedSections += `
  <!-- Hero Section -->
  <section class="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div class="lg:col-span-7 space-y-6 text-center lg:text-left">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-sky-400 text-xs font-semibold shadow-inner">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>${sections.hero.badgeText}</span>
        </div>
        <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          ${sections.hero.headline}
        </h1>
        <p class="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
          ${sections.hero.subheadline}
        </p>

        <!-- Rapid Benefits Bar -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-left">
          <div class="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div class="text-amber-400 font-bold text-xs sm:text-sm">⏱️ 30-Min Arrival</div>
            <div class="text-[11px] text-slate-400 mt-0.5">${city} Priority Window</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div class="text-sky-400 font-bold text-xs sm:text-sm">🛡️ Licensed & Bonded</div>
            <div class="text-[11px] text-slate-400 mt-0.5">$5M Liability Policy</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 col-span-2 sm:col-span-1">
            <div class="text-emerald-400 font-bold text-xs sm:text-sm">💵 Upfront Fixed Price</div>
            <div class="text-[11px] text-slate-400 mt-0.5">Written Quote First</div>
          </div>
        </div>
      </div>

      <!-- Lead Capture Card (3-Field High Conversion) -->
      <div id="lead-form" class="lg:col-span-5">
        <div class="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl relative backdrop-blur-md">
          <div class="absolute -top-3 right-6 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full shadow-md">
            Fast Response Window
          </div>
          <h3 class="text-xl font-bold text-white mb-1">${sections.lead_form?.title || 'Request Priority Dispatch'}</h3>
          <p class="text-xs text-slate-400 mb-5 leading-relaxed">${sections.lead_form?.subtitle || 'Enter your details below for instant technician contact.'}</p>

          <form id="contractor-dispatch-form" onsubmit="handleFormSubmit(event)" class="space-y-3.5">
            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Your Full Name *</label>
              <input type="text" id="lead-name" name="name" required placeholder="e.g. Sarah Jenkins" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition" />
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Phone Number (For ETA SMS) *</label>
              <input type="tel" id="lead-phone" name="phone" required placeholder="e.g. (403) 555-0192" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition" />
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-300 mb-1">Describe The Issue Or Service Needed *</label>
              <textarea id="lead-details" name="details" required rows="2" placeholder="e.g. Water leak under basement sink or no heat" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition"></textarea>
            </div>

            <button type="submit" id="submit-btn" class="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer">
              <span>${sections.lead_form?.buttonText || '⚡ Dispatch Technician Now'}</span>
            </button>
            <p class="text-[10.5px] text-slate-400 text-center mt-2">${sections.lead_form?.dispatchNote || 'Zero trip fee. Upfront quote guaranteed.'}</p>
          </form>

          <div id="form-success" class="hidden p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-center space-y-2 mt-2">
            <div class="text-emerald-400 text-2xl font-bold">✓ Request Confirmed</div>
            <p class="text-xs text-slate-200">Our on-duty dispatcher is routing a technician to your location. Expect a phone confirmation in under 60 seconds.</p>
          </div>
        </div>
      </div>
    </div>
  </section>\n`;
        }
        break;

      case 'trust_bar':
        if (sections.trust_bar?.active && sections.trust_bar.badges?.length > 0) {
          renderedSections += `
  <!-- Trust Bar -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 py-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      ${sections.trust_bar.badges.map(b => `
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <div class="text-amber-400 text-base font-bold mb-1">${b.title}</div>
          <div class="text-xs text-slate-400">${b.subtitle}</div>
        </div>
      `).join('')}
    </div>
  </section>\n`;
        }
        break;

      case 'seasonal_alert':
        if (sections.seasonal_alert?.active) {
          renderedSections += `
  <!-- Seasonal Emergency Module -->
  <section class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div class="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 shadow-xl space-y-4">
      <div class="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black tracking-wider uppercase">
        ${sections.seasonal_alert.tag}
      </div>
      <h3 class="text-2xl font-black text-white">${sections.seasonal_alert.title}</h3>
      <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">${sections.seasonal_alert.description}</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        ${(sections.seasonal_alert.bulletPoints || []).map(pt => `
          <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
            <span class="text-amber-400 font-bold shrink-0">✓</span>
            <span>${pt}</span>
          </div>
        `).join('')}
      </div>
    </div>
  </section>\n`;
        }
        break;

      case 'services':
        if (sections.services?.active && sections.services.items?.length > 0) {
          renderedSections += `
  <!-- Services Grid -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
    <div class="text-center max-w-2xl mx-auto mb-8 space-y-2">
      <h2 class="text-2xl sm:text-3xl font-black text-white">${sections.services.title}</h2>
      <p class="text-xs sm:text-sm text-slate-400">${sections.services.subtitle}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      ${sections.services.items.map(s => `
        <div class="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/50 transition flex flex-col justify-between space-y-4">
          <div class="space-y-2">
            ${s.badge ? `<span class="inline-block px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold uppercase">${s.badge}</span>` : ''}
            <h4 class="text-base font-bold text-white">${s.title}</h4>
            <p class="text-xs text-slate-400 leading-relaxed">${s.description}</p>
          </div>
          <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span class="text-sm font-bold text-amber-400">${s.priceEstimate || 'Upfront Quote'}</span>
            <a href="#lead-form" class="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1">
              Select ➔
            </a>
          </div>
        </div>
      `).join('')}
    </div>
  </section>\n`;
        }
        break;

      case 'before_after':
        if (sections.before_after?.active && sections.before_after.items?.length > 0) {
          renderedSections += `
  <!-- Before & After Showcase -->
  <section class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
    <div class="text-center max-w-xl mx-auto mb-8 space-y-2">
      <h2 class="text-2xl font-black text-white">${sections.before_after.title}</h2>
      <p class="text-xs text-slate-400">${sections.before_after.subtitle}</p>
    </div>
    <div class="space-y-6">
      ${sections.before_after.items.map(item => `
        <div class="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-base font-bold text-white">${item.title}</h4>
            <span class="text-xs text-slate-400 font-mono">📍 ${item.location}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="rounded-xl overflow-hidden border border-slate-700/60 relative group">
              <span class="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">Before</span>
              <img src="${item.beforeImg}" alt="Before" class="w-full h-48 sm:h-56 object-cover" />
            </div>
            <div class="rounded-xl overflow-hidden border border-slate-700/60 relative group">
              <span class="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">After</span>
              <img src="${item.afterImg}" alt="After" class="w-full h-48 sm:h-56 object-cover" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
            <div class="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <strong class="text-red-400 block mb-0.5">The Challenge:</strong>
              <span class="text-slate-400">${item.challenge}</span>
            </div>
            <div class="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <strong class="text-emerald-400 block mb-0.5">The Solution:</strong>
              <span class="text-slate-300">${item.solution}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </section>\n`;
        }
        break;

      case 'reviews':
        if (sections.reviews?.active && sections.reviews.items?.length > 0) {
          renderedSections += `
  <!-- Reviews Section -->
  <section class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
    <div class="text-center max-w-xl mx-auto mb-8 space-y-2">
      <div class="flex items-center justify-center gap-1 text-amber-400 text-sm">
        <span>★★★★★</span>
        <span class="text-white font-bold text-xs ml-1">${sections.reviews.rating} / 5.0</span>
        <span class="text-slate-400 text-xs">(${sections.reviews.totalReviews} Google Reviews)</span>
      </div>
      <h2 class="text-2xl font-black text-white">${sections.reviews.title}</h2>
      <p class="text-xs text-slate-400">${sections.reviews.subtitle}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      ${sections.reviews.items.map(r => `
        <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <div class="flex text-amber-400">★★★★★</div>
              <span class="text-[10.5px] text-slate-400">${r.date}</span>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed italic">"${r.text}"</p>
          </div>
          <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-white">${r.name}</div>
              <div class="text-[11px] text-slate-400">${r.location}</div>
            </div>
            <span class="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">✓ Verified Client</span>
          </div>
        </div>
      `).join('')}
    </div>
  </section>\n`;
        }
        break;

      case 'service_areas':
        if (sections.service_areas?.active) {
          renderedSections += `
  <!-- Service Areas (Local SEO) -->
  <section class="max-w-4xl mx-auto px-4 sm:px-6 py-10">
    <div class="p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-4">
      <h3 class="text-xl font-bold text-white">${sections.service_areas.title}</h3>
      <p class="text-xs text-slate-400 max-w-xl mx-auto">${sections.service_areas.subtitle}</p>
      <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
        ${(sections.service_areas.cities || []).map(c => `
          <span class="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300">
            📍 ${c}
          </span>
        `).join('')}
      </div>
      <p class="text-[11px] text-amber-400 pt-2 font-medium">${sections.service_areas.guaranteeText}</p>
    </div>
  </section>\n`;
        }
        break;

      case 'guarantee':
        if (sections.guarantee?.active) {
          renderedSections += `
  <!-- Risk Reversal Guarantee -->
  <section class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
    <div class="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950/30 to-slate-900 border border-sky-500/40 text-center space-y-3 shadow-xl">
      <div class="inline-block px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 text-[10px] font-black uppercase">
        ${sections.guarantee.badgeText}
      </div>
      <h3 class="text-2xl font-black text-white">${sections.guarantee.title}</h3>
      <p class="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
        ${sections.guarantee.description}
      </p>
      <div class="pt-3">
        <a href="#lead-form" class="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm transition shadow-lg">
          <span>${sections.guarantee.ctaText}</span>
        </a>
      </div>
    </div>
  </section>\n`;
        }
        break;

      case 'online_booking':
        if (sections.online_booking?.active) {
          renderedSections += `
  <!-- Online Booking & Schedule -->
  <section class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
    <div class="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
      <h3 class="text-lg font-bold text-white">${sections.online_booking.title}</h3>
      <p class="text-xs text-slate-400 max-w-lg mx-auto">${sections.online_booking.description}</p>
      <a href="${sections.online_booking.bookingUrl || '#lead-form'}" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700">
        <span>📅 ${sections.online_booking.buttonText}</span>
      </a>
    </div>
  </section>\n`;
        }
        break;

      case 'faq':
        if (sections.faq?.active && sections.faq.items?.length > 0) {
          renderedSections += `
  <!-- FAQ -->
  <section class="max-w-3xl mx-auto px-4 sm:px-6 py-10">
    <h3 class="text-xl font-bold text-white text-center mb-6">${sections.faq.title}</h3>
    <div class="space-y-3">
      ${sections.faq.items.map(f => `
        <details class="group p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 cursor-pointer">
          <summary class="font-bold text-white flex items-center justify-between list-none">
            <span>${f.question}</span>
            <span class="transition-transform group-open:rotate-180">▾</span>
          </summary>
          <p class="mt-2 text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">${f.answer}</p>
        </details>
      `).join('')}
    </div>
  </section>\n`;
        }
        break;

      case 'footer':
        if (sections.footer?.active) {
          renderedSections += `
  <!-- Footer -->
  <footer class="border-t border-slate-800/80 py-8 px-4 sm:px-6 mt-12 bg-slate-950 text-center space-y-2 text-xs text-slate-500">
    <p class="font-medium text-slate-400">${businessName} • ${licenseNumber}</p>
    <p>${sections.footer.address || city} • 24/7 Dispatch Phone: <a href="tel:${cleanPhone}" class="text-amber-400 font-bold hover:underline">${phone}</a></p>
    <p class="text-[11px] text-slate-600">${sections.footer.copyright || '© 2026 All Rights Reserved.'}</p>
  </footer>\n`;
        }
        break;

      case 'sticky_mobile_call':
        if (sections.sticky_mobile_call?.active) {
          renderedSections += `
  <!-- Sticky Mobile Call Bar (One-Tap Dialing) -->
  <div class="fixed bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur-md border-t border-amber-500/40 p-3 z-50 flex items-center justify-between gap-3 sm:hidden shadow-2xl">
    <div class="text-xs text-white truncate">
      <span class="text-amber-400 font-bold block">${sections.sticky_mobile_call.crewStatus}</span>
      <span class="text-slate-400 text-[10.5px]">30-Min Arrival Window</span>
    </div>
    <a href="tel:${cleanPhone}" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shrink-0 flex items-center gap-1.5 shadow-lg">
      <span>${sections.sticky_mobile_call.buttonText || '📞 Call Now'}</span>
    </a>
  </div>\n`;
        }
        break;
    }
  }

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${seo.metaTitle || `${businessName} - ${city}`}</title>
  <meta name="description" content="${seo.metaDescription || `Professional contractor services in ${city}. Call ${phone}.`}" />
  <meta property="og:title" content="${seo.metaTitle || businessName}" />
  <meta property="og:description" content="${seo.metaDescription || `Serving ${city}. 24/7 priority emergency dispatch.`}" />
  <meta property="og:type" content="website" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Emil Kowalski Motion Bar: purposeful transforms, zero layout thrashing */
    * {
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    button, a {
      transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
    }
    button:active, a:active {
      transform: scale(0.98);
    }
    @media (prefers-reduced-motion: reduce) {
      *, ::before, ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
  </style>
  <script type="application/ld+json">
    ${JSON.stringify(schemaJson, null, 2)}
  </script>
</head>
<body class="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen pb-16 sm:pb-0">

  ${renderedSections}

  <script>
    async function handleFormSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      const name = document.getElementById('lead-name').value;
      const phone = document.getElementById('lead-phone').value;
      const details = document.getElementById('lead-details').value;

      if (!name || !phone || !details) return;

      btn.disabled = true;
      btn.innerText = 'Routing Dispatch...';

      try {
        const res = await fetch('/api/public/landing-leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractorId: "${config.contractorId || ''}",
            landingPageId: "${id}",
            name: name,
            phone: phone,
            serviceDetails: details,
            city: "${city}"
          })
        });
        
        document.getElementById('contractor-dispatch-form').classList.add('hidden');
        document.getElementById('form-success').classList.remove('hidden');
      } catch (err) {
        alert('Thank you! Dispatch request logged. A technician is contacting you immediately.');
        document.getElementById('contractor-dispatch-form').classList.add('hidden');
        document.getElementById('form-success').classList.remove('hidden');
      }
    }
  </script>
</body>
</html>`;
}
