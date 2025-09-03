<div align="center">

[![Knyt](./packages/toolkit/docs/banner.svg)](https://knyt.dev/)

🌃 A toolkit designed to simplify modern web development

[![npm](https://img.shields.io/npm/v/knyt?style=flat-square&labelColor=444)](https://www.npmjs.com/package/knyt)
[![GitHub](https://img.shields.io/badge/Source_Code-black?style=flat-square&label=GitHub&labelColor=444)](https://github.com/sables-app/knyt/tree/main/packages/artisan)
[![License](https://img.shields.io/badge/License-BSD_3_Clause-blue?style=flat-square&labelColor=444)](https://github.com/sables-app/knyt/blob/main/LICENSE)
<br />
![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6.svg?style=flat-square&logo=typescript&labelColor=444)
![Built for The Web](https://img.shields.io/badge/Built_for-The_Web-e34f26.svg?style=flat-square&logo=HTML5&labelColor=444)
![SSG with Bun](https://img.shields.io/badge/SSG_with-Bun-b49090.svg?style=flat-square&logo=bun&labelColor=444)

</div>

## Documentation

Documentation is available at [knyt.dev](https://knyt.dev).

## Key benefits

- **Declarative, type-safe UI building** with intuitive APIs for HTML, DOM, and SVG
- **Reactive programming essentials** for efficient, memory-safe state and effect management
- **Lightweight, observable state management** with batteries-included utilities
- **Web standards compliance** via native Custom Elements and Shadow DOM support
- **Constructable, type-safe style sheets** with seamless SSR and shadow DOM integration
- **Lit-compatible controller system** for advanced component logic and lifecycle management
- **Server-side rendering and hydration** for modern, performant web apps
- **Easy project scaffolding** with a CLI tool for rapid setup

## Try Knyt in JSFiddle

You can quickly try Knyt in JSFiddle, which provides an editor to quickly experiment with Knyt's client-side features. This is a great way to quickly test out Knyt's capabilities without needing to set up a full project.

[![Edit in JSFiddle](./packages/toolkit/docs/edit-in-jsfiddle.svg)](https://knyt.dev/try/jsfiddle)

## The Full-Stack Toolkit Built on Web Standards

### 🎻 Native Web Components, Standardized

- **Type-Safe Custom Elements**: Strongly-typed element/property definition with full TypeScript support
- **Web Standards Compliant**: Built on Custom Elements, Shadow DOM, and declarative patterns
- **Component Hydration**: Enables seamless server-side rendering and client-side hydration for interactive components
- [and more...][Knyt Luthier]

[Knyt Luthier]: https://knyt.dev/s/luthier

### 🧊 Server-Rendered. Static-Generated. Fully Hydrated.

- **Your rendering, your rules** – Mix SSG, SSR, and hydration with ease
- **Smart HTML includes**: Embed HTML, MDX, Web Components, and Views into your pages
- **Dependency management**: Automatic dependency resolution, bundling, injection, and hydration
- [and more...][Knyt Glazier]

[Knyt Glazier]: https://knyt.dev/s/glazier

### 🧵 Where Declarative UI Meets Native DOM

- **Fluent & Declarative APIs**: Use intuitive `html`, `dom`, and `svg` builders to declare elements and markup
- **Type-safe by design**: Comprehensive TypeScript support ensures strict types and intelligent autocompletion
- **Concurrent rendering**: Renders asynchronously for smoother interactions and declarative async operations
- **Native alignment**: 1:1 mapping to DOM properties—no abstractions, just browser standards
- [and more...][Knyt Weaver]

[Knyt Weaver]: https://knyt.dev/s/weaver

### 🖌️ Powerful Reactivity Without the Leaks

- **Reactive Primitives**: Observables, computed values, and effects for building reactive applications
- **Memory-safe observation** - Prevents leaks by ensuring unused subscriptions are garbage collected
- **RxJS interoperability** – Smoothly integrates with RxJS and similar observable libraries
- [and more...][Knyt Artisan]

[Knyt Artisan]: https://knyt.dev/s/artisan

### 👔 Type-Safe Styles, Built on Web Standards

- **[`adoptedStyleSheets`][adoptedStyleSheets] Support**: Effortless integration with [Constructable Stylesheets][] for SSR and shadow DOM
- **Type-Safe CSS-in-JS Utilities**: Strong TypeScript support for CSS objects, selectors, and rule names.
- [and more...][Knyt Tailor]

[Knyt Tailor]: https://knyt.dev/s/tailor
[adoptedStyleSheets]: https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets
[Constructable Stylesheets]: https://web.dev/articles/constructable-stylesheets

### 🔌 Reusable Logic for Web Components

- **Lit-Compatible Controllers**: `ReactiveController` system with lifecycle integration
- **Reactive State**: Hydratable state with computed/mapped values & effects
- [and more...][Knyt Tasker]

[Knyt Tasker]: https://knyt.dev/s/tasker

### 🗃️ Lightweight, observable state management

- **Observability**: Stores are both observables and observers, supporting reactive state management for full state, selections, and dispatched actions.
- **Batteries-included**: Provides built-in utilities for reducers, action creators, selectors, and debug logging.
- [and more...][Knyt Clerk]

[Knyt Clerk]: https://knyt.dev/s/clerk

### 🐣 Get Started in Seconds, Not Minutes

- **Scaffold Knyt projects**: Quickly set up new Knyt projects with a single command
- **Get Started Now**: Run `npm create knyt` in your terminal and start building immediately.

[Knyt Create]: https://knyt.dev/s/create

## Usage

To create a simple counter custom element, you could use the following code:

```ts
import { define, dom } from "knyt";

const Counter = define.element("my-counter", {
  lifecycle: (host) => {
    const count$ = host.hold(0);

    return () =>
      dom.button
        .type("button")
        .onclick(() => count$.value++)
        .$children(`Count: ${count$.value}`);
  },
});

export default Counter;
```

You can then add the element to the document:

```js
const counterElement = document.createElement("my-counter");
```

Alternatively, you can use [Knyt Glazier](https://knyt.dev/s/glazier) to render and include your custom element in an HTML page. For example, create an HTML file like this:

```html
<!doctype html>
<html lang="en">
  <head>
    <title>My Page</title>
  </head>
  <body>
    <knyt-include src="./Counter.ts"></knyt-include>
  </body>
</html>
```

By leveraging Bun's static site generation, you can use the `<knyt-include>` tag to embed your custom element in the page. This tag is part of Knyt's composition system, enabling easy inclusion and hydration of web components.

## Packages

|     | Package      | Description          | Link                                                                                                                               |
| --- | ------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 🖌️  | Knyt Artisan | Reactive foundation  | [![npm](https://img.shields.io/npm/v/@knyt/artisan?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/artisan) |
| 🗃️  | Knyt Clerk   | Observable store     | [![npm](https://img.shields.io/npm/v/@knyt/clerk?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/clerk)     |
| 🐣  | Knyt Create  | App scaffolding      | [![npm](https://img.shields.io/npm/v/create-knyt?style=flat-square&labelColor=444)](https://www.npmjs.com/package/create-knyt)     |
| 🧊  | Knyt Glazier | SSR & SSG            | [![npm](https://img.shields.io/npm/v/@knyt/glazier?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/glazier) |
| 🎻  | Knyt Luthier | Web components       | [![npm](https://img.shields.io/npm/v/@knyt/luthier?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/luthier) |
| 👔  | Knyt Tailor  | CSS-in-JS            | [![npm](https://img.shields.io/npm/v/@knyt/tailor?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/tailor)   |
| 🔌  | Knyt Tasker  | Reactive controllers | [![npm](https://img.shields.io/npm/v/@knyt/tasker?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/tasker)   |
| 🌃  | Knyt Toolkit | Client-side features | [![npm](https://img.shields.io/npm/v/knyt?style=flat-square&labelColor=444)](https://www.npmjs.com/package/knyt)                   |
| 🧵  | Knyt Weaver  | DOM renderer         | [![npm](https://img.shields.io/npm/v/@knyt/weaver?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/weaver)   |

## License

This project is licensed under the [BSD 3-Clause License](./LICENSE).

## Versioning

All Knyt packages follow [Semantic Versioning v2](https://semver.org/spec/v2.0.0.html).

## Open-Source Initiative

This project is supported by [Sables Applications LLC](https://sables.app) as part of its open-source initiatives.
