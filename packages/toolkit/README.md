<div align="center">

[![Knyt](./docs/banner.svg)](https://knyt.dev/docs/toolkit/)

🌃 A toolkit designed to simplify modern web development

<small>

This package contains all client-side features of [Knyt](https://knyt.dev/). <br />For server-side capabilities, refer to the [Knyt Glazier](https://knyt.dev/docs/glazier/), [Bun](https://bun.sh/) plugin.

</small>

[ ![npm](https://img.shields.io/npm/v/@knyt/artisan?style=flat-square&labelColor=444) ](https://www.npmjs.com/package/@knyt/artisan)
[ ![GitHub](https://img.shields.io/badge/Source_Code-black?style=flat-square&label=GitHub&labelColor=444) ](https://github.com/sables-app/knyt/tree/main/packages/artisan)
[ ![License](https://img.shields.io/badge/License-BSD_3_Clause-blue?style=flat-square&labelColor=444) ](https://github.com/sables-app/knyt/blob/main/LICENSE)
<br />
![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6.svg?style=flat-square&logo=typescript&labelColor=444)
![Built for the web](https://img.shields.io/badge/Built_for-the_web-e34f26.svg?style=flat-square&logo=HTML5&labelColor=444)

</div>

## Key benefits

- **Declarative, type-safe UI building** with intuitive APIs for HTML, DOM, and SVG
- **Reactive programming essentials** for efficient, memory-safe state and effect management
- **Lightweight, observable state management** with batteries-included utilities
- **Web standards compliance** via native Custom Elements and Shadow DOM support
- **Constructable, type-safe style sheets** with seamless SSR and shadow DOM integration
- **Lit-compatible controller system** for advanced component logic and lifecycle management
- **Server-side rendering and hydration** for modern, performant web apps
- **Easy project scaffolding** with a CLI tool for rapid setup

## Toolkit features

#### Native Web Components (🎻 _[Knyt Luthier][]_)

- **Type-Safe Custom Elements**: Strongly-typed element/property definition with full TypeScript support
- **Web Standards Compliant**: Built on Custom Elements, Shadow DOM, and declarative patterns
- **Component Hydration**: Enables seamless server-side rendering and client-side hydration for interactive components
- [and more...][Knyt Luthier]

[Knyt Luthier]: https://knyt.dev/docs/luthier/

#### Server-side capabilities (🧊 _[Knyt Glazier][]_)

- **Smart HTML includes**: Embed HTML, MDX, Web Components, and Views into your pages
- **Dependency management**: Automatic dependency resolution, bundling, injection, and hydration
- [and more...][Knyt Glazier]

[Knyt Glazier]: https://knyt.dev/docs/glazier/

#### Declarative DOM renderer (🧵 _[Knyt Weaver][]_)

- **Fluent & Declarative APIs**: Use intuitive `html`, `dom`, and `svg` builders to declare elements
- **Type-safe by design**: Comprehensive TypeScript support ensures strict types and intelligent autocompletion
- **Native alignment**: 1:1 mapping to DOM APIs—no abstractions, just browser standards
- [and more...][Knyt Weaver]

[Knyt Weaver]: https://knyt.dev/docs/weaver/

#### Reactive essentials (🖌️ _[Knyt Artisan][]_)

- **Memory-safe observation** - Prevents leaks by automatically cleaning up unused subscriptions
- **RxJS interoperability** – Seamlessly integrates with RxJS and similar observable libraries
- [and more...][Knyt Artisan]

[Knyt Artisan]: https://knyt.dev/docs/artisan/

#### Type-safe, composable CSS-in-JS (👔 _[Knyt Tailor][]_)

- **Type-Safe CSS-in-JS Utilities**: Strong TypeScript support for CSS objects, selectors, and rule names.
- **[`adoptedStyleSheets`][adoptedStyleSheets] Support**: Seamless integration with [Constructable Stylesheets][] for SSR and shadow DOM
- [and more...][Knyt Tailor]

[Knyt Tailor]: https://knyt.dev/docs/tailor/
[adoptedStyleSheets]: https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets
[Constructable Stylesheets]: https://web.dev/articles/constructable-stylesheets

#### Web component controllers (🗺️ _[Knyt Tasker][]_)

- **Lit-Compatible Controllers**: `ReactiveController` system with lifecycle integration
- **Reactive State**: Hydratable state with computed/mapped values & effects
- [and more...][Knyt Tasker]

[Knyt Tasker]: https://knyt.dev/docs/tasker/

#### Lightweight, observable state management (🗃️ _[Knyt Clerk][]_)

- **Observability**: Stores are both observables and observers, supporting reactive state management for full state, selections, and dispatched actions.
- **Batteries-included**: Provides built-in utilities for reducers, action creators, selectors, and debug logging.
- [and more...][Knyt Clerk]

[Knyt Clerk]: https://knyt.dev/docs/clerk/

#### Scaffolding CLI tool (🎬 _[Knyt Gaffer][]_)

- **Scaffold Knyt projects**: Quickly set up new Knyt projects with a single command
- Get started by running `npm create knyt` in your terminal

[Knyt Gaffer]: https://knyt.dev/docs/gaffer/

## Install

```bash
npm install knyt
```

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

Alternatively, you can use [Knyt Glazier](https://knyt.dev/docs/glazier/) to render and include your custom element in an HTML page. For example, create an HTML file like this:

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

By leveraging Bun's static site generation, you can use the `<knyt-include>` tag to embed your custom element in the page. This tag is part of Knyt's composition system, enabling seamless inclusion and hydration of web components.

## Documentation

See https://knyt.dev/

## Updates

See the [CHANGELOG](./CHANGELOG.md) for a list of changes.

## License

This package is licensed under the [BSD 3-Clause License](./LICENSE).

## Open-Source Initiative

This project is supported by [Sables Applications LLC](https://sables.app) as part of its open-source initiatives.
