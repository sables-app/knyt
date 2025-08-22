---
"create-knyt": patch
---

Move bundled dependencies to `devDependencies`. This prevents them from being installed when `create-knyt` is installed as a dependency, which is unnecessary.
