# @knyt/luthier

## 0.1.0

### Minor Changes

- d27bcaa: ### Changed

  - All lifecycle hooks are now called asynchronously.
  - Property change events are emitted before requesting an update on the host element.

  ### Removed

  - The `hostUpdate` lifecycle hook.

  ### Renamed

  - `hostBeforeUpdate` is now `hostUpdateRequested` for improved accuracy.
  - `LifecycleDelegate.hostUpdated` is now `LifecycleDelegate.hostAfterUpdate` to avoid confusion with `ReactiveController.hostUpdated`.

  ### Added

  - New `hostBeforeUpdate` lifecycle hook.

- 649b3f1: Deprecate usage of `this` and `host` in render functions.
- 1b66bcb: Add `watch` reactivity function and method.
- 80c6d14: Add support for deferred content rendering.

  - Added the `DeferredContent` element which hides its children until all async operations registered by child elements are complete.
  - Added the `defer()` function to register async operations with the nearest enclosing `DeferredContent` element.
    `defer().thenRender()` can be used to defer rendering until the given async operations complete.
  - Added the `KnytElement.defer()` method for easier access to the `defer()` function within custom elements.

- 581e083: Add typing support for creating element definitions for arbitrary elements.
- 7004a3c: - Rename `buildRoutes` to `bundleRoutes` for clarity.
  - Add `destroy()` method to `DocumentRouteBuilder` for cleanup.
  - The `onRequest` and `onConfigureRender` methods on `GlazierPlugin` now return a `Subscription` to allow for easy removal of handlers.
- fe91b90: Add support for server-side concurrent rendering using the `defer()` controller. Now the same component logic can be used on both client and server, with proper handling of async data fetching and rendering.

  This is currently considered a low-level API. Additional utility functions/controllers will be added in future releases to facilitate common server-side rendering -> hydration -> client-side rendering workflows.

- 627f12c: - Add support for using htmx locally, instead of relying on a global variable.
  - Fix htmx integration for components that are not hydrated.
- 1fda277: Add support for lifecycle interrupts.
- 2c4889e: Rename lifecycle delegate methods to be more concise.

  - Renamed `addLifecycleDelegate` to `addDelegate`
  - Renamed `removeLifecycleDelegate` to `removeDelegate`

### Patch Changes

- 6cb4e8d: Add assertion to `defineElementDefinition` to ensure `customElements` is available.
- 09f3dad: Correct the return types of `getProps` methods.
- ad2c10f: Update `InferProps` to support arbitrary element definitions.
- Updated dependencies [5dcabb0]
- Updated dependencies [d27bcaa]
- Updated dependencies [d68f71c]
- Updated dependencies [7f7b136]
- Updated dependencies [01befa5]
- Updated dependencies [6881396]
- Updated dependencies [fa83e20]
- Updated dependencies [1b66bcb]
- Updated dependencies [0287e64]
- Updated dependencies [322a223]
- Updated dependencies [17546b2]
- Updated dependencies [f4acf1c]
- Updated dependencies [0f62709]
- Updated dependencies [5e4d5af]
- Updated dependencies [37211b0]
- Updated dependencies [3c6a422]
- Updated dependencies [1fda277]
- Updated dependencies [2c4889e]
- Updated dependencies [81b65a7]
- Updated dependencies [d153558]
  - @knyt/tailor@0.1.0
  - @knyt/tasker@0.1.0
  - @knyt/artisan@0.1.0
  - @knyt/weaver@0.1.0

## 0.1.0-alpha.6

### Minor Changes

- d27bcaa: Lifecycle hooks update

  - **Changed**
    - All lifecycle hooks are now called asynchronously.
    - Property change events are emitted before requesting an update on the host element.
  - **Removed**
    - The `hostUpdate` lifecycle hook.
  - **Renamed**
    - `hostBeforeUpdate` is now `hostUpdateRequested` for improved accuracy.
    - `LifecycleDelegate.hostUpdated` is now `LifecycleDelegate.hostAfterUpdate` to avoid confusion with `ReactiveController.hostUpdated`.
  - **Added**
    - New `hostBeforeUpdate` lifecycle hook.

- fe91b90: Add support for server-side concurrent rendering with `defer()`
  - Now the same component logic can be used on both client and server, with proper handling of async data fetching and rendering.
  - This is considered a low-level API. Additional utility functions/controllers will be added in future releases to facilitate common server-side rendering -> hydration -> client-side rendering workflows.

### Patch Changes

- Updated dependencies [d27bcaa]
  - @knyt/tasker@0.1.0-alpha.6

## 0.1.0-alpha.5

### Minor Changes

- 80c6d14: Add support for deferred content rendering.

  - Added the `DeferredContent` element which hides its children until all async operations registered by child elements are complete.
  - Added the `defer()` function to register async operations with the nearest enclosing `DeferredContent` element.
    `defer().thenRender()` can be used to defer rendering until the given async operations complete.
  - Added the `KnytElement.defer()` method for easier access to the `defer()` function within custom elements.

### Patch Changes

- Updated dependencies [0287e64]
- Updated dependencies [f4acf1c]
- Updated dependencies [d153558]
  - @knyt/artisan@0.1.0-alpha.5
  - @knyt/weaver@0.1.0-alpha.5

## 0.1.0-alpha.4

### Minor Changes

- 649b3f1: Deprecate usage of `this` and `host` in render functions.
- 1fda277: Add support for lifecycle interrupts.

### Patch Changes

- Updated dependencies [7f7b136]
- Updated dependencies [0f62709]
- Updated dependencies [1fda277]
  - @knyt/tasker@0.1.0-alpha.4
  - @knyt/artisan@0.1.0-alpha.4

## 0.1.0-alpha.2

### Minor Changes

- 1b66bcb: Add `watch` reactivity function and method.
- 627f12c: - Add support for using htmx locally, instead of relying on a global variable.
  - Fix htmx integration for components that are not hydrated.
- 2c4889e: Rename lifecycle delegate methods to be more concise.

  - Renamed `addLifecycleDelegate` to `addDelegate`
  - Renamed `removeLifecycleDelegate` to `removeDelegate`

### Patch Changes

- Updated dependencies [5dcabb0]
- Updated dependencies [fa83e20]
- Updated dependencies [1b66bcb]
- Updated dependencies [17546b2]
- Updated dependencies [5e4d5af]
- Updated dependencies [3c6a422]
- Updated dependencies [2c4889e]
- Updated dependencies [81b65a7]
  - @knyt/tailor@0.1.0-alpha.2
  - @knyt/artisan@0.1.0-alpha.2
  - @knyt/tasker@0.1.0-alpha.2

## 0.1.0-alpha.1

### Patch Changes

- 09f3dad: Correct the return types of `getProps` methods.
- Updated dependencies [01befa5]
  - @knyt/artisan@0.1.0-alpha.1
