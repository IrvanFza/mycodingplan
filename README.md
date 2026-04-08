<p align="center">
  <img src="public/favicon.png" alt="MyCodingPlan logo" width="64" height="64" />
</p>

<h1 align="center">MyCodingPlan</h1>

<p align="center">
  <strong>A free, open-source directory to compare AI coding plans, models, and tools side-by-side. Find your perfect setup whether you're stacking free tiers or evaluating paid subscriptions.</strong>
</p>

<p align="center">
  <a href="https://mycodingplan.com">Website</a> ·
  <a href="https://github.com/IrvanFza/mycodingplan/discussions">Discussions</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="LICENSE">MIT License</a>
</p>

---

## 💡 Why This Project Exists

This project was built from a personal need to manage a "vibe coding" workflow on a tight budget. API-based or Pay-As-You-Go (PAYG) options burn through funds too fast, making subscription-based plans the only viable choice. But with varying limits (tokens vs. requests) and different reset windows (e.g., 5-hour vs. 5-day), manually comparing personal usage against provider plans is tedious.

Furthermore, while new providers launch "cheaper" and more generous plans almost every month, many come with hidden issues—laggy responses, secretly quantized models, or problematic billing systems that overcharge. This directory is meant to transparently track and compare these plans so you can find your perfect setup.

## ✨ Key Features

