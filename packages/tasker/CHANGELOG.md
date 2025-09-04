# @knyt/tasker

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

- 1b66bcb: Add `watch` reactivity function and method.
- 17546b2: Update `InputStateController` to also accept a reference containing a subscriber.
- 1fda277: Add support for lifecycle interrupts.
- 2c4889e: Rename lifecycle delegate methods to be more concise.

  - Renamed `addLifecycleDelegate` to `addDelegate`
  - Renamed `removeLifecycleDelegate` to `removeDelegate`

### Patch Changes

- 7f7b136: Remove unused `jsesc` dependency.
- Updated dependencies [5dcabb0]
- Updated dependencies [d68f71c]
- Updated dependencies [816386a]
- Updated dependencies [01befa5]
- Updated dependencies [6881396]
- Updated dependencies [fa83e20]
- Updated dependencies [0287e64]
- Updated dependencies [322a223]
- Updated dependencies [f4acf1c]
- Updated dependencies [0f62709]
- Updated dependencies [5e4d5af]
- Updated dependencies [a84cd78]
- Updated dependencies [37211b0]
- Updated dependencies [3c6a422]
- Updated dependencies [81b65a7]
- Updated dependencies [d153558]
  - @knyt/tailor@0.1.0
  - @knyt/clerk@0.1.0
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

## 0.1.0-alpha.4

### Minor Changes

- 1fda277: Add support for lifecycle interrupts.

### Patch Changes

- 7f7b136: Remove unused `jsesc` dependency.
- Updated dependencies [0f62709]
  - @knyt/artisan@0.1.0-alpha.4

## 0.1.0-alpha.2

### Minor Changes

- 1b66bcb: Add `watch` reactivity function and method.
- 17546b2: Update `InputStateController` to also accept a reference containing a subscriber.
- 2c4889e: Rename lifecycle delegate methods to be more concise.

  - Renamed `addLifecycleDelegate` to `addDelegate`
  - Renamed `removeLifecycleDelegate` to `removeDelegate`

### Patch Changes

- Updated dependencies [5dcabb0]
- Updated dependencies [fa83e20]
- Updated dependencies [5e4d5af]
- Updated dependencies [3c6a422]
- Updated dependencies [81b65a7]
  - @knyt/tailor@0.1.0-alpha.2
  - @knyt/artisan@0.1.0-alpha.2
