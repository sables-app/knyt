---
"create-knyt": patch
---

Fixes an issue in the `create-knyt` CLI bundle by embedding the necessary properties from the package.json instead of resolving the module and reading it at runtime.
