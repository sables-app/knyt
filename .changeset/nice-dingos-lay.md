---
"@knyt/luthier": minor
---

Add support for deferred content rendering.

- Added the `DeferredContent` element which hides its children until all async operations registered by child elements are complete.
- Added the `defer()` function to register async operations with the nearest enclosing `DeferredContent` element.
  `defer().thenRender()` can be used to defer rendering until the given async operations complete.
- Added the `KnytElement.defer()` method for easier access to the `defer()` function within custom elements.
