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
  Layers,
  Sliders
} from 'lucide-react';
import { useInspector } from '../../context/InspectorContext';

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
  bento_features: { label: 'Bento Grid Capabilities & Metrics', iconName: 'Grid' },
  pricing_packages: { label: 'Transparent Pricing Packages', iconName: 'Tag' },
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
  const [polishingSection, setPolishingSection] = useState<string | null>(null);
  const [quickPromptSection, setQuickPromptSection] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const { openInspector } = useInspector();

  const handleRegenerateSection = async (secKey: string) => {
    setPolishingSection(secKey);
    try {
      const res = await fetch('/api/landing-pages/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: secKey,
          trade: config.trade || 'plumbing',
          businessName: config.businessName,
          city: config.city,
          currentSectionData: (config.sections as any)[secKey],
          customPrompt: customPrompt.trim() || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedSection = data?.updatedData || data?.sectionData;
        if (data && updatedSection) {
          onChange({
            ...config,
            sections: {
              ...config.sections,
              [secKey]: {
                ...(config.sections as any)[secKey],
                ...updatedSection
              }
            }
          });
          setQuickPromptSection(null);
          setCustomPrompt('');
        }
      }
    } catch (err) {
      console.error('Failed to regenerate section:', err);
    } finally {
      setPolishingSection(null);
    }
  };

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
      <div className="flex items-center justify-between pb-2 border-b border-border-dim">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Page Layout & Section Reordering
          </h4>
        </div>
        <span className="text-[10px] text-text-secondary">
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
                    ? 'border-amber-400/80 bg-bg-raised shadow-md'
                    : 'border-border-dim bg-bg-raised/50 hover:border-border-dim'
                  : 'border-border-dim/50 bg-bg-base/40 opacity-60'
              }`}
            >
              {/* Header Bar for Section */}
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setExpandedSection(isExpanded ? null : secKey)}
                    className="text-text-secondary hover:text-text-primary p-1 rounded transition"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <span className="text-xs font-semibold text-text-primary truncate">
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
                    className="p-1 rounded text-text-secondary hover:text-text-primary disabled:opacity-30 transition"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Move Down"
                    disabled={idx === config.sectionOrder.length - 1}
                    onClick={() => moveSection(idx, 'down')}
                    className="p-1 rounded text-text-secondary hover:text-text-primary disabled:opacity-30 transition"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* AI Polish Button */}
                  <button
                    type="button"
                    title="AI Polish Section with Gemini"
                    disabled={polishingSection === secKey}
                    onClick={() => {
                      if (quickPromptSection === secKey) {
                        setQuickPromptSection(null);
                      } else {
                        setQuickPromptSection(secKey);
                      }
                    }}
                    className={`p-1 px-1.5 rounded text-xs transition flex items-center gap-1 ${
                      polishingSection === secKey
                        ? 'text-amber-400 bg-amber-400/20 animate-pulse'
                        : quickPromptSection === secKey
                        ? 'bg-amber-400/20 text-amber-300'
                        : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-400/10'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline font-semibold">
                      {polishingSection === secKey ? 'Polishing...' : 'AI Polish'}
                    </span>
                  </button>

                  {/* Active Toggle */}
                  <button
                    type="button"
                    title={isActive ? 'Hide Section' : 'Show Section'}
                    onClick={() => toggleSectionActive(secKey)}
                    className={`p-1 rounded transition ml-1 ${
                      isActive ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-text-secondary'
                    }`}
                  >
                    {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Inspector Sidebar Toggle */}
                  <button
                    type="button"
                    title="Inspect in Workspace Sidebar"
                    onClick={() => openInspector('landing_section', meta.label, { sectionKey: secKey, sectionData: secData })}
                    className="p-1 rounded text-text-secondary hover:text-amber-400 transition"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick AI Polish Input Bar */}
              {quickPromptSection === secKey && (
                <div className="px-3 py-2 border-t border-border-dim bg-amber-500/10 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Instructions (e.g., 'Make punchier for frozen pipe emergencies') or leave blank for auto-polish..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRegenerateSection(secKey);
                    }}
                    className="flex-1 px-2.5 py-1 text-xs rounded bg-bg-base border border-border-dim text-text-primary placeholder-text-tertiary focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    disabled={polishingSection === secKey}
                    onClick={() => handleRegenerateSection(secKey)}
                    className="px-2.5 py-1 text-xs rounded bg-amber-500 hover:bg-amber-400 text-accent-contrast font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{polishingSection === secKey ? 'Polishing...' : 'Polish'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPromptSection(null)}
                    className="text-text-secondary hover:text-text-primary text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Expandable Form for Specific Section Fields */}
              {isExpanded && isActive && (
                <div className="p-4 border-t border-border-dim/80 bg-bg-base/60 space-y-3 text-xs">
                  {secKey === 'hero' && (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] text-text-secondary font-semibold mb-1">
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
                          className="w-full px-3 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-secondary font-semibold mb-1">
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
                          className="w-full px-3 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-secondary font-semibold mb-1">
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
                          className="w-full px-3 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  {secKey === 'seasonal_alert' && (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] text-text-secondary font-semibold mb-1">
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
                          className="w-full px-3 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-secondary font-semibold mb-1">
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
                          className="w-full px-3 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-secondary font-semibold mb-1">
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
                          className="w-full px-3 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  {secKey === 'services' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-text-secondary font-semibold">Service Cards</span>
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
                        <div key={srv.id} className="p-2.5 rounded-lg bg-bg-raised border border-border-dim space-y-2">
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
                              className="font-bold text-text-primary bg-transparent border-b border-border-dim focus:outline-none focus:border-amber-400 text-xs flex-1"
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
                              className="px-2 py-1 rounded bg-bg-base border border-border-dim text-[11px] text-amber-400"
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
                              className="px-2 py-1 rounded bg-bg-base border border-border-dim text-[11px] text-text-secondary"
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
                            className="w-full px-2 py-1 rounded bg-bg-base border border-border-dim text-[11px] text-text-secondary"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {secKey === 'service_areas' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] text-text-secondary font-semibold">
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
                        className="w-full px-3 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {secKey === 'announcement_bar' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] text-text-secondary font-semibold">
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
                        className="w-full px-3 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {secKey === 'guarantee' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] text-text-secondary font-semibold">
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
                        className="w-full px-3 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {secKey === 'bento_features' && config.sections.bento_features && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-text-secondary font-semibold mb-1">Badge</label>
                          <input
                            type="text"
                            value={config.sections.bento_features.badge || ''}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                sections: {
                                  ...config.sections,
                                  bento_features: { ...config.sections.bento_features!, badge: e.target.value }
                                }
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-text-secondary font-semibold mb-1">Headline</label>
                          <input
                            type="text"
                            value={config.sections.bento_features.title || ''}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                sections: {
                                  ...config.sections,
                                  bento_features: { ...config.sections.bento_features!, title: e.target.value }
                                }
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-secondary font-semibold mb-1">Subheadline</label>
                        <input
                          type="text"
                          value={config.sections.bento_features.subtitle || ''}
                          onChange={(e) =>
                            onChange({
                              ...config,
                              sections: {
                                ...config.sections,
                                bento_features: { ...config.sections.bento_features!, subtitle: e.target.value }
                              }
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="pt-2 border-t border-border-dim">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-text-secondary font-semibold">Bento Cards</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [
                                ...(config.sections.bento_features?.items || []),
                                {
                                  id: 'bento_' + Date.now(),
                                  title: 'New Capability',
                                  subtitle: 'Verified dispatch performance metric.',
                                  value: '100%',
                                  tag: 'Reliability',
                                  icon: '⚡',
                                  colSpan: '1' as const
                                }
                              ];
                              onChange({
                                ...config,
                                sections: {
                                  ...config.sections,
                                  bento_features: { ...config.sections.bento_features!, items: newItems }
                                }
                              });
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Bento Card
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(config.sections.bento_features.items || []).map((item, bIdx) => (
                            <div key={item.id} className="p-2.5 rounded-lg bg-bg-raised border border-border-dim space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={item.title}
                                  placeholder="Title"
                                  onChange={(e) => {
                                    const updated = [...config.sections.bento_features!.items];
                                    updated[bIdx].title = e.target.value;
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        bento_features: { ...config.sections.bento_features!, items: updated }
                                      }
                                    });
                                  }}
                                  className="font-bold text-text-primary bg-transparent border-b border-border-dim text-xs flex-1 focus:outline-none focus:border-amber-400"
                                />
                                <select
                                  value={item.colSpan || '1'}
                                  onChange={(e) => {
                                    const updated = [...config.sections.bento_features!.items];
                                    updated[bIdx].colSpan = e.target.value as any;
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        bento_features: { ...config.sections.bento_features!, items: updated }
                                      }
                                    });
                                  }}
                                  className="bg-bg-base border border-border-dim text-[10px] rounded px-1.5 py-0.5 text-text-secondary"
                                >
                                  <option value="1">Span 1</option>
                                  <option value="2">Span 2 (Wide)</option>
                                  <option value="3">Span 3 (Full)</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = config.sections.bento_features!.items.filter((_, i) => i !== bIdx);
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        bento_features: { ...config.sections.bento_features!, items: updated }
                                      }
                                    });
                                  }}
                                  className="text-red-400 hover:text-red-300 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={item.subtitle}
                                placeholder="Subtitle / explanation"
                                onChange={(e) => {
                                  const updated = [...config.sections.bento_features!.items];
                                  updated[bIdx].subtitle = e.target.value;
                                  onChange({
                                    ...config,
                                    sections: {
                                      ...config.sections,
                                      bento_features: { ...config.sections.bento_features!, items: updated }
                                    }
                                  });
                                }}
                                className="w-full px-2 py-1 rounded bg-bg-base border border-border-dim text-[11px] text-text-secondary"
                              />
                              <div className="grid grid-cols-3 gap-1.5">
                                <input
                                  type="text"
                                  value={item.value || ''}
                                  placeholder="Metric / Value"
                                  onChange={(e) => {
                                    const updated = [...config.sections.bento_features!.items];
                                    updated[bIdx].value = e.target.value;
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        bento_features: { ...config.sections.bento_features!, items: updated }
                                      }
                                    });
                                  }}
                                  className="px-2 py-1 rounded bg-bg-base border border-border-dim text-[10px] text-amber-400 font-bold"
                                />
                                <input
                                  type="text"
                                  value={item.tag || ''}
                                  placeholder="Tag / Category"
                                  onChange={(e) => {
                                    const updated = [...config.sections.bento_features!.items];
                                    updated[bIdx].tag = e.target.value;
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        bento_features: { ...config.sections.bento_features!, items: updated }
                                      }
                                    });
                                  }}
                                  className="px-2 py-1 rounded bg-bg-base border border-border-dim text-[10px] text-text-secondary"
                                />
                                <input
                                  type="text"
                                  value={item.icon || ''}
                                  placeholder="Icon (e.g. ⚡)"
                                  onChange={(e) => {
                                    const updated = [...config.sections.bento_features!.items];
                                    updated[bIdx].icon = e.target.value;
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        bento_features: { ...config.sections.bento_features!, items: updated }
                                      }
                                    });
                                  }}
                                  className="px-2 py-1 rounded bg-bg-base border border-border-dim text-[10px] text-text-secondary"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {secKey === 'pricing_packages' && config.sections.pricing_packages && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-text-secondary font-semibold mb-1">Badge</label>
                          <input
                            type="text"
                            value={config.sections.pricing_packages.badge || ''}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                sections: {
                                  ...config.sections,
                                  pricing_packages: { ...config.sections.pricing_packages!, badge: e.target.value }
                                }
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-text-secondary font-semibold mb-1">Headline</label>
                          <input
                            type="text"
                            value={config.sections.pricing_packages.title || ''}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                sections: {
                                  ...config.sections,
                                  pricing_packages: { ...config.sections.pricing_packages!, title: e.target.value }
                                }
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-secondary font-semibold mb-1">Subheadline</label>
                        <input
                          type="text"
                          value={config.sections.pricing_packages.subtitle || ''}
                          onChange={(e) =>
                            onChange({
                              ...config,
                              sections: {
                                ...config.sections,
                                pricing_packages: { ...config.sections.pricing_packages!, subtitle: e.target.value }
                              }
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-bg-raised border border-border-dim text-text-primary text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="pt-2 border-t border-border-dim">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-text-secondary font-semibold">Pricing Packages</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = [
                                ...(config.sections.pricing_packages?.items || []),
                                {
                                  id: 'pkg_' + Date.now(),
                                  name: 'Standard Package',
                                  price: '$199',
                                  period: 'flat rate',
                                  popular: false,
                                  tagline: 'Standard diagnostic and repair',
                                  features: ['Full diagnostic inspection', 'Written upfront quote', '1-year warranty'],
                                  ctaText: 'Select Package'
                                }
                              ];
                              onChange({
                                ...config,
                                sections: {
                                  ...config.sections,
                                  pricing_packages: { ...config.sections.pricing_packages!, items: newItems }
                                }
                              });
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Package
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(config.sections.pricing_packages.items || []).map((tier, pIdx) => (
                            <div key={tier.id} className="p-2.5 rounded-lg bg-bg-raised border border-border-dim space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={tier.name}
                                  placeholder="Package Name"
                                  onChange={(e) => {
                                    const updated = [...config.sections.pricing_packages!.items];
                                    updated[pIdx].name = e.target.value;
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        pricing_packages: { ...config.sections.pricing_packages!, items: updated }
                                      }
                                    });
                                  }}
                                  className="font-bold text-text-primary bg-transparent border-b border-border-dim text-xs flex-1 focus:outline-none focus:border-amber-400"
                                />
                                <label className="flex items-center gap-1 text-[10px] text-amber-400 font-medium cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={tier.popular || false}
                                    onChange={(e) => {
                                      const updated = [...config.sections.pricing_packages!.items];
                                      updated[pIdx].popular = e.target.checked;
                                      onChange({
                                        ...config,
                                        sections: {
                                          ...config.sections,
                                          pricing_packages: { ...config.sections.pricing_packages!, items: updated }
                                        }
                                      });
                                    }}
                                    className="rounded border-border-dim"
                                  />
                                  <span>Popular</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = config.sections.pricing_packages!.items.filter((_, i) => i !== pIdx);
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        pricing_packages: { ...config.sections.pricing_packages!, items: updated }
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
                                  value={tier.price}
                                  placeholder="Price (e.g. $149)"
                                  onChange={(e) => {
                                    const updated = [...config.sections.pricing_packages!.items];
                                    updated[pIdx].price = e.target.value;
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        pricing_packages: { ...config.sections.pricing_packages!, items: updated }
                                      }
                                    });
                                  }}
                                  className="px-2 py-1 rounded bg-bg-base border border-border-dim text-[11px] text-amber-400 font-bold"
                                />
                                <input
                                  type="text"
                                  value={tier.period || ''}
                                  placeholder="Period (e.g. flat rate)"
                                  onChange={(e) => {
                                    const updated = [...config.sections.pricing_packages!.items];
                                    updated[pIdx].period = e.target.value;
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        pricing_packages: { ...config.sections.pricing_packages!, items: updated }
                                      }
                                    });
                                  }}
                                  className="px-2 py-1 rounded bg-bg-base border border-border-dim text-[11px] text-text-secondary"
                                />
                              </div>
                              <input
                                type="text"
                                value={tier.tagline}
                                placeholder="Tagline"
                                onChange={(e) => {
                                  const updated = [...config.sections.pricing_packages!.items];
                                  updated[pIdx].tagline = e.target.value;
                                  onChange({
                                    ...config,
                                    sections: {
                                      ...config.sections,
                                      pricing_packages: { ...config.sections.pricing_packages!, items: updated }
                                    }
                                  });
                                }}
                                className="w-full px-2 py-1 rounded bg-bg-base border border-border-dim text-[11px] text-text-secondary"
                              />
                              <div>
                                <label className="block text-[10px] text-text-secondary mb-1">Features (one per line)</label>
                                <textarea
                                  rows={2}
                                  value={(tier.features || []).join('\n')}
                                  onChange={(e) => {
                                    const updated = [...config.sections.pricing_packages!.items];
                                    updated[pIdx].features = e.target.value.split('\n').filter(Boolean);
                                    onChange({
                                      ...config,
                                      sections: {
                                        ...config.sections,
                                        pricing_packages: { ...config.sections.pricing_packages!, items: updated }
                                      }
                                    });
                                  }}
                                  className="w-full px-2 py-1 rounded bg-bg-base border border-border-dim text-[11px] text-text-secondary"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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
