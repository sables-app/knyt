<div align="center">

[![Knyt](./docs/banner.svg)](https://knyt.dev/pkg/glazier)

🧊 A smart [Bun](https://bun.sh/) plugin for HTML includes—embed HTML, MDX, Web Components, and Views into your pages.

<small>

This package is part of [Knyt](https://knyt.dev/), a toolkit designed to simplify modern web development.

</small>

[![npm](https://img.shields.io/npm/v/@knyt/glazier?style=flat-square&labelColor=444)](https://www.npmjs.com/package/@knyt/glazier)
[![GitHub](https://img.shields.io/badge/Source_Code-black?style=flat-square&label=GitHub&labelColor=444)](https://github.com/sables-app/knyt/tree/main/packages/glazier)
[![License](https://img.shields.io/badge/License-BSD_3_Clause-blue?style=flat-square&labelColor=444)](https://github.com/sables-app/knyt/blob/main/LICENSE)
<br />
![Built with Typescript](https://img.shields.io/badge/Built%20with-Typescript-3178c6.svg?style=flat-square&logo=typescript&labelColor=444)
![Runs on Bun](https://img.shields.io/badge/Runs%20on-Bun-b49090.svg?style=flat-square&logo=bun&labelColor=444)

</div>

## Key benefits

- **Write HTML, not templates** – Compose pages with standard HTML, no custom syntax
- **Built for Bun’s ecosystem** – Leverages native tooling and module resolution
- **Your rendering, your rules** – Mix SSG, SSR, and hydration seamlessly
- **Web Components, zero config** – Auto-detects components, renders open/closed\* shadow roots, requiring no wrapper logic
- **Pluggable content features** – MDX, frontmatter, and TOC integrate seamlessly\*\*
- **Extend without friction** – Middleware and plugin system for custom logic

<small>

\* _Closed shadow roots are rendered by implementing a simple interface, without exposing the shadow root._ <br />
\*\* _Add MDX features by installing plugins – the integration points are built in._

</small>

## Key features

#### HTML composition

- Composition using standard HTML tags - no custom templating syntax required
- Slot-based content interpolation for flexible layouts
- Native support for including and rendering [Web Components][]/[Views][]
- `Request`-driven architecture for dynamic data injection

[Web Components]: https://developer.mozilla.org/en-US/docs/Web/API/Web_components
[Views]: https://knyt.dev/guide/views

#### SSG & SSR

- Full static site generation for component-based HTML pages
- Complete server-side rendering for dynamic pages
- Partial HTML snippet rendering ([htmx][]-compatible)
- Web Component hydration via Knyt [Luthier][]
- Extensible through middleware with utilities for request data association/overrides

[htmx]: https://htmx.org
[Luthier]: https://knyt.dev/pkg/luthier

#### Batteries-included

- Built-in MDX and Web Component recognition
- Automatic frontmatter and table-of-contents extraction from MDX
- Optional file-based routing (document path to route conversion)
- Route-aware asset handling via Bun's static bundler

#### Dependency management

- Automatic dependency resolution, bundling and injection
- Progressive, non-blocking hydration strategy
- Memory-efficient virtual module system (no filesystem clutter)
- Seamless Bun integration: Leverages Bun's native toolchain and module system

## Install

```sh
bun add @knyt/glazier
```

Then, add the plugin to your `bunfig.toml` file:

```toml [bunfig.toml]
preload = ["@knyt/glazier/preload"]

[serve.static]
plugins = ["@knyt/glazier/plugin"]
```

Now you can use the plugin in your HTML files.

## Usage

To include an HTML snippet you can use the `<knyt-include>` tag:

```html
<!doctype html>
<html lang="en">
  <head>
    <title>My Page</title>
  </head>
  <body>
    <!-- Include an HTML snippet -->
    <knyt-include src="./body-content.html"></knyt-include>
  </body>
</html>
```

Then, run the Bun server:

```bash
NODE_ENV=production bun index.html
```

## Documentation

See https://knyt.dev/pkg/glazier

## Updates

See the [CHANGELOG](./CHANGELOG.md) for a list of changes.

## License

This package is licensed under the [BSD 3-Clause License](./LICENSE).

## Open-Source Initiative

This project is supported by [Sables Applications LLC](https://sables.app) as part of its open-source initiatives.
