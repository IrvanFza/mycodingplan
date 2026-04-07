import { useState, useEffect, useMemo, useCallback } from 'react';

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
}

type PriceRange = 'all' | 'free' | '0-10' | '10-20' | '20-50' | '50+';
type BadgeType = 'all' | 'FREE' | 'PROMO' | 'PAID';

interface FilterState {
  priceRange: PriceRange;
  badge: BadgeType;
  providers: string[];
  categories: string[];
  studentDiscount: boolean | null;
  startupCredits: boolean | null;
  toolsCompatible: string[];
}

const PRICE_RANGES: { value: PriceRange; label: string }[] = [
  { value: 'all', label: 'All Prices' },
  { value: 'free', label: 'Free' },
  { value: '0-10', label: '$0–10' },
  { value: '10-20', label: '$10–20' },
  { value: '20-50', label: '$20–50' },
  { value: '50+', label: '$50+' },
];

const BADGE_OPTIONS: { value: BadgeType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'FREE', label: 'Free' },
  { value: 'PROMO', label: 'Promo' },
  { value: 'PAID', label: 'Paid' },
];

const DEFAULT_FILTERS: FilterState = {
  priceRange: 'all',
  badge: 'all',
  providers: [],
  categories: [],
  studentDiscount: null,
  startupCredits: null,
  toolsCompatible: [],
};

function priceInRange(price: number, range: PriceRange): boolean {
  switch (range) {
    case 'all': return true;
    case 'free': return price === 0;
    case '0-10': return price >= 0 && price <= 10;
    case '10-20': return price > 10 && price <= 20;
    case '20-50': return price > 20 && price <= 50;
    case '50+': return price > 50;
    default: return true;
  }
}

