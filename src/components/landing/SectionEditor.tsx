import React, { useState } from 'react';
import { LandingPageConfig } from './types';
import { 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2,
  Sparkles,
  Shield,
  Layers
} from 'lucide-react';

interface SectionEditorProps {
  config: LandingPageConfig;
  onChange: (updated: LandingPageConfig) => void;
}

const SECTION_LABELS: Record<string, { label: string; iconName: string }> = {
  announcement_bar: { label: 'Top Emergency Announcement Bar', iconName: 'AlertCircle' },
  header: { label: 'Navigation & Sticky Phone Header', iconName: 'Menu' },
  hero: { label: 'Hero Headline & 3-Field Lead Form', iconName: 'Star' },
  trust_bar: { label: 'Authority Trust Badges (4x)', iconName: 'Shield' },
  seasonal_alert: { label: 'Seasonal Emergency / Weather Module', iconName: 'CloudRain' },
  services: { label: 'Core Trade Services Grid', iconName: 'Wrench' },
  before_after: { label: 'Before & After Project Showcase', iconName: 'Image' },
  reviews: { label: 'Verified Google 5-Star Reviews', iconName: 'CheckCircle' },
  service_areas: { label: 'Neighborhood Service Areas (Local SEO)', iconName: 'MapPin' },
  guarantee: { label: 'Ironclad Risk-Reversal Guarantee', iconName: 'Award' },
  online_booking: { label: 'Calendar Online Booking Link', iconName: 'Calendar' },
  faq: { label: 'Frequently Asked Questions', iconName: 'HelpCircle' },
  footer: { label: 'Footer & License Notice', iconName: 'FileText' },
  sticky_mobile_call: { label: 'Sticky Mobile "Call Now" Button', iconName: 'Phone' }
};

