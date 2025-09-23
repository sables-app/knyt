# @knyt/glazier

## 0.3.0

### Minor Changes

- dce4de5: - Update Bun engine requirement to "^1.2.22" in all package.json files.
  - Run `bun upgrade` to update the latest version of Bun.
  - This is a `minor` change because we're still in the `0.x` version range; also the public API of the package remains unchanged.
- 229dc4c: Add support for Knyt Live Mode.

  - Added Knyt Live Mode for HMR, optimized for Knyt's element system and HTML bundles.
  - Supports hot updates for composed elements and auto-refresh for builder-generated HTML.
  - Class-based elements and manual HTML files are not yet supported.

### Patch Changes

- 48d5e7e: Fix type compatibility for `AnyRequest` to support both `Request` and `BunRequest`, preventing conflicts with global `Request` types from other dependencies.
- Updated dependencies [9cf6c5a]
- Updated dependencies [3d7b43c]
- Updated dependencies [c2abcc3]
- Updated dependencies [faa654e]
- Updated dependencies [eee0d94]
- Updated dependencies [229dc4c]
- Updated dependencies [441458e]
  - @knyt/luthier@0.3.0
  - @knyt/weaver@0.3.0
  - @knyt/artisan@0.3.0

## 0.2.0

### Minor Changes

- 43c2373: - Remove `yaml` dependency and use the native Bun YAML parser instead.
  - Update Bun engine requirement to "^1.2.21" in all package.json files.
    - Run `bun upgrade` to update the latest version of Bun.
    - This is a `minor` change because we're still in the `0.x` version range; also the public API of the package remains unchanged.
  - Move `@types/bun` package from `devDependencies` to `dependencies`.

### Patch Changes

- Updated dependencies [3bcb930]
  - @knyt/artisan@0.2.0
  - @knyt/luthier@0.2.0
  - @knyt/weaver@0.2.0

## 0.1.1

### Patch Changes

- d1a227f: Add detection for unexpected imports when bundling client-side code. This helps prevent runtime errors due to server-only modules being included in client bundles, and possible security issues from exposing server code to the client.

## 0.1.0

Initial release.
