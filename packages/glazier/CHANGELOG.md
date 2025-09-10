# @knyt/glazier

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
