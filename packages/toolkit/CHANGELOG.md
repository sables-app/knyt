# knyt

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
  - @knyt/clerk@0.4.0
  - @knyt/html-type@0.4.0
  - @knyt/luthier@0.4.0
  - @knyt/tailor@0.4.0
  - @knyt/tasker@0.4.0
  - @knyt/weaver@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [9cf6c5a]
- Updated dependencies [3d7b43c]
- Updated dependencies [c2abcc3]
- Updated dependencies [faa654e]
- Updated dependencies [eee0d94]
- Updated dependencies [f91b6da]
- Updated dependencies [229dc4c]
- Updated dependencies [441458e]
  - @knyt/luthier@0.3.0
  - @knyt/tasker@0.3.0
  - @knyt/weaver@0.3.0
  - @knyt/artisan@0.3.0
  - @knyt/clerk@0.3.0
  - @knyt/tailor@0.3.0

## 0.2.1

### Patch Changes

- a651370: Add `"browser"` field to `package.json` to specify the browser entry point for bundlers and tools that support it. This helps ensure that the correct files are used when the package is consumed in a browser environment.

## 0.2.0

### Patch Changes

- Updated dependencies [3bcb930]
- Updated dependencies [0d9ee09]
  - @knyt/artisan@0.2.0
  - @knyt/tailor@0.2.0
  - @knyt/luthier@0.2.0
  - @knyt/tasker@0.2.0
  - @knyt/clerk@0.2.0
  - @knyt/weaver@0.2.0

## 0.1.0

Initial release.
