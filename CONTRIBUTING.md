# Contributing to mdwysiwyg

Thanks for considering a contribution! This project is developed spec-first — every feature
starts as a written spec under [`specs/`](./specs/) before code is written.

## Reporting bugs

Open an [issue](https://github.com/ferkiernan/mdwysiwyg/issues) with:
- A minimal reproduction (code snippet or a fork of the [demo](https://ferkiernan.github.io/mdwysiwyg/))
- Expected vs. actual behavior
- Browser/environment details if relevant

## Proposing a feature

Open an issue describing the use case before sending a PR for anything non-trivial — it saves
rework if the approach needs discussion. Check [`specs/`](./specs/) first; your idea might already
be planned or explicitly out of scope for a reason documented there.

## Development setup

```bash
git clone https://github.com/ferkiernan/mdwysiwyg.git
cd mdwysiwyg
npm install
npm run dev        # playground at http://localhost:5173
npm test            # run the test suite
npm run typecheck   # strict TypeScript check
npm run build        # produce dist/ (ESM + CJS + .d.ts)
```

## Guidelines

- **TypeScript strict, no `any`** without an explicit justification comment.
- **Tests required** for behavior changes — Vitest + React Testing Library, testing observable
  behavior (what a user sees/does), not internal implementation.
- **Minimize dependencies** — a new dependency needs a concrete justification (see any
  `specs/*/research.md` for examples of how past decisions were documented).
- **Accessibility matters** — interactive elements need proper ARIA attributes and keyboard
  support.
- **No new props without a real use case** — prefer composition/CSS Custom Properties over
  growing the props surface (see the project's [constitution](./.specify/memory/constitution.md)
  for the full rationale).

## Pull requests

1. Fork, branch from `master`.
2. Make your change with tests.
3. Run `npm run typecheck && npm test && npm run build` locally — all three must pass.
4. Open a PR describing what changed and why.

By contributing, you agree your contributions are licensed under this project's
[MIT License](./LICENSE).
