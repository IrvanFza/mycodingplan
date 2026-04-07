import { useState, useEffect, useCallback } from 'react';

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

type UsagePattern = '4-5hrs' | 'weekly' | 'monthly';
type Priority = 'price' | 'model_quality' | 'speed' | 'privacy';

interface WizardState {
  step: number;
  budget: number;
  usage: UsagePattern | '';
  preferredModels: string[];
  toolPreference: string;
  priorities: Priority[];
}

interface ScoredPlan {
  plan: PlanData;
  score: number;
  reasons: string[];
}

const STEPS = ['Budget', 'Usage', 'Models', 'Tools', 'Priorities', 'Results'];

const MODEL_OPTIONS = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'gpt', label: 'GPT (OpenAI)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'any', label: 'Any / No preference' },
];

const TOOL_OPTIONS = [
  { value: 'cursor', label: 'Cursor' },
  { value: 'vscode', label: 'VS Code' },
  { value: 'jetbrains', label: 'JetBrains' },
  { value: 'cli', label: 'CLI Tools' },
  { value: 'any', label: 'Any / No preference' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; icon: string }[] = [
  { value: 'price', label: 'Best Price', icon: '💰' },
  { value: 'model_quality', label: 'Model Quality', icon: '🧠' },
  { value: 'speed', label: 'Speed / Latency', icon: '⚡' },
  { value: 'privacy', label: 'Privacy', icon: '🔒' },
];

function scorePlan(plan: PlanData, state: WizardState): ScoredPlan {
  let score = 0;
  const reasons: string[] = [];

  // Budget score (0-30 points)
  const effectivePrice = plan.promotional_price ?? plan.price_monthly;
  if (effectivePrice === 0) {
    score += 30;
    reasons.push('Free plan — no cost');
  } else if (effectivePrice <= state.budget) {
    const budgetFit = 1 - (effectivePrice / Math.max(state.budget, 1));
    score += Math.round(15 + budgetFit * 15);
    reasons.push(`Within budget ($${effectivePrice}/mo)`);
  } else {
    score += Math.max(0, Math.round(10 * (1 - (effectivePrice - state.budget) / state.budget)));
    reasons.push(`Over budget ($${effectivePrice}/mo)`);
  }

  // Usage pattern score (0-15 points)
  if (state.usage === '4-5hrs') {
    // Heavy users need high limits
    if (plan.limits.daily_message_limit === null || plan.limits.daily_message_limit === undefined) {
      score += 12;
      reasons.push('No daily message limit');
    } else if (typeof plan.limits.daily_message_limit === 'string' && plan.limits.daily_message_limit.toLowerCase().includes('unlimited')) {
      score += 15;
      reasons.push('Unlimited messages');
    } else {
      score += 5;
    }
  } else if (state.usage === 'weekly') {
    score += 10;
    reasons.push('Good for weekly usage');
  } else if (state.usage === 'monthly') {
    score += 12;
    if (effectivePrice === 0) reasons.push('Perfect for occasional use');
  }

  // Model preference score (0-20 points)
  if (state.preferredModels.length === 0 || state.preferredModels.includes('any')) {
    score += 15;
  } else {
    const modelStr = plan.models.join(' ').toLowerCase();
    let modelMatches = 0;
    for (const pref of state.preferredModels) {
      if (modelStr.includes(pref.toLowerCase())) {
        modelMatches++;
      }
    }
    if (modelMatches > 0) {
      score += Math.round(10 + (modelMatches / state.preferredModels.length) * 10);
      reasons.push(`${modelMatches} preferred model(s) available`);
    }
  }

  // Tool compatibility score (0-15 points)
  if (state.toolPreference === 'any' || state.toolPreference === '') {
    score += 10;
  } else {
    const toolStr = plan.tools_compatible.join(' ').toLowerCase();
    if (toolStr.includes(state.toolPreference.toLowerCase())) {
      score += 15;
      reasons.push(`Compatible with ${state.toolPreference}`);
    } else {
      score += 2;
    }
  }

  // Priority-based bonus (0-20 points)
  const priorityWeight = [1.0, 0.7, 0.4, 0.2];
  for (let i = 0; i < state.priorities.length; i++) {
    const weight = priorityWeight[i] ?? 0.1;
    const priority = state.priorities[i];
    const bonus = 5;

    switch (priority) {
      case 'price':
        if (effectivePrice === 0) score += Math.round(bonus * weight);
        else if (effectivePrice <= 10) score += Math.round(bonus * weight * 0.8);
        else if (effectivePrice <= 20) score += Math.round(bonus * weight * 0.5);
        break;
      case 'model_quality':
        if (plan.models.length >= 3) score += Math.round(bonus * weight);
        else if (plan.models.length >= 2) score += Math.round(bonus * weight * 0.6);
        break;
      case 'speed':
        if (plan.latency?.average_ms && plan.latency.average_ms < 800) {
          score += Math.round(bonus * weight);
          if (i === 0) reasons.push('Low latency');
        }
        break;
      case 'privacy':
        if (plan.categories.includes('privacy-first')) {
          score += Math.round(bonus * weight);
          if (i === 0) reasons.push('Privacy-first');
        }
        break;
    }
  }

  return { plan, score: Math.min(score, 100), reasons };
}

export default function RecommendationWizard({ plans }: Props) {
  const [state, setState] = useState<WizardState>({
    step: 0,
    budget: 20,
    usage: '',
    preferredModels: [],
    toolPreference: '',
    priorities: ['price', 'model_quality', 'speed', 'privacy'],
  });

  const [results, setResults] = useState<ScoredPlan[]>([]);
  const [animDir, setAnimDir] = useState<'forward' | 'backward'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);

  // Load saved results from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wizard_last_result');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.state) {
          setState(parsed.state);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const goToStep = useCallback((newStep: number) => {
    if (isAnimating) return;
    setAnimDir(newStep > state.step ? 'forward' : 'backward');
    setIsAnimating(true);
    setTimeout(() => {
      setState(prev => ({ ...prev, step: newStep }));
      setIsAnimating(false);
    }, 200);
  }, [state.step, isAnimating]);

  const next = useCallback(() => {
    if (state.step < STEPS.length - 1) {
      if (state.step === STEPS.length - 2) {
        // Compute results before showing results step
        const scored = plans.map(p => scorePlan(p, state));
        scored.sort((a, b) => b.score - a.score);
        setResults(scored);

        // Save to localStorage
        try {
          localStorage.setItem('wizard_last_result', JSON.stringify({
            state: { ...state, step: STEPS.length - 1 },
            timestamp: Date.now(),
          }));
        } catch { /* ignore */ }
      }
      goToStep(state.step + 1);
    }
  }, [state, plans, goToStep]);

  const back = useCallback(() => {
    if (state.step > 0) goToStep(state.step - 1);
  }, [state.step, goToStep]);

  const startOver = useCallback(() => {
    setState({
      step: 0,
      budget: 20,
      usage: '',
      preferredModels: [],
      toolPreference: '',
      priorities: ['price', 'model_quality', 'speed', 'privacy'],
    });
    setResults([]);
    try { localStorage.removeItem('wizard_last_result'); } catch { /* ignore */ }
  }, []);

  const toggleModel = (model: string) => {
    setState(prev => {
      if (model === 'any') return { ...prev, preferredModels: ['any'] };
      const filtered = prev.preferredModels.filter(m => m !== 'any');
      return {
        ...prev,
        preferredModels: filtered.includes(model)
          ? filtered.filter(m => m !== model)
          : [...filtered, model],
      };
    });
  };

  const movePriority = (idx: number, dir: -1 | 1) => {
    setState(prev => {
      const newP = [...prev.priorities];
      const target = idx + dir;
      if (target < 0 || target >= newP.length) return prev;
      [newP[idx], newP[target]] = [newP[target], newP[idx]];
      return { ...prev, priorities: newP };
    });
  };

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
    <div className="bg-base-100 rounded-2xl border border-base-300 shadow-lg overflow-hidden">
      {/* Progress Steps */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🧭</span> Plan Recommendation Wizard
          </h2>
          {state.step > 0 && state.step < STEPS.length - 1 && (
            <span className="text-sm text-base-content/50">
              Step {state.step + 1} of {STEPS.length - 1}
            </span>
          )}
        </div>
        <ul className="steps steps-horizontal w-full text-xs">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`step ${i <= state.step ? 'step-primary' : ''}`}
            >
              <span className="hidden sm:inline">{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Step Content */}
      <div
        className={`px-6 pb-6 min-h-[300px] transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Step 1: Budget */}
        {state.step === 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">What's your monthly budget?</h3>
              <p className="text-sm text-base-content/60">Slide to set your maximum monthly spend on AI coding tools.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base-content/50 text-sm">$0</span>
                <span className="text-3xl font-extrabold text-primary">
                  {state.budget === 100 ? '$100+' : `$${state.budget}`}
                </span>
                <span className="text-base-content/50 text-sm">$100+</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={state.budget}
                onChange={e => setState(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                className="range range-primary w-full"
              />
              <div className="flex justify-between text-xs text-base-content/40 px-1">
                <span>Free</span>
                <span>$25</span>
                <span>$50</span>
                <span>$75</span>
                <span>$100+</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Usage Pattern */}
        {state.step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">How often will you code with AI?</h3>
              <p className="text-sm text-base-content/60">This helps us match you with plans that suit your usage level.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { value: '4-5hrs' as UsagePattern, label: '4–5 hrs/day', desc: 'Heavy daily coding sessions', icon: '🔥' },
                { value: 'weekly' as UsagePattern, label: 'Weekly hobbyist', desc: 'A few sessions per week', icon: '📅' },
                { value: 'monthly' as UsagePattern, label: 'Monthly occasional', desc: 'Light, occasional use', icon: '🌙' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setState(prev => ({ ...prev, usage: opt.value }))}
                  className={`card border-2 p-4 text-left transition-all duration-200 hover:shadow-md cursor-pointer ${
                    state.usage === opt.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-base-300 hover:border-primary/30'
                  }`}
                >
                  <span className="text-2xl mb-2">{opt.icon}</span>
                  <span className="font-semibold text-sm">{opt.label}</span>
                  <span className="text-xs text-base-content/50 mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Preferred Models */}
        {state.step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Which AI models do you prefer?</h3>
              <p className="text-sm text-base-content/60">Select all that apply. Choose "Any" if you don't have a preference.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MODEL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleModel(opt.value)}
                  className={`btn btn-sm justify-start gap-2 ${
                    state.preferredModels.includes(opt.value)
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center ${
                    state.preferredModels.includes(opt.value)
                      ? 'border-primary-content bg-primary-content'
                      : 'border-current'
                  }`}>
                    {state.preferredModels.includes(opt.value) && (
                      <svg className="w-2 h-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Tool Preference */}
        {state.step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">What's your primary IDE or tool?</h3>
              <p className="text-sm text-base-content/60">We'll prioritize plans that work best with your tool of choice.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOOL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setState(prev => ({ ...prev, toolPreference: opt.value }))}
                  className={`card border-2 p-4 text-center transition-all duration-200 hover:shadow-md cursor-pointer ${
                    state.toolPreference === opt.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-base-300 hover:border-primary/30'
                  }`}
                >
                  <span className="font-semibold text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Priorities */}
        {state.step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Rank your priorities</h3>
              <p className="text-sm text-base-content/60">Drag or use arrows to reorder. Top = most important.</p>
            </div>
            <div className="space-y-2">
              {state.priorities.map((p, idx) => {
                const opt = PRIORITY_OPTIONS.find(o => o.value === p)!;
                return (
                  <div
                    key={p}
                    className="flex items-center gap-3 bg-base-200/50 rounded-xl p-3 border border-base-300"
                  >
                    <span className="text-lg font-bold text-primary/60 w-6 text-center">{idx + 1}</span>
                    <span className="text-xl">{opt.icon}</span>
                    <span className="font-medium flex-1">{opt.label}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => movePriority(idx, -1)}
                        disabled={idx === 0}
                        className="btn btn-ghost btn-xs btn-square"
                        aria-label="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => movePriority(idx, 1)}
                        disabled={idx === state.priorities.length - 1}
                        className="btn btn-ghost btn-xs btn-square"
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6: Results */}
        {state.step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Your Recommended Plans</h3>
                <p className="text-sm text-base-content/60">Based on your preferences, here are the best matches.</p>
              </div>
            </div>
            <div className="space-y-3">
              {results.slice(0, 8).map((r, idx) => (
                <a
                  key={r.plan.slug}
                  href={`/plans/${r.plan.slug}/`}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                    idx === 0 ? 'border-primary/30 bg-primary/5' : 'border-base-300 bg-base-100 hover:border-primary/20'
                  }`}
                >
                  {/* Rank */}
                  <div className={`text-xl font-extrabold w-8 text-center ${idx === 0 ? 'text-primary' : 'text-base-content/30'}`}>
                    {idx === 0 ? '🏆' : `#${idx + 1}`}
                  </div>

                  {/* Plan Info */}
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

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <div className={`font-bold text-sm ${r.plan.price_monthly === 0 ? 'text-success' : ''}`}>
                      {r.plan.price_monthly === 0 ? 'Free' : `$${r.plan.promotional_price ?? r.plan.price_monthly}/mo`}
                    </div>
                  </div>

                  {/* Score */}
                  <div className={`text-center shrink-0 px-3 py-1 rounded-lg border font-bold text-sm ${getScoreBg(r.score)} ${getScoreColor(r.score)}`}>
                    {r.score}%
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 bg-base-200/30 border-t border-base-300 flex items-center justify-between">
        {state.step === 5 ? (
          <>
            <button onClick={startOver} className="btn btn-ghost btn-sm gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start Over
            </button>
            <a href="/plans/" className="btn btn-primary btn-sm">Browse All Plans</a>
          </>
        ) : (
          <>
            <button onClick={back} disabled={state.step === 0} className="btn btn-ghost btn-sm">
              ← Back
            </button>
            <button onClick={next} className="btn btn-primary btn-sm">
              {state.step === STEPS.length - 2 ? 'See Results' : 'Next →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