export default function FilterBar({ plans }: Props) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique values
  const allProviders = useMemo(() => [...new Set(plans.map(p => p.provider))].sort(), [plans]);
  const allCategories = useMemo(() => [...new Set(plans.flatMap(p => p.categories))].sort(), [plans]);
  const allTools = useMemo(() => [...new Set(plans.flatMap(p => p.tools_compatible))].sort(), [plans]);

  // Parse URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const newFilters = { ...DEFAULT_FILTERS };

    const price = url.searchParams.get('price') as PriceRange;
    if (price && PRICE_RANGES.some(p => p.value === price)) newFilters.priceRange = price;

    const badge = url.searchParams.get('badge') as BadgeType;
    if (badge && BADGE_OPTIONS.some(b => b.value === badge)) newFilters.badge = badge;

    const providers = url.searchParams.get('providers');
    if (providers) newFilters.providers = providers.split(',');

    const categories = url.searchParams.get('categories');
    if (categories) newFilters.categories = categories.split(',');

    const tools = url.searchParams.get('tools');
    if (tools) newFilters.toolsCompatible = tools.split(',');

    const student = url.searchParams.get('student');
    if (student === 'true') newFilters.studentDiscount = true;
    else if (student === 'false') newFilters.studentDiscount = false;

    const startup = url.searchParams.get('startup');
    if (startup === 'true') newFilters.startupCredits = true;
    else if (startup === 'false') newFilters.startupCredits = false;

    setFilters(newFilters);
  }, []);

  // Sync URL
  useEffect(() => {
    const url = new URL(window.location.href);

    if (filters.priceRange !== 'all') url.searchParams.set('price', filters.priceRange);
    else url.searchParams.delete('price');

    if (filters.badge !== 'all') url.searchParams.set('badge', filters.badge);
    else url.searchParams.delete('badge');

    if (filters.providers.length > 0) url.searchParams.set('providers', filters.providers.join(','));
    else url.searchParams.delete('providers');

    if (filters.categories.length > 0) url.searchParams.set('categories', filters.categories.join(','));
    else url.searchParams.delete('categories');

    if (filters.toolsCompatible.length > 0) url.searchParams.set('tools', filters.toolsCompatible.join(','));
    else url.searchParams.delete('tools');

    if (filters.studentDiscount === true) url.searchParams.set('student', 'true');
    else url.searchParams.delete('student');

    if (filters.startupCredits === true) url.searchParams.set('startup', 'true');
    else url.searchParams.delete('startup');

    window.history.replaceState({}, '', url.toString());
  }, [filters]);

  // Filter plans
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const effectivePrice = plan.promotional_price ?? plan.price_monthly;

      if (!priceInRange(effectivePrice, filters.priceRange)) return false;
      if (filters.badge !== 'all' && plan.badge !== filters.badge) return false;
      if (filters.providers.length > 0 && !filters.providers.includes(plan.provider)) return false;
      if (filters.categories.length > 0 && !filters.categories.some(c => plan.categories.includes(c))) return false;
      if (filters.studentDiscount === true && !plan.student_discount) return false;
      if (filters.startupCredits === true && !plan.startup_credits) return false;
      if (filters.toolsCompatible.length > 0 && !filters.toolsCompatible.some(t => plan.tools_compatible.includes(t))) return false;

      return true;
    });
  }, [plans, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priceRange !== 'all') count++;
    if (filters.badge !== 'all') count++;
    if (filters.providers.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.studentDiscount !== null) count++;
    if (filters.startupCredits !== null) count++;
    if (filters.toolsCompatible.length > 0) count++;
    return count;
  }, [filters]);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const toggleArrayFilter = useCallback((key: 'providers' | 'categories' | 'toolsCompatible', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }));
  }, []);

  const removeFilterChip = useCallback((type: string, value?: string) => {
    setFilters(prev => {
      const next = { ...prev };
      switch (type) {
        case 'price': next.priceRange = 'all'; break;
        case 'badge': next.badge = 'all'; break;
        case 'student': next.studentDiscount = null; break;
        case 'startup': next.startupCredits = null; break;
        case 'provider':
          next.providers = prev.providers.filter(p => p !== value);
          break;
        case 'category':
          next.categories = prev.categories.filter(c => c !== value);
          break;
        case 'tool':
          next.toolsCompatible = prev.toolsCompatible.filter(t => t !== value);
          break;
      }
      return next;
    });
  }, []);

  // Emit filtered plans to parent (Astro page)
  useEffect(() => {
    // Dispatch custom event with filtered slugs for the Astro page to consume
    const event = new CustomEvent('filterbar:change', {
      detail: { slugs: filteredPlans.map(p => p.slug), count: filteredPlans.length, total: plans.length },
    });
    window.dispatchEvent(event);
  }, [filteredPlans, plans.length]);

  return (
    <div className="space-y-3">
      {/* Toggle + Result Count */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn btn-sm btn-outline gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="badge badge-primary badge-xs">{activeFilterCount}</span>
          )}
        </button>
        <div className="text-sm text-base-content/60">
          Showing <span className="font-semibold text-base-content">{filteredPlans.length}</span> of {plans.length} plans
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.priceRange !== 'all' && (
            <span className="badge gap-1 badge-sm">
              Price: {PRICE_RANGES.find(p => p.value === filters.priceRange)?.label}
              <button onClick={() => removeFilterChip('price')} className="cursor-pointer">✕</button>
            </span>
          )}
          {filters.badge !== 'all' && (
            <span className="badge gap-1 badge-sm">
              Badge: {filters.badge}
              <button onClick={() => removeFilterChip('badge')} className="cursor-pointer">✕</button>
            </span>
          )}
          {filters.providers.map(p => (
            <span key={p} className="badge gap-1 badge-sm">
              {p}
              <button onClick={() => removeFilterChip('provider', p)} className="cursor-pointer">✕</button>
            </span>
          ))}
          {filters.categories.map(c => (
            <span key={c} className="badge gap-1 badge-sm">
              {c}
              <button onClick={() => removeFilterChip('category', c)} className="cursor-pointer">✕</button>
            </span>
          ))}
          {filters.toolsCompatible.map(t => (
            <span key={t} className="badge gap-1 badge-sm">
              {t}
              <button onClick={() => removeFilterChip('tool', t)} className="cursor-pointer">✕</button>
            </span>
          ))}
          {filters.studentDiscount !== null && (
            <span className="badge gap-1 badge-sm">
              Student Discount
              <button onClick={() => removeFilterChip('student')} className="cursor-pointer">✕</button>
            </span>
          )}
          {filters.startupCredits !== null && (
            <span className="badge gap-1 badge-sm">
              Startup Credits
              <button onClick={() => removeFilterChip('startup')} className="cursor-pointer">✕</button>
            </span>
          )}
          <button onClick={clearFilters} className="btn btn-ghost btn-xs text-error">Clear all</button>
        </div>
      )}

      {/* Expanded Filter Panel */}
      <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-5 space-y-5">
          {/* Price Range */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Price Range</label>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map(pr => (
                <button
                  key={pr.value}
                  onClick={() => setFilters(prev => ({ ...prev, priceRange: pr.value }))}
                  className={`btn btn-xs ${filters.priceRange === pr.value ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Badge Type */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Badge Type</label>
            <div className="flex flex-wrap gap-2">
              {BADGE_OPTIONS.map(b => (
                <button
                  key={b.value}
                  onClick={() => setFilters(prev => ({ ...prev, badge: b.value }))}
                  className={`btn btn-xs ${filters.badge === b.value ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Provider</label>
            <div className="flex flex-wrap gap-2">
              {allProviders.map(p => (
                <button
                  key={p}
                  onClick={() => toggleArrayFilter('providers', p)}
                  className={`btn btn-xs ${filters.providers.includes(p) ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Categories</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(c => (
                <button
                  key={c}
                  onClick={() => toggleArrayFilter('categories', c)}
                  className={`btn btn-xs ${filters.categories.includes(c) ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Tool Compatibility */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Tool Compatibility</label>
            <div className="flex flex-wrap gap-2">
              {allTools.map(t => (
                <button
                  key={t}
                  onClick={() => toggleArrayFilter('toolsCompatible', t)}
                  className={`btn btn-xs ${filters.toolsCompatible.includes(t) ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={filters.studentDiscount === true}
                onChange={e => setFilters(prev => ({
                  ...prev,
                  studentDiscount: e.target.checked ? true : null,
                }))}
              />
              <span className="text-sm">Student Discount</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={filters.startupCredits === true}
                onChange={e => setFilters(prev => ({
                  ...prev,
                  startupCredits: e.target.checked ? true : null,
                }))}
              />
              <span className="text-sm">Startup Credits</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
