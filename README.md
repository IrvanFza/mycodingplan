# MyCodingPlan

Compare AI coding plans and find your perfect setup.

## Tech Stack

- **Framework**: [Astro](https://astro.build/) v6
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4 + [daisyUI](https://daisyui.com/)
- **Language**: TypeScript (strict mode)
- **Deployment**: GitHub Pages

## Development

```sh
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```text
/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── images/
├── src/
│   ├── components/
│   │   ├── Navbar.astro
│   │   └── Footer.astro
│   ├── content.config.ts
│   ├── data/
│   │   ├── plans/
│   │   ├── models/
│   │   ├── tools/
│   │   └── stacks/
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── .github/
│   └── workflows/
│       └── deploy.yml
└── package.json
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)