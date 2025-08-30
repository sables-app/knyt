<div align="center">

[![Knyt](./docs/banner.svg)](https://knyt.dev/pkg/artisan)

🖌️ A reactive foundation for modern web solutions. <br /> Lightweight observables—memory-safe, microtask-optimized, and rigorously type-safe.

<small>

This package is part of [Knyt](https://knyt.dev/), a toolkit designed to simplify modern web development.

</small>

[![npm](https://img.shields.io/npm/v/@knyt/artisan?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/artisan)
[![GitHub](https://img.shields.io/badge/Source_Code-black?style=flat-square&label=GitHub&labelColor=444)](https://github.com/sables-app/knyt/tree/main/packages/artisan)
[![License](https://img.shields.io/badge/License-BSD_3_Clause-blue?style=flat-square&labelColor=444)](https://github.com/sables-app/knyt/blob/main/LICENSE)
<br />
![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6.svg?style=flat-square&logo=typescript&labelColor=444)
![Runs Everywhere](https://img.shields.io/badge/Runs-Everywhere-f7df1e.svg?style=flat-square&logo=javascript&labelColor=444)

</div>

## Key benefits

- Framework-independent foundation
- Prevents memory leaks by design
- Efficient update scheduling
- Works seamlessly with TypeScript

## Key features

#### Core Reactivity Features

- **Automatic memory management** – Weak references ensure unused subscriptions are cleaned up to prevent memory leaks
- **Observable values** – Reactive references that can be subscribed to and updated
- **Auto-updating derived values** - Computed properties that stay synchronized with their sources
- **Optimized change handling** - Batches updates efficiently using microtasks
- **RxJS interoperability** – Seamlessly integrates with RxJS and similar observable libraries

#### Supporting Features

- **DOM/CSS type safety** - Runtime validation for elements, nodes and CSS rules
- **Middleware utilities** – Tools for building strongly-typed, async-ready processing pipelines
- **Essential utilities** - Optimized equality checks, debouncing and TypeScript helpers

## Documentation

Documentation is available at [knyt.dev](https://knyt.dev), including a [guide on observables](https://knyt.dev/guide/observables).

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

## Install

You can use this package by installing either the [Knyt Toolkit](https://knyt.dev/pkg/toolkit) or this standalone package.

_Knyt Toolkit:_

```sh
npm install knyt
```

_Standalone:_

```sh
npm install @knyt/artisan
```

## Updates

See the [CHANGELOG](./CHANGELOG.md) for a list of changes.

## License

This package is licensed under the [BSD 3-Clause License](./LICENSE).

## Open-Source Initiative

This project is supported by [Sables Applications LLC](https://sables.app) as part of its open-source initiatives.
