<div align="center">

[![Knyt](./docs/banner.svg)](https://knyt.dev/s/luthier)

🎻 Create observable-powered Web Components with Shadow DOM and SSR support. <br /> Designed for extensibility without framework lock-in.

<small>

This package is part of [Knyt](https://knyt.dev/), a toolkit designed to simplify modern web development.

</small>

[![npm](https://img.shields.io/npm/v/@knyt/luthier?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/luthier)
[![GitHub](https://img.shields.io/badge/Source_Code-black?style=flat-square&label=GitHub&labelColor=444)](https://github.com/sables-app/knyt/tree/main/packages/luthier)
[![License](https://img.shields.io/badge/License-BSD_3_Clause-blue?style=flat-square&labelColor=444)](https://github.com/sables-app/knyt/blob/main/LICENSE)
<br />
![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6.svg?style=flat-square&logo=typescript&labelColor=444)
![Built for The Web](https://img.shields.io/badge/Built_for-The_Web-e34f26.svg?style=flat-square&logo=HTML5&labelColor=444)

</div>

## Key features

- **Type-Safe Custom Elements**: Strongly-typed element/property definition with full TypeScript support
- **Reactive Properties**: Observable properties with attribute sync and change events
- **Lifecycle Management**: Hooks, effects, and SSR-ready state hydration
- **StyleSheet Integration**: Works with [Knyt Tailor](https://knyt.dev/s/tailor) for dynamic CSS and adoptedStyleSheets
- **Web Standards Compliant**: Built on Custom Elements, Shadow DOM, and declarative patterns
- **Component Hydration**: Enables seamless server-side rendering and client-side hydration for interactive components
- **Developer-Friendly**: Clean shorthand syntax and debug-friendly errors

## Documentation

Documentation is available at [knyt.dev](https://knyt.dev), including an [introduction to Web Components with Knyt](https://knyt.dev/guide/web-components/introduction). Documentation also includes guides for:

- [Reactive properties](https://knyt.dev/guide/web-components/reactive-properties)
- [Reactivity](https://knyt.dev/guide/web-components/reactivity)
- [Controllers](https://knyt.dev/guide/web-components/controllers)
- [Styling](https://knyt.dev/guide/web-components/styling)
- [Lifecycle](https://knyt.dev/guide/web-components/lifecycle)
- [Hydration](https://knyt.dev/guide/web-components/hydration)
- [Containers](https://knyt.dev/guide/web-components/containers)
- [Options](https://knyt.dev/guide/web-components/options)

## Usage

To create a simple counter custom element, you could use the following code:

_Using the function API:_

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

const counterElement = document.createElement("my-counter");
```

_Using the class API:_

```ts
import { define, dom, KnytElement } from "knyt";

const Counter = define.element(
  "my-counter",
  class extends KnytElement {
    #count$ = this.hold(0);

    render() {
      return dom.button
        .type("button")
        .onclick(() => this.#count$.value++)
        .$children(`Count: ${this.#count$.value}`);
    }
  },
);

const counterElement = document.createElement("my-counter");
```

## Install

You can use this package by installing either the [Knyt Toolkit](https://knyt.dev/s/toolkit) or this standalone package.

_Knyt Toolkit:_

```sh
npm install knyt
```

_Standalone:_

```sh
npm install @knyt/luthier
```

## Updates

See the [CHANGELOG](./CHANGELOG.md) for a list of changes.

## License

This package is licensed under the [BSD 3-Clause License](./LICENSE).

## Open-Source Initiative

This project is supported by [Sables Applications LLC](https://sables.app) as part of its open-source initiatives.
