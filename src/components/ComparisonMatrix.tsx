import { useState, useEffect, useCallback, useMemo } from 'react';

interface PlanData {
  name: string;
  slug: string;
  provider: string;
  badge: 'FREE' | 'PROMO' | 'PAID';
  price_monthly: number;
  promotional_price?: number | null;
  description: string;
  models: string[];
  limits: {
    requests_per_minute?: number | null;
    tokens_per_minute?: number | null;
    context_window?: number | null;
    daily_message_limit?: number | string | null;
  };
  features: string[];
  categories: string[];
  student_discount: boolean;
  startup_credits: boolean;
  tools_compatible: string[];
  community_score?: number;
  latency?: {
    average_ms?: number;
    uptime_percent?: number;
  };
}

interface Props {
  plans: PlanData[];
  initialSlugs?: string[];
}

const MAX_PLANS = 4;

const COMPARISON_ROWS: { key: string; label: string; getValue: (p: PlanData) => string }[] = [
  { key: 'price', label: 'Price (monthly)', getValue: p => p.price_monthly === 0 ? 'Free' : `$${p.price_monthly}` },
  { key: 'promo', label: 'Promo Price', getValue: p => p.promotional_price != null ? `$${p.promotional_price}` : '—' },
  { key: 'badge', label: 'Badge', getValue: p => p.badge },
  { key: 'models', label: 'Available Models', getValue: p => p.models.join(', ') || '—' },
  { key: 'context', label: 'Context Window', getValue: p => p.limits.context_window ? `${(p.limits.context_window / 1000).toFixed(0)}K` : '—' },
  { key: 'rpm', label: 'Requests/min', getValue: p => p.limits.requests_per_minute ? `${p.limits.requests_per_minute}` : '—' },
  { key: 'tpm', label: 'Tokens/min', getValue: p => p.limits.tokens_per_minute ? `${(p.limits.tokens_per_minute / 1000).toFixed(0)}K` : '—' },
  { key: 'daily', label: 'Daily Message Limit', getValue: p => p.limits.daily_message_limit?.toString() || '—' },
  { key: 'features', label: 'Features', getValue: p => p.features.join(', ') || '—' },
  { key: 'tools', label: 'Tool Compatibility', getValue: p => p.tools_compatible.join(', ') || '—' },
  { key: 'student', label: 'Student Discount', getValue: p => p.student_discount ? '✅ Yes' : '❌ No' },
  { key: 'community', label: 'Community Score', getValue: p => p.community_score != null ? `${p.community_score}/100` : '—' },
  { key: 'latency', label: 'Avg Latency', getValue: p => p.latency?.average_ms ? `${p.latency.average_ms}ms` : '—' },
  { key: 'uptime', label: 'Uptime', getValue: p => p.latency?.uptime_percent ? `${p.latency.uptime_percent}%` : '—' },
];

function getBestValueIndex(row: typeof COMPARISON_ROWS[0], selectedPlans: PlanData[]): number {
  const key = row.key;
  if (selectedPlans.length < 2) return -1;

  switch (key) {
    case 'price': {
      let bestIdx = 0;
      for (let i = 1; i < selectedPlans.length; i++) {
        if (selectedPlans[i].price_monthly < selectedPlans[bestIdx].price_monthly) bestIdx = i;
      }
      return bestIdx;
    }
    case 'context': {
      let bestIdx = -1;
      let bestVal = -1;
      for (let i = 0; i < selectedPlans.length; i++) {
        const v = selectedPlans[i].limits.context_window ?? 0;
        if (v > bestVal) { bestVal = v; bestIdx = i; }
      }
      return bestVal > 0 ? bestIdx : -1;
    }
    case 'community': {
      let bestIdx = -1;
      let bestVal = -1;
      for (let i = 0; i < selectedPlans.length; i++) {
        const v = selectedPlans[i].community_score ?? 0;
        if (v > bestVal) { bestVal = v; bestIdx = i; }
      }
      return bestVal > 0 ? bestIdx : -1;
    }
    case 'latency': {
      let bestIdx = -1;
      let bestVal = Infinity;
      for (let i = 0; i < selectedPlans.length; i++) {
        const v = selectedPlans[i].latency?.average_ms;
        if (v && v < bestVal) { bestVal = v; bestIdx = i; }
      }
      return bestVal < Infinity ? bestIdx : -1;
    }
    case 'uptime': {
      let bestIdx = -1;
      let bestVal = -1;
      for (let i = 0; i < selectedPlans.length; i++) {
        const v = selectedPlans[i].latency?.uptime_percent ?? 0;
        if (v > bestVal) { bestVal = v; bestIdx = i; }
      }
      return bestVal > 0 ? bestIdx : -1;
    }
    case 'student': {
      const hasStudent = selectedPlans.some(p => p.student_discount);
      if (!hasStudent) return -1;
      return selectedPlans.findIndex(p => p.student_discount);
    }
    default:
      return -1;
  }
}

