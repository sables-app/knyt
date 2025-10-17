# @knyt/weaver

## 0.4.0

### Minor Changes

- 3f1f128: - Update all relative import paths to be explicit by add file extensions.
  - This improves compatibility with tools that require explicit file extensions in import statements; making the project more runtime agnostic.
  - Update Bun engine requirement to "^1.3.0" in all package.json files.
    - Run `bun upgrade` to update the latest version of Bun.
    - This is a `minor` change because we're still in the `0.x` version range; also the public API of the package remains unchanged.

### Patch Changes

- Updated dependencies [3f1f128]
  - @knyt/artisan@0.4.0
  - @knyt/html-type@0.4.0

## 0.3.0

### Patch Changes

- 3d7b43c: Correct handling of empty strings in development-only assertions during updates
- eee0d94: Fixed broken event listener comparison.
- Updated dependencies [faa654e]
  - @knyt/artisan@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [3bcb930]
  - @knyt/artisan@0.2.0

## 0.1.0

Initial release.
