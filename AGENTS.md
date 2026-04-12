# Knyt — Agent Guidelines

## Project Summary

Knyt is a full-stack TypeScript toolkit for modern web development built on native web standards (Custom Elements, Shadow DOM, Constructable Stylesheets). It is a Bun-based monorepo (`packages/*`) with the following packages:

| Package | Description |
|---|---|
| `@knyt/artisan` | Reactive primitives — Observables, computed values, effects |
| `@knyt/clerk` | Lightweight observable state management (reducers, actions, selectors) |
| `@knyt/glazier` | Server-side rendering and static site generation |
| `@knyt/html-type` | HTML type definitions |
| `@knyt/luthier` | Type-safe Custom Elements and Web Component authoring |
| `@knyt/tailor` | CSS-in-JS utilities with `adoptedStyleSheets` support |
| `@knyt/tasker` | Lit-compatible reactive controllers for Web Components |
| `@knyt/weaver` | Declarative DOM renderer with fluent `html`/`dom`/`svg` builders |
| `knyt` (toolkit) | Client-side umbrella package re-exporting the core feature set |
| `create-knyt` | CLI scaffolding tool (`npm create knyt`) |

All packages follow [Semantic Versioning v2](https://semver.org/spec/v2.0.0.html) and are linked together in the changeset config, so a version bump applies uniformly across `knyt` and all `@knyt/*` packages.

---

## Using the Changeset CLI

[Changesets](https://github.com/changesets/changesets) manages versioning and changelogs for this monorepo.

### 1. Record a change after modifying a package

Run this after completing work that should be released:

```sh
bunx changeset add
```

The interactive prompt will ask which packages were changed and whether the change is a `patch`, `minor`, or `major` bump. A new markdown file is created under `.changeset/`.

Use `--message` to skip the editor prompt:

```sh
bunx changeset add --message "fix: correct debounce flush behavior"
```

### 2. Check pending changesets

```sh
bunx changeset status
```

Add `--since main` to see only changesets added since the main branch:

```sh
bunx changeset status --since main
```

### 3. Apply version bumps (maintainers only)

Consuming the recorded changesets and bumping `package.json` versions + updating `CHANGELOG.md` files:

```sh
bunx changeset version
```

### 4. Publish (maintainers only)

```sh
bunx changeset publish
```

---

## Running Checks and Tests

Always run type-checking and tests after making changes to confirm nothing is broken.

### Type-check

```sh
bun run check
```

Runs `tsc --build --noEmit` against the full test tsconfig, which includes all packages. Fix any type errors before committing.

### Run all tests

```sh
bun run test
```

This runs two suites in sequence:

| Script | Command | Notes |
|---|---|---|
| `test:other` | `bun test` | All tests except deferred-content |
| `test:deferred-content` | `bun test DeferredContent.test.ts --rerun-each=5` | Runs with `TEST_DEFERRED_CONTENT=true`; re-run 5× for stability |

### Run tests in watch mode

```sh
bun run test:watch
```

### Run a specific test file

```sh
bun test packages/artisan/src/__tests__/chain.test.ts
```
