import { useState, useCallback, useMemo } from 'react';

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
  has_open_weight?: boolean;
  has_closed_source?: boolean;
  has_cli?: boolean;
  has_ide?: boolean;
}

interface Props {
  plans: PlanData[];
}

type UsageIntensity = 'token_avg' | 'request_avg';
type ToolType = 'cli' | 'ide';
type ModelPref = 'open_weight' | 'closed_source';

interface FormState {
  usage: UsageIntensity | '';
  usageValue: string; // user-typed number
  tool: ToolType | '';
  modelPref: ModelPref | '';
}

interface ScoredPlan {
  plan: PlanData;
  score: number;
  reasons: string[];
}

function isUnlimited(val: number | string | null | undefined): boolean {
  if (val == null) return false;
  if (typeof val === 'string') return val.toLowerCase().includes('unlimited');
  return false;
}

function scorePlan(plan: PlanData, state: FormState): ScoredPlan {
  let score = 0;
  let maxScore = 0;
  const reasons: string[] = [];
  const effectivePrice = plan.promotional_price ?? plan.price_monthly;

  // Usage intensity (0-40 pts) — user provides their actual usage per 5 hrs
  if (state.usage && state.usageValue) {
    const inputNum = parseInt(state.usageValue, 10);
    if (inputNum > 0) {
      maxScore += 40;
      // 5 hrs = 300 min → convert user input to per-minute rate
      const perMin = inputNum / 300;

      if (state.usage === 'token_avg') {
        const tpm = plan.limits.tokens_per_minute;
        const cw = plan.limits.context_window;

        if (tpm != null) {
          // Ratio of plan limit to user demand, capped at 1
          const headroom = Math.min(1, tpm / perMin);
          score += Math.round(headroom * 25);
          if (headroom >= 1) reasons.push(`${(tpm / 1000).toFixed(0)}k tokens/min — fits your usage`);
          else reasons.push(`${(tpm / 1000).toFixed(0)}k tokens/min — may be tight`);
        } else {
          score += 25; // Unknown/dynamic limit, assume it fits to avoid penalizing
          reasons.push('Dynamic token limits');
        }
        if (cw != null) {
          score += Math.min(15, Math.round((cw / 200_000) * 15));
          if (cw >= 128_000) reasons.push(`${(cw / 1000).toFixed(0)}k context window`);
        } else {
          score += 15;
          reasons.push('Dynamic context window');
        }
      } else {
        const rpm = plan.limits.requests_per_minute;
        const daily = plan.limits.daily_message_limit;

        if (rpm != null) {
          const headroom = Math.min(1, rpm / Math.max(perMin, 0.01));
          score += Math.round(headroom * 25);
          if (headroom >= 1) reasons.push(`${rpm} requests/min — fits your usage`);
          else reasons.push(`${rpm} requests/min — may be tight`);
        } else {
          score += 25; // Dynamic limits
          reasons.push(`Dynamic request limits`);
        }
        if (isUnlimited(daily)) {
          score += 15;
          reasons.push('Unlimited daily messages');
        } else if (typeof daily === 'number' && daily > 0) {
          const dayTotal = inputNum; // user already gave 5-hr total ≈ daily
          const headroom = Math.min(1, daily / Math.max(dayTotal, 1));
          score += Math.round(headroom * 15);
          if (headroom >= 1) reasons.push(`${daily} messages/day — enough for you`);
        } else if (daily == null) {
          score += 15;
          reasons.push('Dynamic daily messages');
        }
      }
    }
  }

  // Tool type (0-30 pts) — CLI vs IDE
  if (state.tool) {
    maxScore += 30;
    const label = state.tool === 'cli' ? 'CLI' : 'IDE';
    const hasMatch = state.tool === 'cli' ? plan.has_cli : plan.has_ide;

    if (hasMatch) {
      score += 30;
      reasons.push(`Compatible with ${label}`);
    } else {
      score += 5;
    }
  }

  // Model preference (0-30 pts) — open weight vs closed source
  if (state.modelPref) {
    maxScore += 30;
    const label = state.modelPref === 'open_weight' ? 'open-weight' : 'closed-source';
    const hasMatch = state.modelPref === 'open_weight' ? plan.has_open_weight : plan.has_closed_source;

    if (hasMatch) {
      score += 30;
      reasons.push(`Has ${label} models`);
    } else {
      score += 5;
    }
  }

  const normalized = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { plan, score: Math.min(normalized, 100), reasons };
}

const DEFAULT_STATE: FormState = { usage: '', usageValue: '', tool: '', modelPref: '' };