export const SectionEditor: React.FC<SectionEditorProps> = ({ config, onChange }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('hero');

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...config.sectionOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    onChange({
      ...config,
      sectionOrder: newOrder
    });
  };

  const toggleSectionActive = (secKey: string) => {
    const currentSections = { ...config.sections } as any;
    if (currentSections[secKey]) {
      currentSections[secKey] = {
        ...currentSections[secKey],
        active: !currentSections[secKey].active
      };
      onChange({
        ...config,
        sections: currentSections
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Page Layout & Section Reordering
          </h4>
        </div>
        <span className="text-[10px] text-slate-400">
          Drag & arrange high-converting sections
        </span>
      </div>

      <div className="space-y-2">
        {config.sectionOrder.map((secKey, idx) => {
          const meta = SECTION_LABELS[secKey] || { label: secKey, iconName: 'Box' };
          const secData = (config.sections as any)[secKey];
          const isActive = secData?.active ?? true;
          const isExpanded = expandedSection === secKey;

          return (
            <div
              key={secKey}
              className={`rounded-xl border transition ${
                isActive
                  ? isExpanded
                    ? 'border-amber-400/80 bg-slate-900 shadow-md'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  : 'border-slate-800/50 bg-slate-950/40 opacity-60'
              }`}
            >
              {/* Header Bar for Section */}
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(isExpanded ? null : secKey)}
                    className="text-slate-400 hover:text-white p-1 rounded transition"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <span className="text-xs font-semibold text-white truncate">
                    {meta.label}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Reorder Buttons */}
                  <button
                    type="button"
                    title="Move Up"
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, 'up')}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Move Down"
                    disabled={idx === config.sectionOrder.length - 1}
                    onClick={() => moveSection(idx, 'down')}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Active Toggle */}
                  <button
                    type="button"
                    title={isActive ? 'Hide Section' : 'Show Section'}
                    onClick={() => toggleSectionActive(secKey)}
                    className={`p-1 rounded transition ml-1 ${
                      isActive ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Form for Specific Section Fields */}
              {isExpanded && isActive && (
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3 text-xs">
                  {secKey === 'hero' && (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Hero Main Headline
                        </label>
                        <input
                          type="text"
                          value={config.sections.hero.headline}
                          onChange={(e) =>
                            onChange({
                              ...config,
                              sections: {
                                ...config.sections,
                                hero: { ...config.sections.hero, headline: e.target.value }
                              }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Sub-headline / Dispatch Promise
                        </label>
                        <textarea
                          rows={2}
                          value={config.sections.hero.subheadline}
                          onChange={(e) =>
                            onChange({
                              ...config,
                              sections: {
                                ...config.sections,
                                hero: { ...config.sections.hero, subheadline: e.target.value }
                              }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Authority Pill Badge
                        </label>
                        <input
                          type="text"
                          value={config.sections.hero.badgeText}
                          onChange={(e) =>
                            onChange({
                              ...config,
                              sections: {
                                ...config.sections,
                                hero: { ...config.sections.hero, badgeText: e.target.value }
                              }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  {secKey === 'seasonal_alert' && (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Emergency Tag (e.g. Winter Freeze / Hail Storm)
                        </label>
                        <input
                          type="text"
                          value={config.sections.seasonal_alert.tag}
                          onChange={(e) =>
                            onChange({
                              ...config,
                              sections: {
                                ...config.sections,
                                seasonal_alert: { ...config.sections.seasonal_alert, tag: e.target.value }
                              }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Alert Headline
                        </label>
                        <input
                          type="text"
                          value={config.sections.seasonal_alert.title}
                          onChange={(e) =>
                            onChange({
                              ...config,
                              sections: {
                                ...config.sections,
                                seasonal_alert: { ...config.sections.seasonal_alert, title: e.target.value }
                              }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Homeowner Advisory Details
                        </label>
                        <textarea
                          rows={2}
                          value={config.sections.seasonal_alert.description}
                          onChange={(e) =>
                            onChange({
                              ...config,
                              sections: {
                                ...config.sections,
                                seasonal_alert: { ...config.sections.seasonal_alert, description: e.target.value }
                              }
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  {secKey === 'services' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-semibold">Service Cards</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = [
                              ...config.sections.services.items,
                              {
                                id: 's_' + Date.now(),
                                title: 'New Service',
                                description: 'Description of scope & code compliance.',
                                priceEstimate: 'From $199 flat',
                                badge: 'Popular'
                              }
                            ];
                            onChange({
                              ...config,
                              sections: {
                                ...config.sections,
                                services: { ...config.sections.services, items: newItems }
                              }
                            });
                          }}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Service
                        </button>
                      </div>

                      {config.sections.services.items.map((srv, sIdx) => (
                        <div key={srv.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={srv.title}
                              onChange={(e) => {
                                const updated = [...config.sections.services.items];
                                updated[sIdx].title = e.target.value;
                                onChange({
                                  ...config,
                                  sections: {
                                    ...config.sections,
                                    services: { ...config.sections.services, items: updated }
                                  }
                                });
                              }}
                              className="font-bold text-white bg-transparent border-b border-slate-700 focus:outline-none focus:border-amber-400 text-xs flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = config.sections.services.items.filter((_, i) => i !== sIdx);
                                onChange({
                                  ...config,
                                  sections: {
                                    ...config.sections,
                                    services: { ...config.sections.services, items: updated }
                                  }
                                });
                              }}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={srv.priceEstimate || ''}
                              placeholder="Price estimate"
                              onChange={(e) => {
                                const updated = [...config.sections.services.items];
                                updated[sIdx].priceEstimate = e.target.value;
                                onChange({
                                  ...config,
                                  sections: {
                                    ...config.sections,
                                    services: { ...config.sections.services, items: updated }
                                  }
                                });
                              }}
                              className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-amber-400"
                            />
                            <input
                              type="text"
                              value={srv.badge || ''}
                              placeholder="Badge (e.g. Urgent)"
                              onChange={(e) => {
                                const updated = [...config.sections.services.items];
                                updated[sIdx].badge = e.target.value;
                                onChange({
                                  ...config,
                                  sections: {
                                    ...config.sections,
                                    services: { ...config.sections.services, items: updated }
                                  }
                                });
                              }}
                              className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={srv.description}
                            onChange={(e) => {
                              const updated = [...config.sections.services.items];
                              updated[sIdx].description = e.target.value;
                              onChange({
                                ...config,
                                sections: {
                                  ...config.sections,
                                  services: { ...config.sections.services, items: updated }
                                }
                              });
                            }}
                            className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {secKey === 'service_areas' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] text-slate-400 font-semibold">
                        Neighborhoods & Cities (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={config.sections.service_areas.cities.join(', ')}
                        onChange={(e) => {
                          const parsed = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                          onChange({
                            ...config,
                            sections: {
                              ...config.sections,
                              service_areas: { ...config.sections.service_areas, cities: parsed }
                            }
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {secKey === 'announcement_bar' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] text-slate-400 font-semibold">
                        Emergency Top Text
                      </label>
                      <input
                        type="text"
                        value={config.sections.announcement_bar.text}
                        onChange={(e) =>
                          onChange({
                            ...config,
                            sections: {
                              ...config.sections,
                              announcement_bar: { ...config.sections.announcement_bar, text: e.target.value }
                            }
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {secKey === 'guarantee' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] text-slate-400 font-semibold">
                        Risk-Reversal Guarantee Statement
                      </label>
                      <textarea
                        rows={2}
                        value={config.sections.guarantee.description}
                        onChange={(e) =>
                          onChange({
                            ...config,
                            sections: {
                              ...config.sections,
                              guarantee: { ...config.sections.guarantee, description: e.target.value }
                            }
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
