import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const badgeEnum = z.enum(['FREE', 'PROMO', 'PAID']);

const plans = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/data/plans' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    provider: z.string(),
    badge: badgeEnum,
    price_monthly: z.number().min(0),
    promotional_price: z.number().min(0).nullable().optional(),
    promotional_duration: z.string().nullable().optional(),
    description: z.string(),
    external_url: z.string().url(),
    models: z.array(z.string()),
    limits: z.object({
      requests_per_minute: z.number().nullable().optional(),
      tokens_per_minute: z.number().nullable().optional(),
      context_window: z.number().nullable().optional(),
      daily_message_limit: z.union([z.number(), z.string()]).nullable().optional(),
    }),
    features: z.array(z.string()),
    categories: z.array(z.string()),
    student_discount: z.boolean().default(false),
    startup_credits: z.boolean().default(false),
    tools_compatible: z.array(z.string()),
    history: z.array(z.object({
      date: z.string(),
      event: z.string(),
    })).optional(),
    community_reviews_summary: z.string().optional(),
    community_score: z.number().min(0).max(100).optional(),
    latency: z.object({
      average_ms: z.number().optional(),
      uptime_percent: z.number().min(0).max(100).optional(),
    }).optional(),
    updated_at: z.string(),
  }),
});

const models = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/data/models' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    provider: z.string(),
    description: z.string(),
    context_window: z.number(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    vibe_coding_score: z.number().min(0).max(10),
    plans_available: z.array(z.string()),
    updated_at: z.string().optional(),
  }),
});

const tools = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/data/tools' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    external_url: z.string().url(),
    features: z.array(z.string()),
    plans_compatible: z.array(z.string()),
    updated_at: z.string().optional(),
  }),
});

const stacks = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/data/stacks' }),
  schema: z.object({
    id: z.string(),
    author: z.string(),
    title: z.string(),
    tools: z.array(z.string()),
    monthly_cost: z.number().min(0),
    description: z.string(),
    upvotes: z.number().min(0).default(0),
    submitted_at: z.string(),
  }),
});

export const collections = {
  plans,
  models,
  tools,
  stacks,
};