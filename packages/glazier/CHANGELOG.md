# @knyt/glazier

## 0.1.0

### Minor Changes

- 2403cfb: Rename the `serve` function to `serveMarkup` for clarity, as it specifically serves HTML markup. This change improves the function's name to better reflect its purpose in serving HTML content.
- c759983: - Add `getOriginServer` function to retrieve the server instance that is serving the request.
  - Update Glazier to use `BunRequest` type instead of `Request` type.
- 8e3071d: Add `knyt-request-id` header for logging and debugging purposes.
- c0dacee: Update `serve` to use the default plugin instance options by default
- 511fae6: Remove all comments from generated HTML, except those beginning with `@preserve`.
- 1b96d49: Add support for rendering string module paths with `serveMarkup`.

### Patch Changes

- 08502c8: Resolve an issue where the `<knyt-frontmatter>` tag was not handled in the proper sequence, resulting in the frontmatter being overlooked in certain scenarios. This update guarantees that the frontmatter is always processed first, ensuring it is accurately parsed and used by the application.
- 03ee975: Fixed asset references in Glazier includes by adding support for rewriting module paths.
- 5e4d5af: Renamed `MiddlewareRunner` methods to be more concise and intuitive:
  - `addMiddleware` -> `add`
  - `removeMiddleware` -> `remove`
  - `hasMiddleware` -> `has`
- 82b8d50: Correct hidden build directory name
- Updated dependencies [d27bcaa]
- Updated dependencies [6cb4e8d]
- Updated dependencies [d68f71c]
- Updated dependencies [649b3f1]
- Updated dependencies [01befa5]
- Updated dependencies [6881396]
- Updated dependencies [fa83e20]
- Updated dependencies [1b66bcb]
- Updated dependencies [0287e64]
- Updated dependencies [80c6d14]
- Updated dependencies [f4acf1c]
- Updated dependencies [0f62709]
- Updated dependencies [581e083]
- Updated dependencies [09f3dad]
- Updated dependencies [5e4d5af]
- Updated dependencies [7004a3c]
- Updated dependencies [37211b0]
- Updated dependencies [3c6a422]
- Updated dependencies [fe91b90]
- Updated dependencies [627f12c]
- Updated dependencies [1fda277]
- Updated dependencies [2c4889e]
- Updated dependencies [ad2c10f]
- Updated dependencies [d153558]
  - @knyt/luthier@0.1.0
  - @knyt/artisan@0.1.0
  - @knyt/weaver@0.1.0

## 0.1.0-alpha.2

### Minor Changes

- 2403cfb: Rename the `serve` function to `serveMarkup` for clarity, as it specifically serves HTML markup. This change improves the function's name to better reflect its purpose in serving HTML content.
- c759983: - Add `getOriginServer` function to retrieve the server instance that is serving the request.
  - Update Glazier to use `BunRequest` type instead of `Request` type.
- 8e3071d: Add `knyt-request-id` header for logging and debugging purposes.
- c0dacee: Update `serve` to use the default plugin instance options by default

### Patch Changes

- 08502c8: Resolve an issue where the `<knyt-frontmatter>` tag was not handled in the proper sequence, resulting in the frontmatter being overlooked in certain scenarios. This update guarantees that the frontmatter is always processed first, ensuring it is accurately parsed and used by the application.
- 5e4d5af: Renamed `MiddlewareRunner` methods to be more concise and intuitive:
  - `addMiddleware` -> `add`
  - `removeMiddleware` -> `remove`
  - `hasMiddleware` -> `has`
- 82b8d50: Correct hidden build directory name
- Updated dependencies [fa83e20]
- Updated dependencies [1b66bcb]
- Updated dependencies [5e4d5af]
- Updated dependencies [3c6a422]
- Updated dependencies [627f12c]
- Updated dependencies [2c4889e]
  - @knyt/artisan@0.1.0-alpha.2
  - @knyt/luthier@0.1.0-alpha.2

## 0.1.0-alpha.0

### Patch Changes

- 03ee975: Fixed asset references in Glazier includes by adding support for rewriting module paths.
