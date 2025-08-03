<div align="center">

[![Knyt](./docs/banner.svg)](https://knyt.dev/docs/tailor/)

👔 Type-Safe CSS-in-JS: Composable, Scoped & Web Component Ready

<small>

This package is part of [Knyt](https://knyt.dev/), a toolkit designed to simplify modern web development.

</small>

</div>

## Key features

- **Type-Safe CSS-in-JS Utilities**: Strong TypeScript support for CSS objects, selectors, and rule names
- **[`adoptedStyleSheets`][adoptedStyleSheets] Support**: Seamless integration with [Constructable Stylesheets][] for SSR and shadow DOM
- **SSR & Document Scoping**: Works with custom documents (server-side rendering & shadow DOM)
- **Scoped & Extensible StyleSheets**: Supports composition, mixins, and programmatic class/rule management
- **Efficient Style Management**: Integrates with [Knyt Luthier](https://knyt.dev/docs/luthier) to optimize style sheet reuse
- **CSS Serialization & Hashing**: Deterministic class/animation names via hashing to prevent duplication
- **Dynamic CSS Generation**: Runtime keyframe definition with hashed animation names and deduplicated styles
- **Utility Types & Guards**: Type helpers for validation, lengths, percentages, and serializable objects

[adoptedStyleSheets]: https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/adoptedStyleSheets
[Constructable Stylesheets]: https://web.dev/articles/constructable-stylesheets

## Install

You can use this package by installing either the [Knyt Toolkit](https://knyt.dev/docs/toolkit) or this standalone package.

_Knyt Toolkit:_

```sh
npm install knyt
```

_Standalone:_

```sh
npm install @knyt/tailor
```

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

## Documentation

See https://knyt.dev/docs/tailor/

## Updates

See the [CHANGELOG](./CHANGELOG.md) for a list of changes.

## License

This package is licensed under the [BSD 3-Clause License](./LICENSE).

## Open-Source Initiative

This project is supported by [Sables Applications LLC](https://sables.app) as part of its open-source initiatives.
