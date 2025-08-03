# `@knyt/html-type`

> HTML Type Definitions

<small>

This package provides TypeScript type definitions for HTML elements and their attributes. It is designed to be used with [Knyt](https://knyt.dev), but can also be used independently.

</small>

## Install

```sh
npm install @knyt/html-type
```

## Usage

```ts
import type { HTMLDivAttributes } from "@knyt/html-type";

const attrs = {
  id: "my-div",
  class: "my-class",
  style: "color: red;",
} satisfies HTMLDivAttributes;
```

## Updates

See the [CHANGELOG](./CHANGELOG.md) for a list of changes.

## Credits

This package is a fork of [@michijs/htmltype](https://github.com/michijs/htmltype). 🙏

## License

This package is licensed under the [MIT License](./LICENSE).
