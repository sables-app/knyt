# @knyt/luthier

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
  - @knyt/tailor@0.4.0
  - @knyt/tasker@0.4.0
  - @knyt/weaver@0.4.0

## 0.3.0

### Minor Changes

- 229dc4c: Add support for Knyt Live Mode.

  - Added Knyt Live Mode for HMR, optimized for Knyt's element system and HTML bundles.
  - Supports hot updates for composed elements and auto-refresh for builder-generated HTML.
  - Class-based elements and manual HTML files are not yet supported.

### Patch Changes

- 9cf6c5a: Enable management of adopted style sheets
  - add `hasStyleSheet` and `clearStyleSheets` methods
  - General clean up / refactoring
  - Prevent a potential bug if style sheet inputs return new a `CSSStyleSheet` instance every time they're normalized.
- c2abcc3: Add support for hot updates for composed `KnytElement`s created with `define.element()`.
- 441458e: Add support for safe setup and teardown of reactive properties from constructors and elements.
- Updated dependencies [9cf6c5a]
- Updated dependencies [3d7b43c]
- Updated dependencies [faa654e]
- Updated dependencies [eee0d94]
- Updated dependencies [f91b6da]
  - @knyt/tasker@0.3.0
  - @knyt/weaver@0.3.0
  - @knyt/artisan@0.3.0
  - @knyt/tailor@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [3bcb930]
- Updated dependencies [0d9ee09]
  - @knyt/artisan@0.2.0
  - @knyt/tailor@0.2.0
  - @knyt/tasker@0.2.0
  - @knyt/weaver@0.2.0

## 0.1.0

Initial release.
