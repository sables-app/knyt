---
"@knyt/glazier": minor
---

- Remove `yaml` dependency and use the native Bun YAML parser instead.
- Update Bun engine requirement to "^1.1.21" in all package.json files.
  - Run `bun upgrade` to update the latest version of Bun.
  - This is a `minor` change because we're still in the `0.x` version range; also the public API of the package remains unchanged.
- Move `@types/bun` package from `devDependencies` to `dependencies`.