export default function ComparisonMatrix({ plans, initialSlugs = [] }: Props) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync URL params
  useEffect(() => {
    const url = new URL(window.location.href);
    const plansParam = url.searchParams.get('plans');
    if (plansParam) {
      const slugs = plansParam.split(',').filter(s => plans.some(p => p.slug === s));
      if (slugs.length > 0) setSelectedSlugs(slugs.slice(0, MAX_PLANS));
    }
  }, [plans]);

  // Update URL when selection changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedSlugs.length > 0) {
      url.searchParams.set('plans', selectedSlugs.join(','));
    } else {
      url.searchParams.delete('plans');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedSlugs]);

  const selectedPlans = useMemo(
    () => selectedSlugs.map(slug => plans.find(p => p.slug === slug)!).filter(Boolean),
    [selectedSlugs, plans]
  );

  const filteredPlans = useMemo(
    () => plans.filter(p =>
      !selectedSlugs.includes(p.slug) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       p.provider.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [plans, selectedSlugs, searchQuery]
  );

  const addPlan = useCallback((slug: string) => {
    if (selectedSlugs.length < MAX_PLANS && !selectedSlugs.includes(slug)) {
      setSelectedSlugs(prev => [...prev, slug]);
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
  }, [selectedSlugs]);

  const removePlan = useCallback((slug: string) => {
    setSelectedSlugs(prev => prev.filter(s => s !== slug));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedSlugs([]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Plan Selector */}
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Select Plans to Compare</h2>
          {selectedSlugs.length > 0 && (
            <button onClick={clearAll} className="btn btn-ghost btn-xs text-error">
              Clear all
            </button>
          )}
        </div>

        {/* Selected Plan Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedPlans.map(plan => (
            <div key={plan.slug} className="badge badge-lg badge-primary gap-2 py-3">
              {plan.name}
              <button
                onClick={() => removePlan(plan.slug)}
                className="hover:opacity-70 cursor-pointer"
                aria-label={`Remove ${plan.name}`}
              >
                ✕
              </button>
            </div>
          ))}
          {selectedSlugs.length === 0 && (
            <p className="text-sm text-base-content/50">No plans selected. Use the search below to add plans.</p>
          )}
        </div>

        {/* Search / Add */}
        {selectedSlugs.length < MAX_PLANS && (
          <div className="relative">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={`Search plans to add (${selectedSlugs.length}/${MAX_PLANS} selected)...`}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                onFocus={() => setIsDropdownOpen(true)}
                className="input input-bordered w-full pl-10"
              />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 top-full mt-1 w-full bg-base-100 border border-base-300 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {filteredPlans.length === 0 ? (
                  <div className="p-3 text-sm text-base-content/50 text-center">No plans found</div>
                ) : (
                  filteredPlans.map(plan => (
                    <button
                      key={plan.slug}
                      onClick={() => addPlan(plan.slug)}
                      className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-center justify-between gap-2 border-b border-base-200 last:border-0 cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-sm">{plan.name}</span>
                        <span className="text-xs text-base-content/50 ml-2">{plan.provider}</span>
                      </div>
                      <span className={`badge badge-xs ${
                        plan.badge === 'FREE' ? 'badge-success' :
                        plan.badge === 'PROMO' ? 'badge-warning' : 'badge-info'
                      }`}>{plan.badge}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {selectedPlans.length >= 2 && (
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200/50">
                  <th className="font-bold text-sm sticky left-0 bg-base-200/50 z-10 min-w-[140px]">Feature</th>
                  {selectedPlans.map(plan => (
                    <th key={plan.slug} className="text-center min-w-[180px]">
                      <div className="flex flex-col items-center gap-1">
                        <a href={`/plans/${plan.slug}/`} className="font-bold text-sm hover:text-primary transition-colors">
                          {plan.name}
                        </a>
                        <span className={`badge badge-xs ${
                          plan.badge === 'FREE' ? 'badge-success' :
                          plan.badge === 'PROMO' ? 'badge-warning' : 'badge-info'
                        }`}>{plan.badge}</span>
                        <button
                          onClick={() => removePlan(plan.slug)}
                          className="btn btn-ghost btn-xs text-error opacity-60 hover:opacity-100"
                          aria-label={`Remove ${plan.name}`}
                        >
                          Remove
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(row => {
                  const bestIdx = getBestValueIndex(row, selectedPlans);
                  return (
                    <tr key={row.key} className="hover:bg-base-200/30">
                      <td className="font-medium text-sm text-base-content/70 sticky left-0 bg-base-100 z-10">{row.label}</td>
                      {selectedPlans.map((plan, idx) => (
                        <td
                          key={plan.slug}
                          className={`text-center text-sm ${
                            bestIdx === idx ? 'bg-success/10 font-semibold text-success' : ''
                          }`}
                        >
                          {row.key === 'features' || row.key === 'tools' || row.key === 'models' ? (
                            <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
                              {row.getValue(plan).split(', ').slice(0, 4).map((item, i) => (
                                <span key={i} className="badge badge-ghost badge-xs text-[10px]">{item}</span>
                              ))}
                              {row.getValue(plan).split(', ').length > 4 && (
                                <span className="badge badge-ghost badge-xs text-[10px]">+{row.getValue(plan).split(', ').length - 4}</span>
                              )}
                            </div>
                          ) : (
                            row.getValue(plan)
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state: 0 or 1 plan selected */}
      {selectedPlans.length < 2 && (
        <div className="text-center py-16 bg-base-200/30 rounded-2xl border border-base-300 border-dashed">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-base-content/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-base-content/50 text-lg font-medium">Select at least 2 plans to compare</p>
          <p className="text-base-content/40 text-sm mt-1">Use the search above to add plans to your comparison</p>
        </div>
      )}
    </div>
  );
}
