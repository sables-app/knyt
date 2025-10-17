# create-knyt

## 0.3.0

### Minor Changes

- 3f1f128: - Update all relative import paths to be explicit by add file extensions.
  - This improves compatibility with tools that require explicit file extensions in import statements; making the project more runtime agnostic.
  - Update Bun engine requirement to "^1.3.0" in all package.json files.
    - Run `bun upgrade` to update the latest version of Bun.
    - This is a `minor` change because we're still in the `0.x` version range; also the public API of the package remains unchanged.

## 0.2.0

### Minor Changes

- b73be99: Enable Knyt Live Mode (HMR) in scaffolding boilerplates.

## 0.1.1

### Patch Changes

- a8d141e: Update package versions of Knyt packages to "latest" in project boilerplates.

## 0.1.0

Initial release.
