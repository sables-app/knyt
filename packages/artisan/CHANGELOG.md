# @knyt/artisan

## 0.4.0

### Minor Changes

- 3f1f128: - Update all relative import paths to be explicit by add file extensions.
  - This improves compatibility with tools that require explicit file extensions in import statements; making the project more runtime agnostic.
  - Update Bun engine requirement to "^1.3.0" in all package.json files.
    - Run `bun upgrade` to update the latest version of Bun.
    - This is a `minor` change because we're still in the `0.x` version range; also the public API of the package remains unchanged.

## 0.3.0

### Minor Changes

- faa654e: Add `bufferObservable` and `mapObservable` utilities to the Knyt Artisan for enhanced data handling and transformation capabilities.

## 0.2.0

### Patch Changes

- 3bcb930: Improve `Reference` implementation to emit change notifications in a more expected manner.

  - Updated behavior with `Reference`s to avoid notifying subscribers multiple times for the same change.
  - Fix an issue with `Reference`s where multiple synchronous changes would lead to emitting duplicate notifications to subscribers.

## 0.1.0

Initial release.
