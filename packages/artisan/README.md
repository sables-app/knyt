<div align="center">

[![Knyt](./docs/banner.svg)](https://knyt.dev/docs/artisan/)

🖌️ A reactive foundation for modern web solutions. <br /> Lightweight observables—memory-safe, microtask-optimized, and rigorously type-safe.

<small>

This package is part of [Knyt](https://knyt.dev/), a toolkit designed to simplify modern web development.

</small>

</div>

## Key benefits

- Works seamlessly with TypeScript
- Prevents memory leaks by design
- Framework-independent foundation
- Efficient update scheduling

## Key features

#### Core Reactivity Features

- **Automatic memory management** – Cleans up unused subscriptions to prevent memory leaks
- **RxJS interoperability** – Seamlessly integrates with RxJS and similar observable libraries
- **Observable values** – Monitor and react to changes in any value, whether mutable or immutable
- **Auto-updating derived values** - Computed properties that stay synchronized with their sources
- **Optimized change handling** - Batches updates efficiently using microtasks

#### Supporting Features

- **DOM/CSS type safety** - Runtime validation for elements, nodes and CSS rules
- **Middleware utilities** – Tools for building strongly-typed, async-ready processing pipelines
- **Essential utilities** - Optimized equality checks, debouncing and TypeScript helpers

## Install

You can use this package by installing either the [Knyt Toolkit](https://knyt.dev/docs/toolkit) or this standalone package.

_Knyt Toolkit:_

```sh
npm install knyt
```

_Standalone:_

```sh
npm install @knyt/artisan
```

## Usage

```ts
import { isDocumentFragment, mapRef, ref } from "knyt";

// Create a reactive reference
const count$ = ref(0);

// Create a derived (computed) reference
const label$ = mapRef(count$, (n) => `Count is: ${n}`);

const log = (text: string) => {
  console.info(text);
};

// Subscribe to changes
const subscription = label$.subscribe(log);

// Update the original reference
count$.set(2); // Console: Count is: 2
```

## Documentation

See https://knyt.dev/docs/artisan/

## Updates

See the [CHANGELOG](./CHANGELOG.md) for a list of changes.

## License

This package is licensed under the [BSD 3-Clause License](./LICENSE).

## Open-Source Initiative

This project is supported by [Sables Applications LLC](https://sables.app) as part of its open-source initiatives.
