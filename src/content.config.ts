import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const badgeEnum = z.enum(['FREE', 'PROMO', 'PAID']);

const categories = defineCollection({
  loader: file("src/data/shared/categories.yaml"),
  schema: z.object({ id: z.string(), name: z.string() })
});

const features = defineCollection({
  loader: file("src/data/shared/features.yaml"),
  schema: z.object({ id: z.string(), name: z.string() })
});

const tags = defineCollection({
  loader: file("src/data/shared/tags.yaml"),
  schema: z.object({ id: z.string(), name: z.string() })
});

const providers = defineCollection({
  loader: file("src/data/shared/providers.yaml"),
  schema: z.object({ id: z.string(), name: z.string(), url: z.string().url().optional() })
});

const plans = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/data/plans' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    provider: reference('providers').optional(),
    badge: badgeEnum,
    
    quotas: z.array(z.object({
      measure: z.enum(['currency', 'requests', 'input_tokens', 'output_tokens', 'credits']),
      amount: z.number().nullable(),
      window: z.enum(['5-hour', 'daily', 'weekly', 'monthly', 'unlimited', 'rolling']),
      models: z.array(reference('models')).optional(),
      aliases: z.array(z.object({
        measure: z.enum(['currency', 'requests', 'input_tokens', 'output_tokens', 'credits']),
        model: reference('models'),
        amount: z.number()
      })).optional()
    })).optional(),

    price_monthly: z.number().min(0).optional(),
    promotional_price: z.number().min(0).nullable().optional(),
    promotional_duration: z.string().nullable().optional(),
    limits: z.object({
      requests_per_minute: z.number().nullable().optional(),
      tokens_per_minute: z.number().nullable().optional(),
      context_window: z.number().nullable().optional(),
      daily_message_limit: z.union([z.number(), z.string()]).nullable().optional(),
    }).optional(),
    
    overages: z.discriminatedUnion("allowed", [
      z.object({ allowed: z.literal(false) }),
      z.object({ 
        allowed: z.literal(true), 
        type: z.enum(["payg", "credits_purchase"]), 
        pricing_model: z.string().optional(),
        auto_recharge_supported: z.boolean().optional() 
      })
    ]).optional(),

    restrictions: z.object({
      allowed_tools: z.array(reference('tools')).nullable().optional(),
      banned_tools: z.array(reference('tools')).nullable().optional(),
      violation_penalty: z.string().optional()
    }).optional(),

    description: z.string(),
    external_url: z.string().url().optional(),
    
    models: z.array(reference('models')).optional(),
    compatible_tools: z.array(reference('tools')).optional(),
    compatible_tools: z.array(reference('tools')).optional(), // legacy

    features: z.array(z.union([z.string(), reference('features')])).optional(),
    categories: z.array(z.union([z.string(), reference('categories')])).optional(),

    student_discount: z.boolean().default(false),
    startup_credits: z.boolean().default(false),
    
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
    updated_at: z.string().optional(),
  }),
});

const models = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/data/models' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    provider: z.union([z.string(), reference('providers')]).optional(),
    description: z.string(),
    context_window: z.number(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    vibe_coding_score: z.number().min(0).max(10).optional(),
    model_type: z.enum(['open_weight', 'closed_source']).optional(),
    // We remove the required manual reverse relationship
    plans_available: z.array(reference('plans')).optional(),
    updated_at: z.string().optional(),
  }),
});

const tools = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/data/tools' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    external_url: z.string().url().optional(),
    tool_type: z.enum(['cli', 'ide', 'extension']).optional(),
    features: z.array(z.union([z.string(), reference('features')])).optional(),
    plans_compatible: z.array(reference('plans')).optional(),
    updated_at: z.string().optional(),
  }),
});

const stacks = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/data/stacks' }),
  schema: z.object({
    id: z.string(),
    author: z.string(),
    title: z.string(),
    tools: z.array(reference('tools')),
    monthly_cost: z.number().min(0),
    description: z.string(),
    upvotes: z.number().min(0).default(0),
    submitted_at: z.string(),
  }),
});

export const collections = {
  categories,
  features,
  tags,
  providers,
  plans,
  models,
  tools,
  stacks,
};