import { useState, useEffect, useMemo, useRef } from 'react';

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

// Simulated per-token pricing for common plans (in $/1M tokens)
const API_PRICING: Record<string, { input: number; output: number; name: string }> = {
  'claude-pro': { input: 3, output: 15, name: 'Claude API (Sonnet)' },
  'google-ai-pro': { input: 1.25, output: 5, name: 'Gemini API (Pro)' },
  'cursor-pro': { input: 2, output: 8, name: 'Cursor API pricing' },
  'chatgpt-plus-free': { input: 5, output: 15, name: 'OpenAI API (GPT-4o)' },
  'github-copilot-pro': { input: 2, output: 8, name: 'Copilot API pricing' },
  'mistral-pro': { input: 2, output: 6, name: 'Mistral API (Large)' },
  'windsurf-pro': { input: 1.5, output: 6, name: 'Windsurf API pricing' },
};

export default function BreakEvenCalculator({ plans }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [subscriptionSlug, setSubscriptionSlug] = useState('');
  const [apiSlug, setApiSlug] = useState('');
  const [monthlyTokens, setMonthlyTokens] = useState(2000000); // 2M tokens default
  const [requestsPerDay, setRequestsPerDay] = useState(50);

  const paidPlans = useMemo(() => plans.filter(p => p.price_monthly > 0), [plans]);
  const apiPlans = useMemo(() => Object.keys(API_PRICING), []);

  const subPlan = useMemo(() => plans.find(p => p.slug === subscriptionSlug), [plans, subscriptionSlug]);
  const apiPricing = useMemo(() => API_PRICING[apiSlug], [apiSlug]);

  // Calculate costs
  const subCost = subPlan?.promotional_price ?? subPlan?.price_monthly ?? 0;
  
  // Calculate API cost at user's usage level
  // Assume 60/40 split input/output
  const apiCostAtUsage = useMemo(() => {
    if (!apiPricing) return 0;
    const inputTokens = monthlyTokens * 0.6;
    const outputTokens = monthlyTokens * 0.4;
    return (inputTokens / 1_000_000) * apiPricing.input + (outputTokens / 1_000_000) * apiPricing.output;
  }, [apiPricing, monthlyTokens]);

  // Break-even point
  const breakEvenTokens = useMemo(() => {
    if (!apiPricing || subCost === 0) return null;
    const costPerToken = (0.6 * apiPricing.input + 0.4 * apiPricing.output) / 1_000_000;
    if (costPerToken === 0) return null;
    return Math.round(subCost / costPerToken);
  }, [apiPricing, subCost]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !subPlan || !apiPricing) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 20, bottom: 50, left: 60 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Max tokens for chart (10M)
    const maxTokens = 10_000_000;
    // Max cost for chart
    const maxApiCost = (0.6 * apiPricing.input + 0.4 * apiPricing.output) / 1_000_000 * maxTokens;
    const maxCost = Math.max(subCost * 1.5, maxApiCost * 1.2, 50);

    // Axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const val = (maxCost / yTicks) * i;
      const y = h - padding.bottom - (i / yTicks) * chartH;
      ctx.fillText(`$${val.toFixed(0)}`, padding.left - 8, y + 4);
      
      // Grid line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7280';
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
      const val = (maxTokens / xTicks) * i;
      const x = padding.left + (i / xTicks) * chartW;
      ctx.fillText(`${(val / 1_000_000).toFixed(0)}M`, x, h - padding.bottom + 20);
    }

    // X-axis title
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillText('Monthly Token Usage', w / 2, h - 5);

    // Y-axis title
    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Monthly Cost ($)', 0, 0);
    ctx.restore();

    // Subscription line (flat)
    const subY = h - padding.bottom - (subCost / maxCost) * chartH;
    ctx.strokeStyle = '#6366f1'; // indigo
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(padding.left, subY);
    ctx.lineTo(w - padding.right, subY);
    ctx.stroke();

    // API cost line (linear)
    ctx.strokeStyle = '#f59e0b'; // amber
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, h - padding.bottom);
    const endApiCost = maxApiCost;
    const endApiY = h - padding.bottom - (endApiCost / maxCost) * chartH;
    ctx.lineTo(w - padding.right, endApiY);
    ctx.stroke();

    // Break-even point
    if (breakEvenTokens && breakEvenTokens > 0 && breakEvenTokens < maxTokens) {
      const bx = padding.left + (breakEvenTokens / maxTokens) * chartW;
      const by = subY;

      // Vertical dashed line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, padding.top);
      ctx.lineTo(bx, h - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Break-even: ${(breakEvenTokens / 1_000_000).toFixed(1)}M tokens`, bx, by - 15);
    }

    // User's current usage marker
    if (monthlyTokens > 0 && monthlyTokens <= maxTokens) {
      const ux = padding.left + (monthlyTokens / maxTokens) * chartW;
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ux, padding.top);
      ctx.lineTo(ux, h - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Your usage', ux, padding.top - 5);
    }

    // Legend
    const legendY = padding.top + 10;
    const legendX = padding.left + 10;

    ctx.fillStyle = '#6366f1';
    ctx.fillRect(legendX, legendY, 16, 3);
    ctx.fillStyle = '#374151';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Subscription: $${subCost}/mo`, legendX + 22, legendY + 5);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(legendX, legendY + 18, 16, 3);
    ctx.fillStyle = '#374151';
    ctx.fillText(`API: ${apiPricing.name}`, legendX + 22, legendY + 23);

  }, [subPlan, apiPricing, monthlyTokens, breakEvenTokens, subCost]);

  const savings = subCost - apiCostAtUsage;

  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-6 space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <span className="text-xl">📊</span> Break-Even Calculator
        <span className="text-xs text-base-content/40 font-normal ml-2">API vs. Subscription</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subscription Plan */}
        <div>
          <label className="label text-sm font-medium" htmlFor="be-sub-plan">Subscription Plan</label>
          <select
            id="be-sub-plan"
            className="select select-bordered w-full select-sm"
            value={subscriptionSlug}
            onChange={e => setSubscriptionSlug(e.target.value)}
          >
            <option value="">Select a plan...</option>
            {paidPlans.map(p => (
              <option key={p.slug} value={p.slug}>{p.name} (${p.promotional_price ?? p.price_monthly}/mo)</option>
            ))}
          </select>
        </div>

        {/* API Provider */}
        <div>
          <label className="label text-sm font-medium" htmlFor="be-api-plan">API Provider</label>
          <select
            id="be-api-plan"
            className="select select-bordered w-full select-sm"
            value={apiSlug}
            onChange={e => setApiSlug(e.target.value)}
          >
            <option value="">Select API provider...</option>
            {apiPlans.map(slug => (
              <option key={slug} value={slug}>{API_PRICING[slug].name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium" htmlFor="be-tokens">Monthly Token Usage</label>
            <span className="text-sm font-bold text-primary">{(monthlyTokens / 1_000_000).toFixed(1)}M tokens</span>
          </div>
          <input
            id="be-tokens"
            type="range"
            min="100000"
            max="10000000"
            step="100000"
            value={monthlyTokens}
            onChange={e => setMonthlyTokens(parseInt(e.target.value))}
            className="range range-primary range-sm w-full"
          />
          <div className="flex justify-between text-xs text-base-content/40 mt-1">
            <span>100K</span>
            <span>5M</span>
            <span>10M</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium" htmlFor="be-requests">Requests per Day</label>
            <span className="text-sm font-bold text-primary">{requestsPerDay} req/day</span>
          </div>
          <input
            id="be-requests"
            type="range"
            min="5"
            max="500"
            step="5"
            value={requestsPerDay}
            onChange={e => setRequestsPerDay(parseInt(e.target.value))}
            className="range range-secondary range-sm w-full"
          />
          <div className="flex justify-between text-xs text-base-content/40 mt-1">
            <span>5</span>
            <span>250</span>
            <span>500</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {subPlan && apiPricing && (
        <>
          <div className="relative bg-base-200/30 rounded-xl p-2">
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ height: '280px' }}
            />
          </div>

          {/* Summary */}
          <div className={`rounded-xl p-4 border ${
            savings > 0 ? 'bg-success/5 border-success/20' : savings < 0 ? 'bg-error/5 border-error/20' : 'bg-base-200/50 border-base-300'
          }`}>
            <p className="text-sm">
              {savings > 0 ? (
                <>
                  At your usage, <strong className="text-success">the API saves you ${savings.toFixed(2)}/month</strong> compared to the {subPlan.name} subscription.
                </>
              ) : savings < 0 ? (
                <>
                  At your usage, <strong className="text-error">the {subPlan.name} subscription saves you ${Math.abs(savings).toFixed(2)}/month</strong> compared to API pricing.
                </>
              ) : (
                <>Both options cost about the same at your current usage level.</>
              )}
            </p>
            {breakEvenTokens && (
              <p className="text-xs text-base-content/50 mt-2">
                Break-even point: ~{(breakEvenTokens / 1_000_000).toFixed(1)}M tokens/month
              </p>
            )}
          </div>
        </>
      )}

      {/* Empty state */}
      {(!subPlan || !apiPricing) && (
        <div className="text-center py-8 bg-base-200/30 rounded-xl border border-dashed border-base-300">
          <p className="text-base-content/50 text-sm">Select both a subscription plan and an API provider to see the cost comparison chart.</p>
        </div>
      )}
    </div>
  );
}
