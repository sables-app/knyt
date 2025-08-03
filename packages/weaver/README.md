<div align="center">

[![Knyt](./docs/banner.svg)](https://knyt.dev/docs/weaver/)

🧵 Declarative DOM renderer with 1:1 native browser APIs. Strictly separates HTML, DOM, and SVG with fully type-safe, explicit interfaces for props, children and refs.

<small>

This package is part of [Knyt](https://knyt.dev/), a toolkit designed to simplify modern web development.

</small>

</div>

## Key features

- **Fluent & Declarative APIs**: Use intuitive `html`, `dom`, and `svg` builders to declare elements
- **Type-safe by design**: Comprehensive TypeScript support ensures strict types and intelligent autocompletion
- **Native alignment**: 1:1 mapping to DOM APIs—no abstractions, just browser standards
- **Explicit contracts**: Props, children, and refs are strictly separated (no runtime ambiguity)
- **SSR-ready**: Render declarations, elements, and components to static markup
  - Pair with [Knyt Luthier](https://knyt.dev/docs/luthier/) for rendering closed declarative shadow roots
- **Stateless**: The DOM is the source of truth; no virtual DOM or reconciliation
- **Lightweight**: Minimal dependencies, minimal footprint
- **htmx-compatible**: First-class support for [htmx](https://htmx.org/) attributes

## Install

You can use this package by installing either the [Knyt Toolkit](https://knyt.dev/docs/toolkit) or this standalone package.

_Knyt Toolkit:_

```sh
npm install knyt
```

_Standalone:_

```sh
npm install @knyt/weaver
```

## Usage

The primary exports of this package are Declaration Builders and Declaration Processors. Declaration Builders are used to define the structure of the UI, while Declaration Processors handle the creation and manipulation of the actual DOM or markup. Together, these tools enable you to efficiently describe and render user interfaces.

- **Declaration Builders**: `html`, `dom`, and `svg` for creating declarations
- **Declaration Processors**: `build`, `update`, and `render` for DOM manipulation and rendering

In the example below, the `dom` builder is used to create an element declaration for a heading, and the `update` processor is used to update the `root` element to display the heading.

```ts
import { dom, update } from "@knyt/weaver";

const heading = dom.h1.$("Hello, world!");
const root = document.getElementById("app")!;

update(root, heading);
```

For cases that require more functionality, such as encapsulated behavior or custom lifecycle management, you can define custom web components using [Knyt Luthier](https://knyt.dev/docs/luthier/).

## Documentation

See https://knyt.dev/docs/weaver/

## Updates

See the [CHANGELOG](./CHANGELOG.md) for a list of changes.

## License

This package is licensed under the [BSD 3-Clause License](./LICENSE).

## Open-Source Initiative

This project is supported by [Sables Applications LLC](https://sables.app) as part of its open-source initiatives.
