<div align="center">

[![Knyt](./docs/banner.svg)](https://knyt.dev/s/tailor)

👔 Type-Safe CSS-in-JS: Composable, Scoped & Web Component Ready

<small>

This package is part of [Knyt](https://knyt.dev/), a toolkit designed to simplify modern web development.

</small>

[![npm](https://img.shields.io/npm/v/@knyt/tailor?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/tailor)
[![GitHub](https://img.shields.io/badge/Source_Code-black?style=flat-square&label=GitHub&labelColor=444)](https://github.com/sables-app/knyt/tree/main/packages/tailor)
[![License](https://img.shields.io/badge/License-BSD_3_Clause-blue?style=flat-square&labelColor=444)](https://github.com/sables-app/knyt/blob/main/LICENSE)
<br />
![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6.svg?style=flat-square&logo=typescript&labelColor=444)
![Built for The Web](https://img.shields.io/badge/Built_for-The_Web-e34f26.svg?style=flat-square&logo=HTML5&labelColor=444)

</div>

## Key Features

- **Type-Safe CSS-in-JS Utilities**: Strong TypeScript support for CSS objects, selectors, and rule names
- **[`adoptedStyleSheets`][adoptedStyleSheets] Support**: Effortless integration with [Constructable Stylesheets][] for SSR and shadow DOM
- **SSR & Document Scoping**: Works with custom documents (server-side rendering & shadow DOM)
- **Scoped & Extensible StyleSheets**: Supports composition, mixins, and programmatic class/rule management
- **Efficient Style Management**: Integrates with [Knyt Luthier](https://knyt.dev/s/luthier) to optimize style sheet reuse
- **CSS Serialization & Hashing**: Deterministic class/animation names via hashing to prevent duplication
- **Dynamic CSS Generation**: Runtime keyframe definition with hashed animation names and deduplicated styles
- **Utility Types & Guards**: Type helpers for validation, lengths, percentages, and serializable objects

[adoptedStyleSheets]: https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets
[Constructable Stylesheets]: https://web.dev/articles/constructable-stylesheets

## Documentation

Documentation is available at [knyt.dev](https://knyt.dev), including a [guide on styling Web Components](https://knyt.dev/guide/web-components/styling).

## Usage

```ts
import { css } from "@knyt/tailor";

// Write your CSS as a template literal...
const colors = css`
  :root {
    --primary-color: lightblue;
  }
`;

// ...or as an object
const styles = css({
  button: {
    backgroundColor: "var(--primary-color)",
    color: "white",
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
  // Pseudo-classes and pseudo-elements are automatically handled
  "button:hover": {
    backgroundColor: "darkblue",
  },
  body: {
    // You can also provide your own selectors as a string or function
    selector: "body",
    styles: {
      margin: "0",
      padding: "2rem",
    },
  },
});

// Style sheets are composable and can be extended
styles.include(colors);

// Fully typed styles with unique class names
console.info(styles.classNames.button); // e.g., "knyt-abc123"

// Add stylesheet to the document (adoptedStyleSheets)
styles.addTo(document);

// Remove it when no longer needed
styles.removeFrom(document);
```

## Install

You can use this package by installing either the [Knyt Toolkit](https://knyt.dev/s/toolkit) or this standalone package.

_Knyt Toolkit:_

```sh
npm install knyt
```

_Standalone:_

```sh
npm install @knyt/tailor
```

## Updates

See the [CHANGELOG](./CHANGELOG.md) for a list of changes.

## License

This package is licensed under the [BSD 3-Clause License](./LICENSE).

## Open-Source Initiative

This project is supported by [Sables Applications LLC](https://sables.app) as part of its open-source initiatives.
