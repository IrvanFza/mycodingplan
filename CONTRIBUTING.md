# Contributing to MyCodingPlan

Thank you for your interest in contributing to MyCodingPlan! Whether you're submitting a community stack, updating plan data, fixing a bug, or adding a feature — every contribution helps the developer community make better-informed decisions.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
  - [Submit a Community Stack](#submit-a-community-stack)
  - [Update Plan Data](#update-plan-data)
  - [Report a Bug](#report-a-bug)
  - [Suggest a Feature](#suggest-a-feature)
  - [Contribute Code](#contribute-code)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style & Conventions](#code-style--conventions)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers via [GitHub Issues](https://github.com/IrvanFza/mycodingplan/issues).

---

## How to Contribute

### Submit a Community Stack

Share your AI coding setup with the community! You can submit via **GitHub Discussion** or **Pull Request**.

#### Option A: GitHub Discussion (Easiest)

1. Go to [Discussions → Stack Submissions](https://github.com/IrvanFza/mycodingplan/discussions/categories/stack-submissions)
2. Create a new discussion
3. Paste this YAML template and fill it in:

```yaml
id: "stack-XXX"           # We'll assign the next available ID
author: "your-github-username"
title: "Your Stack Name"
tools:
  - tool-slug-1           # Use slugs from src/data/tools/
  - tool-slug-2
monthly_cost: 0           # Total monthly cost in USD
description: "Brief description of your setup and why you chose it."
upvotes: 0
submitted_at: "2026-04-07" # Today's date (YYYY-MM-DD)
```

4. A maintainer will review and add your stack to the site.

#### Option B: Pull Request

1. Fork the repository
2. Create a new file: `src/data/stacks/stack-XXX.yaml` (use the next available number)
3. Fill in the template above
4. Submit a PR with the title: `feat: add community stack — "Your Stack Name"`

#### Available Tool Slugs

Use these slugs in the `tools` array:

| Slug | Tool |
|---|---|
| `android-studio` | Android Studio |
| `claude-code` | Claude Code CLI |
| `codex` | OpenAI Codex |
| `cursor` | Cursor |
| `edlide` | Edlide |
| `gemini-cli` | Gemini CLI |
| `github-copilot` | GitHub Copilot |
| `google-antigravity` | Google Antigravity IDE |
| `jetbrains` | JetBrains IDEs |
| `kilo` | Kilo |
| `kimi-cli` | Kimi CLI |
| `kiro` | Kiro |
| `mistral-vibe` | Mistral Vibe / Le Chat |
| `opencode` | OpenCode |
| `vscode` | VS Code |
| `windsurf` | Windsurf |

---

### Update Plan Data

Plan data is stored as YAML files in `src/data/plans/`. If you notice outdated pricing, incorrect limits, or missing information:

#### Quick Edit (Existing Files)

1. Navigate to the file on GitHub (e.g., [`src/data/plans/cursor-pro.yaml`](https://github.com/IrvanFza/mycodingplan/blob/main/src/data/plans/cursor-pro.yaml))
2. Click the **pencil icon** (✏️) — GitHub will automatically fork the repo for you
3. Edit the fields you want to change
4. Update the `updated_at` field to today's date
5. Click **"Propose changes"** — this opens a Pull Request automatically

#### Adding a New Plan (Requires Fork)

1. [Fork this repository](https://github.com/IrvanFza/mycodingplan/fork)
2. In your fork, create a new file: `src/data/plans/{slug}.yaml`
3. Fill in the template below
4. [Open a Pull Request](https://github.com/IrvanFza/mycodingplan/compare) with the title: `feat: add {plan-name}`

> **Note:** All changes go through Pull Request review to ensure data quality and schema validation.

#### Plan YAML Template

```yaml
name: "Plan Name"
slug: "plan-slug"
provider: "Provider Name"
badge: "PAID"               # FREE | PROMO | PAID
price_monthly: 20.00
promotional_price: null
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
    event: "Description of what changed"
community_reviews_summary: ""
community_score: 0
latency:
  average_ms: 1200
  uptime_percent: 99.8
updated_at: "2026-04-07"
```

---

### Report a Bug

Found something broken? Please open a [GitHub Issue](https://github.com/IrvanFza/mycodingplan/issues/new) with:

- **Title:** Clear, concise summary (e.g., "FilterBar doesn't clear badge filters")
- **Description:** What happened vs. what you expected
- **Steps to Reproduce:** Numbered steps to trigger the bug
- **Screenshots:** If applicable (especially for UI bugs)
- **Browser & OS:** Your environment details

---

### Suggest a Feature

Have an idea to make MyCodingPlan better?

1. Check [existing discussions](https://github.com/IrvanFza/mycodingplan/discussions/categories/feature-requests) to see if it's already been proposed
2. If not, create a new discussion in the **Feature Requests** category
3. Describe the feature, why it's valuable, and how it might work

---

### Contribute Code

Ready to write some code? Here's how:

1. **Find an issue** — Look for issues labeled `good first issue` or `help wanted`
2. **Comment on the issue** — Let others know you're working on it
3. **Fork & branch** — Create a feature branch from `main`
4. **Write code** — Follow the [code style guidelines](#code-style--conventions) below
5. **Test locally** — Run `npm run build` to verify no schema or build errors
6. **Submit a PR** — Follow the [PR process](#pull-request-process)

---

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 22.12.0
- npm (comes with Node.js)
- Git

### Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/mycodingplan.git
cd mycodingplan

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
# → Opens at http://localhost:4321

# 5. Create a feature branch
git checkout -b feat/your-feature-name
```

### Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production (validates schemas) |
| `npm run preview` | Preview the production build |

---

## Project Structure

```
src/
├── components/          # UI components (.astro = static, .tsx = React island)
├── content.config.ts    # Zod schemas for content collections
├── data/                # YAML data files
│   ├── plans/           # AI coding plans
│   ├── models/          # AI models
│   ├── tools/           # IDE & development tools
│   └── stacks/          # Community coding stacks
├── layouts/             # Page layouts (BaseLayout, PlanLayout)
├── pages/               # Route-based pages
└── styles/              # Global CSS
```

### Key Files

| File | Purpose |
|---|---|
| `src/content.config.ts` | Zod schemas — all YAML data is validated against these |
| `astro.config.mjs` | Astro configuration (output, site URL, integrations) |
| `src/layouts/BaseLayout.astro` | HTML head, meta tags, fonts, global structure |
| `src/styles/global.css` | Tailwind CSS + daisyUI imports |

---

## Code Style & Conventions

### General

- **TypeScript** — Use strict types; avoid `any`
- **Formatting** — Use consistent indentation (2 spaces)
- **Naming** — Use kebab-case for file names, PascalCase for components
- **Comments** — Add comments for non-obvious logic only

### Astro Components (`.astro`)

- Static components that ship zero JavaScript
- Use for layout, cards, navigation, and content display
- Follow the existing pattern: frontmatter (`---`) → HTML template → scoped `<style>`

### React Islands (`.tsx`)

- Interactive components that hydrate on the client
- Use `client:visible` or `client:load` directives in Astro pages
- Keep islands small and focused — don't make entire pages React
- Use only where interactivity is genuinely needed (wizard, filters, charts)

### Data Files (`.yaml`)

- One file per entity (one plan per file, one model per file, etc.)
- File name must match the `slug` field
- All fields defined in `src/content.config.ts` must be present
- Use ISO date format (`YYYY-MM-DD`) for date fields

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|---|---|
| `feat:` | New feature or component |
| `fix:` | Bug fix or data correction |
| `docs:` | Documentation only |
| `style:` | Formatting, no logic change |
| `refactor:` | Code restructure, no feature change |
| `chore:` | Build, deps, config changes |

---

## Pull Request Process

1. **Branch naming:** `feat/short-description`, `fix/short-description`, `docs/short-description`
2. **PR title:** Use conventional commit format (e.g., `feat: add new plan comparison feature`)
3. **PR description:** Explain _what_ changed and _why_
4. **Verify build:** Run `npm run build` locally before submitting
5. **One concern per PR:** Keep PRs focused — don't mix unrelated changes
6. **Screenshots:** Include screenshots for any UI changes

### Review

- A maintainer will review your PR within a few days
- Address any requested changes by pushing new commits to your branch
- Once approved, the maintainer will merge your PR

---

## Questions?

- 💬 [GitHub Discussions](https://github.com/IrvanFza/mycodingplan/discussions) — General questions and community chat
- 🐛 [GitHub Issues](https://github.com/IrvanFza/mycodingplan/issues) — Bug reports and feature requests

Thank you for helping make MyCodingPlan better for everyone! 🚀
