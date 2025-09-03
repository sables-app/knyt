<div align="center">

[![Knyt](./docs/banner.svg)](https://knyt.dev/s/weaver)

🧵 Declarative DOM renderer with 1:1 native browser APIs. Strictly separates HTML, DOM, and SVG with fully type-safe, explicit interfaces for props, children and refs.

<small>

This package is part of [Knyt](https://knyt.dev/), a toolkit designed to simplify modern web development.

</small>

[![npm](https://img.shields.io/npm/v/@knyt/weaver?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/weaver)
[![GitHub](https://img.shields.io/badge/Source_Code-black?style=flat-square&label=GitHub&labelColor=444)](https://github.com/sables-app/knyt/tree/main/packages/weaver)
[![License](https://img.shields.io/badge/License-BSD_3_Clause-blue?style=flat-square&labelColor=444)](https://github.com/sables-app/knyt/blob/main/LICENSE)
<br />
![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6.svg?style=flat-square&logo=typescript&labelColor=444)
![Built for The Web](https://img.shields.io/badge/Built_for-The_Web-e34f26.svg?style=flat-square&logo=HTML5&labelColor=444)
![Runs Everywhere](https://img.shields.io/badge/Runs-Everywhere-f7df1e.svg?style=flat-square&logo=javascript&labelColor=444)

</div>

## Key Features

- **Fluent & Declarative APIs**: Use intuitive `html`, `dom`, and `svg` builders to declare elements and markup
- **Type-safe by design**: Comprehensive TypeScript support ensures strict types and intelligent autocompletion
- **Concurrent rendering**: Renders asynchronously for smoother interactions and declarative async operations
- **Native alignment**: 1:1 mapping to DOM properties—no abstractions, just browser standards
- **Explicit contracts**: Props, children, and refs are strictly separated (no runtime ambiguity)
- **SSR-ready**: Render declarations, elements, and components to static markup
  - Pair with [Knyt Luthier](https://knyt.dev/s/luthier) for rendering closed declarative shadow roots
- **Stateless**: The DOM is the source of truth; no virtual DOM or reconciliation
- **Lightweight**: Minimal dependencies, minimal footprint
- **htmx-compatible**: First-class support for [htmx](https://htmx.org/) attributes

## Documentation

Documentation is available at [knyt.dev](https://knyt.dev), including a [guide on declarative rendering](https://knyt.dev/guide/declarative-rendering).

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

For cases that require more functionality, such as encapsulated behavior or custom lifecycle management, you can define custom web components using [Knyt Luthier](https://knyt.dev/s/luthier).

## Install

You can use this package by installing either the [Knyt Toolkit](https://knyt.dev/s/toolkit) or this standalone package.

_Knyt Toolkit:_

```sh
npm install knyt
```

_Standalone:_

```sh
npm install @knyt/weaver
```

## Updates

See the [CHANGELOG](./CHANGELOG.md) for a list of changes.

## License

This package is licensed under the [BSD 3-Clause License](./LICENSE).

## Open-Source Initiative

This project is supported by [Sables Applications LLC](https://sables.app) as part of its open-source initiatives.
