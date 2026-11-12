# Samuel Alonso — Portfolio

Bilingual portfolio (Spanish at `/`, English at `/en/`) built to earn client trust through verifiable evidence: every case ships with a demo, repository, testimonial, artifact or a metric with a reproducible method, or the build fails.

## Stack

| Area         | Choice                                                                        |
| ------------ | ----------------------------------------------------------------------------- |
| Framework    | Astro 7, static output, Content Collections + MDX + Zod                       |
| Hosting      | Cloudflare Workers (Static Assets), deployed by Workers Builds                |
| Styling      | Tailwind CSS 4 with the theme reset to brand tokens (OKLCH, light/dark)       |
| Quality      | TypeScript 6, ESLint 10 (a11y), Prettier, cspell, Vitest, Playwright + axe    |
| Supply chain | pnpm 12, exact versions, 3-day release-age gate, SHA-pinned actions, gitleaks |

## Quality budgets

Enforced in CI:

- Lighthouse (mobile): performance ≥95, accessibility 100, best practices 100.
- LCP ≤1.8 s, CLS ≤0.05, TBT ≤100 ms.
- 0 axe violations (WCAG 2.2 AA) in ES/EN, light/dark, desktop/mobile.
- MDN HTTP Observatory A+, checked on the live deploy.

Design budgets, not yet enforced in CI: JavaScript ≤20 KB gzipped per page, home page ≤400 KB.

Production only receives commits that passed every gate, through the manual Deploy workflow. Merging to `main` does not deploy.

## Run locally

Requires Node 26.13.0 (see `.node-version`) and pnpm 12.18.0.

```sh
pnpm install          # frozen lockfile, supply-chain policy enforced
pnpm dev              # dev server at http://localhost:4321 (CSP exists only in the build)
pnpm check            # types, lint, format, spelling
pnpm test             # unit tests
pnpm build            # static build
pnpm test:e2e         # E2E + accessibility on the real build
```

## Documentation

The [Wiki](https://github.com/SamuelAlonso-debug/Samuel_Alonso_Portfolio/wiki) holds everything beyond the code:

- [Project principles](https://github.com/SamuelAlonso-debug/Samuel_Alonso_Portfolio/wiki/Project-principles): goal, constraints, working and design principles.
- [Requirements](https://github.com/SamuelAlonso-debug/Samuel_Alonso_Portfolio/wiki/Requirements): what the system must do and why.
- [Roadmap](https://github.com/SamuelAlonso-debug/Samuel_Alonso_Portfolio/wiki/Roadmap): phases and current status.
- [Contributing](https://github.com/SamuelAlonso-debug/Samuel_Alonso_Portfolio/wiki/Contributing): workflow, PR size limit, labels and conventions.

## License

Code: [MIT](LICENSE). Content (case text, testimonials, photos and diagrams in `src/content/` and `public/images/`): © Samuel Alonso Hernández, all rights reserved.
