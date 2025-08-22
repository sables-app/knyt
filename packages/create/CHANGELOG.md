# create-knyt

## 0.1.0-alpha.5

### Patch Changes

- cbd7485: Move bundled dependencies to `devDependencies`. This prevents them from being installed when `create-knyt` is installed as a dependency, which is unnecessary.

## 0.1.0-alpha.4

### Patch Changes

- cefa4b1: Fix the target path in Get Started message when the target path is the same as the current working directory.

## 0.1.0-alpha.3

### Patch Changes

- e2ea38a: Fix resolution of the package root path.

## 0.1.0-alpha.2

### Patch Changes

- ba7bc68: Fixes an issue in the `create-knyt` CLI bundle by embedding the necessary properties from the package.json instead of resolving the module and reading it at runtime.

## 0.1.0-alpha.0

### Patch Changes

- b813b21: Add missing dependencies to fullstack and static-site boilerplates.
