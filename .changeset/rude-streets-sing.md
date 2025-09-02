---
"@knyt/luthier": minor
"create-knyt": minor
---

- Rename `buildRoutes` to `bundleRoutes` for clarity.
- Add `destroy()` method to `DocumentRouteBuilder` for cleanup.
- The `onRequest` and `onConfigureRender` methods on `GlazierPlugin` now return a `Subscription` to allow for easy removal of handlers.