- **📋 Plan Directory** — 25+ AI coding plans with detailed pricing, limits, and model info
- **🤖 Model Profiles** — Vibe coding scores, context windows, and strengths/weaknesses for 12+ models
- **🛠️ Tool Compatibility** — See which plans work with Cursor, VS Code, JetBrains, CLI tools, and more
- **🧙 Smart Recommendation Wizard** — Answer a few questions, get personalized plan suggestions
- **⚖️ Side-by-Side Comparison** — Compare up to 4 plans across every dimension
- **📊 Break-Even Calculator** — Find when a subscription beats pay-as-you-go API pricing
- **🆓 Free-Tier Maximizer** — Curated $0/month stacks using combined free offerings
- **👥 Community Stacks** — See what setups other developers are using
- **🔍 Advanced Filtering** — Filter by price, provider, badge type, student discounts, and more

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Astro](https://astro.build/) v6 — static-first, zero JS by default |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) v4 + [daisyUI](https://daisyui.com/) |
| **Interactive Islands** | [React](https://react.dev/) 19 (hydrated only where needed) |
| **Language** | TypeScript (strict mode) |
| **Data** | YAML flat files with Zod schema validation |
| **Deployment** | [GitHub Pages](https://pages.github.com/) (free) |
| **CDN** | [Cloudflare](https://www.cloudflare.com/) free tier |
| **Comments** | [Giscus](https://giscus.app/) (GitHub Discussions-backed) |
| **License** | MIT |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 22.12.0
- npm (comes with Node.js)

### Local Development

```bash
# Clone the repository
git clone https://github.com/IrvanFza/mycodingplan.git
cd mycodingplan

# Install dependencies
npm install

# Start the dev server (http://localhost:4321)
npm run dev
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |

## 📁 Project Structure

```
mycodingplan.com/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Build & deploy to GitHub Pages
├── docs/
│   ├── FEATURES.md                 # Feature specifications
│   ├── IMPLEMENTATION_PLAN.md      # Full implementation plan
│   └── TODO.md                     # Development task tracker
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── CNAME                       # Custom domain config
│   └── images/                     # Static images & OG assets
├── src/
│   ├── components/
│   │   ├── Navbar.astro            # Site navigation
│   │   ├── Footer.astro            # Site footer
│   │   ├── PlanCard.astro          # Plan listing card
│   │   ├── PlanDetail.astro        # Plan detail view
│   │   ├── ModelCard.astro         # Model listing card
│   │   ├── ToolCard.astro          # Tool listing card
│   │   ├── CompatibilityMatrix.astro # IDE compatibility table
│   │   ├── RecommendationWizard.tsx  # 🏝️ Smart plan wizard
│   │   ├── ComparisonMatrix.tsx      # 🏝️ Side-by-side comparison
│   │   ├── BreakEvenCalculator.tsx   # 🏝️ API vs subscription chart
│   │   └── FilterBar.tsx             # 🏝️ Advanced filtering
│   ├── content.config.ts           # Astro content collection schemas (Zod)
│   ├── data/
│   │   ├── plans/                  # One YAML per plan (25 files)
│   │   ├── models/                 # One YAML per model (12 files)
│   │   ├── tools/                  # One YAML per tool (16 files)
│   │   └── stacks/                 # One YAML per community stack (7 files)
│   ├── layouts/
│   │   ├── BaseLayout.astro        # HTML head, meta tags, fonts
│   │   └── PlanLayout.astro        # Plan detail with breadcrumbs & structured data
│   ├── pages/
│   │   ├── index.astro             # Homepage — directory + wizard
│   │   ├── compare.astro           # Side-by-side comparison
│   │   ├── privacy.astro           # Privacy policy
│   │   ├── plans/
│   │   │   ├── index.astro         # Plans listing with filters
│   │   │   └── [slug].astro        # Dynamic plan detail pages
│   │   ├── models/
│   │   │   ├── index.astro         # Models listing
│   │   │   └── [slug].astro        # Dynamic model detail pages
│   │   └── tools/
│   │       ├── index.astro         # Tools listing
│   │       └── [slug].astro        # Dynamic tool detail pages
│   └── styles/
│       └── global.css              # Tailwind + daisyUI imports
├── astro.config.mjs                # Astro configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json
├── CONTRIBUTING.md                 # Contribution guidelines
├── CODE_OF_CONDUCT.md              # Community code of conduct
├── LICENSE                         # MIT License
└── README.md                       # ← You are here
```

## 📝 How to Add or Update Plan Data

All plan data lives as YAML files in `src/data/plans/`. Contributions are welcome from anyone — no local setup required.

### Updating Existing Data (Quickest)

GitHub makes this easy — you don't even need to fork manually:

1. Navigate to the file on GitHub (e.g., [`src/data/plans/cursor-pro.yaml`](https://github.com/IrvanFza/mycodingplan/blob/main/src/data/plans/cursor-pro.yaml))
2. Click the **pencil icon** (✏️) — GitHub will automatically fork the repo for you
3. Edit the fields you want to change
4. Update the `updated_at` field to today's date
5. Click **"Propose changes"** — this opens a Pull Request automatically
6. A maintainer will review and merge your change

> **Tip:** This entire workflow happens in your browser — no terminal, no IDE, no `git clone` needed.

### Adding a New Plan

Adding a new file requires a fork:

1. [Fork this repository](https://github.com/IrvanFza/mycodingplan/fork) on GitHub
2. In your fork, create a new file: `src/data/plans/{slug}.yaml`
3. Use this template:

```yaml
name: "Plan Name"
slug: "plan-slug"
provider: "Provider Name"
badge: "PAID"            # FREE | PROMO | PAID
price_monthly: 20.00
promotional_price: null  # or a number if there's a promo
promotional_duration: null
description: "Short description of the plan."
external_url: "https://provider.com/pricing"
models:
  - model-slug-1
  - model-slug-2
limits:
  requests_per_minute: 50
  tokens_per_minute: 100000
  context_window: 200000
  daily_message_limit: 100
features:
  - "Feature one"
  - "Feature two"
categories:
  - paid
  - closed-source
student_discount: false
startup_credits: false
tools_compatible:
  - cursor
  - vscode
history:
  - date: "2026 Q1"
    event: "Initial launch"
community_reviews_summary: ""
community_score: 0
latency:
  average_ms: 1200
  uptime_percent: 99.8
updated_at: "2026-04-07"
```

4. [Open a Pull Request](https://github.com/IrvanFza/mycodingplan/compare) against `main`
5. A maintainer will review and merge — the site auto-deploys within ~2 minutes after merge

### Data Validation

All YAML files are validated against Zod schemas defined in `src/content.config.ts`. If your data doesn't match the schema, the CI build will fail with a descriptive error message so you can fix it before merge.

For full contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 🚢 Deployment

The site deploys automatically to GitHub Pages whenever code is pushed to `main`:

1. **Push to `main`** → GitHub Actions triggers `.github/workflows/deploy.yml`
2. **Astro builds** the static site to `dist/`
3. **GitHub Pages** serves it at `https://mycodingplan.com`
4. **Cloudflare** provides CDN caching and SSL

No manual deployment steps required.

## 🤝 Contributing

We welcome contributions of all kinds! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- How to submit a community stack
- How to update plan data
- How to report bugs
- Code contribution guidelines
- Development setup guide

## 📜 License

[MIT](LICENSE) — Free for personal and commercial use with attribution.

---

<p align="center">
  Built with ❤️ using <a href="https://astro.build">Astro</a> · © 2026 MyCodingPlan
</p>