export default function RecommendationWizard({ plans }: Props) {
  const [state, setState] = useState<FormState>(DEFAULT_STATE);
  const [results, setResults] = useState<ScoredPlan[]>([]);
  const [showResults, setShowResults] = useState(false);

  const hasAnyInput = useMemo(() => (
    (state.usage && state.usageValue) || !!state.tool || !!state.modelPref
  ), [state]);

  const getRecommendations = useCallback(() => {
    if (!hasAnyInput) return;
    const scored = plans.map(p => scorePlan(p, state));
    scored.sort((a, b) => b.score - a.score);
    setResults(scored);
    setShowResults(true);
  }, [state, plans, hasAnyInput]);

  const clearAll = useCallback(() => {
    setState(DEFAULT_STATE);
    setResults([]);
    setShowResults(false);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-error';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-success/10 border-success/30';
    if (score >= 40) return 'bg-warning/10 border-warning/30';
    return 'bg-error/10 border-error/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <span className="text-3xl">🧭</span> Find Your Plan
        </h2>
        <p className="text-sm text-base-content/60 mt-1">
          Pick any combination below — the more you share, the better the match.
        </p>
      </div>

      {/* Form */}
      <div className="bg-base-100 rounded-2xl border border-base-300 shadow-lg p-6 space-y-6">

        {/* Row 1: Usage Intensity */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Average Usage Intensity (5 hrs/day)</h3>
          <p className="text-xs text-base-content/60">Input your *average* expected usage for a 5-hour window, not absolute burst limits.</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'token_avg' as UsageIntensity, label: 'Token Average', placeholder: 'e.g. 50000', icon: '🔢' },
              { value: 'request_avg' as UsageIntensity, label: 'Request Average', placeholder: 'e.g. 100', icon: '📨' },
            ]).map(opt => (
              <div
                key={opt.value}
                className={`border-2 rounded-xl p-4 transition-all ${
                  state.usage === opt.value
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-base-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{opt.icon}</span>
                  <span className="font-semibold text-sm">{opt.label}</span>
                </div>
                <input
                  type="number"
                  min="1"
                  placeholder={opt.placeholder}
                  value={state.usage === opt.value ? state.usageValue : ''}
                  onChange={e => setState(prev => ({ 
                    ...prev, 
                    usage: e.target.value ? opt.value : '', 
                    usageValue: e.target.value 
                  }))}
                  onFocus={() => {
                    if (state.usage && state.usage !== opt.value) {
                      setState(prev => ({ ...prev, usage: opt.value, usageValue: '' }));
                    }
                  }}
                  className="input input-bordered input-sm w-full"
                />
                <span className="text-[10px] text-base-content/40 mt-1 block">per 5 hrs</span>
              </div>
            ))}
          </div>
        </div>

        <div className="divider my-0" />

        {/* Row 2: Daily Tool */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Daily Tool</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'cli' as ToolType, label: 'CLI Tools', desc: 'Claude Code, OpenCode, Aider, Gemini CLI…', icon: '💻' },
              { value: 'ide' as ToolType, label: 'IDE Based', desc: 'Cursor, VS Code, JetBrains, Kiro…', icon: '🧑‍💻' },
            ]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setState(prev => ({ ...prev, tool: prev.tool === opt.value ? '' : opt.value }))}
                className={`border-2 rounded-xl p-4 text-center transition-all ${
                  state.tool === opt.value
                    ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/30'
                    : 'border-base-300 hover:border-primary/30'
                }`}
              >
                <span className="text-2xl block">{opt.icon}</span>
                <span className="font-semibold text-sm block mt-1">{opt.label}</span>
                <span className="text-[10px] text-base-content/40 mt-0.5 block">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="divider my-0" />

        {/* Row 3: Model Preference */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Model Preference</h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'open_weight' as ModelPref, label: 'Open Weight', desc: 'DeepSeek, Mistral, Llama, Qwen…', icon: '🌐' },
              { value: 'closed_source' as ModelPref, label: 'Closed Source', desc: 'GPT, Claude, Gemini…', icon: '🔒' },
            ]).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setState(prev => ({ ...prev, modelPref: prev.modelPref === opt.value ? '' : opt.value }))}
                className={`border-2 rounded-xl p-4 text-center transition-all ${
                  state.modelPref === opt.value
                    ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/30'
                    : 'border-base-300 hover:border-primary/30'
                }`}
              >
                <span className="text-2xl block">{opt.icon}</span>
                <span className="font-semibold text-sm block mt-1">{opt.label}</span>
                <span className="text-[10px] text-base-content/40 mt-0.5 block">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={clearAll} className="btn btn-ghost btn-sm">
            Clear All
          </button>
          <button
            onClick={getRecommendations}
            disabled={!hasAnyInput}
            className="btn btn-primary btn-sm gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {showResults ? 'Update Results' : 'Get Recommendations'}
          </button>
        </div>
      </div>

      {/* Results */}
      {showResults && (
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>🎯</span> Recommended Plans
          </h3>
          <div className="space-y-3">
            {results.slice(0, 8).map((r, idx) => (
              <a
                key={r.plan.slug}
                href={`/plans/${r.plan.slug}/`}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                  idx === 0 ? 'border-primary/30 bg-primary/5' : 'border-base-300 hover:border-primary/20'
                }`}
              >
                <div className={`text-xl font-extrabold w-8 text-center ${idx === 0 ? 'text-primary' : 'text-base-content/30'}`}>
                  {idx === 0 ? '🏆' : `#${idx + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{r.plan.name}</span>
                    <span className={`badge badge-xs ${
                      r.plan.badge === 'FREE' ? 'badge-success' :
                      r.plan.badge === 'PROMO' ? 'badge-warning' : 'badge-info'
                    }`}>{r.plan.badge}</span>
                  </div>
                  <p className="text-xs text-base-content/50 line-clamp-1">{r.plan.provider} · {r.reasons.slice(0, 3).join(' · ')}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-bold text-sm ${r.plan.price_monthly === 0 ? 'text-success' : ''}`}>
                    {r.plan.price_monthly === 0 ? 'Free' : `$${r.plan.promotional_price ?? r.plan.price_monthly}/mo`}
                  </div>
                </div>
                <div className={`text-center shrink-0 px-3 py-1 rounded-lg border font-bold text-sm ${getScoreBg(r.score)} ${getScoreColor(r.score)}`}>
                  {r.score}%
                </div>
              </a>
            ))}
          </div>
          <div className="pt-2 text-center">
            <a href="/plans/" className="btn btn-ghost btn-sm">Browse All Plans →</a>
          </div>
        </div>
      )}
    </div>
  );
}
